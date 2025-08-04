import prisma from "../prismaClient";
import {
  validateSalesData,
  parseCSV,
  parseExcel,
} from "../utils/fileValidator";
import { createAlert } from "./alertService"; // o la ruta correcta

const SUPPORTED_MIME_TYPES = {
  CSV: "text/csv",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  XLS: "application/vnd.ms-excel",
} as const;

interface FileUploadInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  userId: string;
  onProgress?: (progress: number) => void;
}

interface ValidatedRow {
  sku: string;
  fecha: string;
  cantidad: number;
  precio: number;
  promocion: boolean;
  categoria: string;
}

export interface RawRow {
  [key: string]: string | number | boolean | null;
}

export interface PreviewResult {
  data: RawRow[];
  suggestedMapping: Record<string, string>;
  errors: string[];
}

interface MappingInput {
  fileName: string;
  mapping: Record<string, string>;
  userId: string;
}

interface ConfirmUploadInput {
  fileName: string;
  userId: string;
}

interface ProcessingResult {
  totalProcessed: number;
  fileName: string;
  uploadedAt: Date;
}

class FileProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "FileProcessingError";
  }
}

export class FileUploadService {
  private static readonly BATCH_SIZE = 1000;

  public static normalizeColumnName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, "_");
  }

  // ✅ Hacer público el método createAlert también
  public static async createAlert(
    userId: string,
    message: string,
    sku?: string
  ) {
    await prisma.alert.create({
      data: {
        userId,
        sku: sku || "N/A",
        message,
        forecastDate: new Date(),
        createdAt: new Date(),
      },
    });
  }

  static async processFileUpload(
    input: FileUploadInput
  ): Promise<ProcessingResult> {
    try {
      this.validateInput(input);
      const rawData = await this.parseFile(input);
      const validatedData = this.validateData(rawData);
      const result = await this.saveToDatabase(validatedData, input);

      await this.createAlert(
        input.userId,
        `Archivo ${input.originalname} cargado exitosamente (${result.totalProcessed} filas procesadas)`
      );

      input.onProgress?.(100);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      await this.createAlert(
        input.userId,
        `Error procesando archivo: ${errorMessage}`
      );
      if (error instanceof FileProcessingError) throw error;
      throw new FileProcessingError(
        `Error procesando archivo: ${errorMessage}`,
        "PROCESSING_ERROR"
      );
    }
  }

  static async previewFileUpload(
    input: FileUploadInput
  ): Promise<PreviewResult> {
    try {
      this.validateInput(input);
      const rawData = await this.parseFile(input);
      const validatedData = this.validateData(rawData);

      const suggestedMapping: Record<string, string> = {};
      const firstRow = rawData[0] || {};
      for (const key of Object.keys(firstRow)) {
        suggestedMapping[key] = this.normalizeColumnName(key);
      }

      return {
        data: rawData.slice(0, 5),
        suggestedMapping,
        errors: [],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      // ✅ aquí ya no usamos `this`, sino la función importada
      await createAlert(input.userId, `Error en vista previa: ${errorMessage}`);

      console.error("Error en previewFileUpload:", error);
      throw new FileProcessingError(errorMessage, "PREVIEW_ERROR");
    }
  }

  static async mapFileColumns(
    input: MappingInput
  ): Promise<{ errors: string[] }> {
    try {
      // ✅ Validar que el mapeo tenga todas las columnas requeridas
      const requiredColumns = [
        "sku",
        "fecha",
        "cantidad",
        "precio",
        "promocion",
        "categoria",
      ];
      const mappedColumns = Object.values(input.mapping);
      const missingColumns = requiredColumns.filter(
        (col) => !mappedColumns.includes(col)
      );

      if (missingColumns.length > 0) {
        const errorMessage = `Mapeo inválido: faltan columnas requeridas: ${missingColumns.join(
          ", "
        )}`;
        await this.createAlert(input.userId, errorMessage);
        return { errors: [errorMessage] };
      }

      // ✅ Validar que no haya duplicados en el mapeo
      const duplicates = mappedColumns.filter(
        (item, index) => mappedColumns.indexOf(item) !== index
      );
      if (duplicates.length > 0) {
        const errorMessage = `Mapeo inválido: columnas duplicadas: ${duplicates.join(
          ", "
        )}`;
        await this.createAlert(input.userId, errorMessage);
        return { errors: [errorMessage] };
      }

      // ✅ Si llegamos aquí, el mapeo es válido
      await this.createAlert(input.userId, "Mapeo validado correctamente");
      return { errors: [] };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      await this.createAlert(input.userId, `Error en mapeo: ${errorMessage}`);
      throw new FileProcessingError(errorMessage, "MAPPING_ERROR");
    }
  }

  static async confirmFileUpload(
    input: ConfirmUploadInput
  ): Promise<{ message: string }> {
    try {
      await this.createAlert(
        input.userId,
        `Carga de ${input.fileName} confirmada exitosamente`
      );
      return { message: "Datos cargados exitosamente" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      await this.createAlert(
        input.userId,
        `Error en confirmación: ${errorMessage}`
      );
      throw new FileProcessingError(errorMessage, "CONFIRMATION_ERROR");
    }
  }

  // ✅ Cambiar a public static para que sean accesibles desde las funciones exportadas
  public static validateInput(input: FileUploadInput): void {
    if (!input.buffer || input.buffer.length === 0) {
      throw new FileProcessingError("Buffer de archivo vacío", "EMPTY_BUFFER");
    }
    if (!input.userId?.trim()) {
      throw new FileProcessingError(
        "ID de usuario requerido",
        "MISSING_USER_ID"
      );
    }
    if (!input.originalname?.trim()) {
      throw new FileProcessingError(
        "Nombre de archivo requerido",
        "MISSING_FILENAME"
      );
    }
  }

  public static async parseFile(input: FileUploadInput): Promise<RawRow[]> {
    const { buffer, mimetype } = input;
    switch (mimetype) {
      case SUPPORTED_MIME_TYPES.CSV:
        return parseCSV(buffer);
      case SUPPORTED_MIME_TYPES.XLSX:
      case SUPPORTED_MIME_TYPES.XLS:
        return await parseExcel(buffer);
      default:
        throw new FileProcessingError(
          `Formato de archivo no soportado: ${mimetype}. Formatos válidos: CSV, XLSX, XLS`,
          "UNSUPPORTED_FORMAT"
        );
    }
  }

  public static validateData(rawData: RawRow[]): ValidatedRow[] {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new FileProcessingError(
        "No se encontraron datos válidos en el archivo",
        "NO_DATA"
      );
    }
    try {
      return validateSalesData(rawData);
    } catch (error: unknown) {
      throw new FileProcessingError(
        `Error validando datos: ${
          error instanceof Error ? error.message : "Datos inválidos"
        }`,
        "VALIDATION_ERROR"
      );
    }
  }

  public static async saveToDatabase(
    validatedData: ValidatedRow[],
    input: FileUploadInput
  ): Promise<ProcessingResult> {
    const { userId, originalname, onProgress } = input;
    const uploadedAt = new Date();
    try {
      if (validatedData.length > this.BATCH_SIZE) {
        return await this.processBatches(
          validatedData,
          userId,
          originalname,
          uploadedAt,
          onProgress
        );
      }
      await this.insertBatch(validatedData, userId, originalname, uploadedAt);
      return {
        totalProcessed: validatedData.length,
        fileName: originalname,
        uploadedAt,
      };
    } catch (error: unknown) {
      throw new FileProcessingError(
        `Error guardando en base de datos: ${
          error instanceof Error ? error.message : "Error de BD"
        }`,
        "DATABASE_ERROR"
      );
    }
  }

  private static async processBatches(
    data: ValidatedRow[],
    userId: string,
    fileName: string,
    uploadedAt: Date,
    onProgress?: (progress: number) => void
  ): Promise<ProcessingResult> {
    const totalBatches = Math.ceil(data.length / this.BATCH_SIZE);
    let processedRows = 0;

    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.BATCH_SIZE;
      const end = Math.min(start + this.BATCH_SIZE, data.length);
      const batch = data.slice(start, end);

      await this.insertBatch(batch, userId, fileName, uploadedAt);

      processedRows += batch.length;
      const progress = Math.min(
        95,
        Math.floor((processedRows / data.length) * 100)
      );
      onProgress?.(progress);
    }

    return {
      totalProcessed: data.length,
      fileName,
      uploadedAt,
    };
  }

  private static async insertBatch(
    batch: ValidatedRow[],
    userId: string,
    fileName: string,
    uploadedAt: Date
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.salesData.createMany({
        data: batch.map((item) => ({
          userId,
          sku: item.sku,
          date: new Date(item.fecha),
          quantity: item.cantidad,
          price: item.precio,
          promotion: item.promocion,
          uploadedAt,
          fileName,
          dataVersion: 1,
          category: item.categoria,
        })),
        skipDuplicates: true,
      });
    });
  }
}

// ✅ Funciones exportadas individualmente sin dependencia de contexto `this`
export const processFileUpload = async (
  input: FileUploadInput
): Promise<ProcessingResult> => {
  try {
    FileUploadService.validateInput(input);
    const rawData = await FileUploadService.parseFile(input);
    const validatedData = FileUploadService.validateData(rawData);
    const result = await FileUploadService.saveToDatabase(validatedData, input);

    await FileUploadService.createAlert(
      input.userId,
      `Archivo ${input.originalname} cargado exitosamente (${result.totalProcessed} filas procesadas)`
    );

    input.onProgress?.(100);
    return result;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    await FileUploadService.createAlert(
      input.userId,
      `Error procesando archivo: ${errorMessage}`
    );
    if (error instanceof FileProcessingError) throw error;
    throw new FileProcessingError(
      `Error procesando archivo: ${errorMessage}`,
      "PROCESSING_ERROR"
    );
  }
};

export const previewFileUpload = async (
  input: FileUploadInput
): Promise<PreviewResult> => {
  try {
    FileUploadService.validateInput(input); // ✅ Cambia this por FileUploadService
    const rawData = await FileUploadService.parseFile(input);
    const validatedData = FileUploadService.validateData(rawData);

    const suggestedMapping: Record<string, string> = {};
    const firstRow = rawData[0] || {};
    for (const key of Object.keys(firstRow)) {
      suggestedMapping[key] = FileUploadService.normalizeColumnName(key);
    }

    return {
      data: rawData.slice(0, 5),
      suggestedMapping,
      errors: [],
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    await createAlert(input.userId, `Error en vista previa: ${errorMessage}`);
    console.error("Error en previewFileUpload:", error);
    throw new FileProcessingError(errorMessage, "PREVIEW_ERROR");
  }
};

export const mapFileColumns = async (
  input: MappingInput
): Promise<{ errors: string[] }> => {
  try {
    // ✅ Validar que el mapeo tenga todas las columnas requeridas
    const requiredColumns = [
      "sku",
      "fecha",
      "cantidad",
      "precio",
      "promocion",
      "categoria",
    ];
    const mappedColumns = Object.values(input.mapping);
    const missingColumns = requiredColumns.filter(
      (col) => !mappedColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      const errorMessage = `Mapeo inválido: faltan columnas requeridas: ${missingColumns.join(
        ", "
      )}`;
      await FileUploadService.createAlert(input.userId, errorMessage);
      return { errors: [errorMessage] };
    }

    // ✅ Validar que no haya duplicados en el mapeo
    const duplicates = mappedColumns.filter(
      (item, index) => mappedColumns.indexOf(item) !== index
    );
    if (duplicates.length > 0) {
      const errorMessage = `Mapeo inválido: columnas duplicadas: ${duplicates.join(
        ", "
      )}`;
      await FileUploadService.createAlert(input.userId, errorMessage);
      return { errors: [errorMessage] };
    }

    // ✅ Si llegamos aquí, el mapeo es válido
    await FileUploadService.createAlert(
      input.userId,
      "Mapeo validado correctamente"
    );
    return { errors: [] };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    await FileUploadService.createAlert(
      input.userId,
      `Error en mapeo: ${errorMessage}`
    );
    throw new FileProcessingError(errorMessage, "MAPPING_ERROR");
  }
};

export const confirmFileUpload = async (
  input: ConfirmUploadInput & {
    buffer: Buffer;
    mimetype: string;
    mapping: Record<string, string>;
  }
): Promise<{ message: string }> => {
  try {
    // 1. Validar entrada
    FileUploadService.validateInput({ ...input, originalname: input.fileName });

    // 2. Re-parsear archivo
    const rawData = await FileUploadService.parseFile({
      buffer: input.buffer,
      mimetype: input.mimetype,
      originalname: input.fileName,
      userId: input.userId,
    });

    // 3. Aplicar mapeo
    const mappedData = rawData.map((row: RawRow) => {
      const mappedRow: RawRow = {};
      for (const [fileColumn, targetColumn] of Object.entries(input.mapping)) {
        mappedRow[targetColumn] = row[fileColumn];
      }
      return mappedRow;
    });

    // 4. Validar datos
    const validatedData = FileUploadService.validateData(mappedData);

    // 5. Guardar en base de datos
    const result = await FileUploadService.saveToDatabase(validatedData, {
      buffer: input.buffer,
      mimetype: input.mimetype,
      originalname: input.fileName,
      userId: input.userId,
    });

    // 6. Crear alerta de éxito
    await FileUploadService.createAlert(
      input.userId,
      `Archivo ${input.fileName} confirmado y guardado exitosamente (${result.totalProcessed} filas procesadas)`
    );

    return {
      message: `Datos cargados exitosamente (${result.totalProcessed} filas)`,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    await FileUploadService.createAlert(
      input.userId,
      `Error en confirmación de archivo: ${errorMessage}`
    );
    throw new FileProcessingError(errorMessage, "CONFIRMATION_ERROR");
  }
};
