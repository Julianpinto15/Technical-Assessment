import prisma from "../prismaClient";
import {
  validateSalesData,
  parseCSV,
  parseExcel,
} from "../utils/fileValidator";

// Constantes para tipos MIME
const SUPPORTED_MIME_TYPES = {
  CSV: "text/csv",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  XLS: "application/vnd.ms-excel",
} as const;

// Interfaces más específicas
interface FileUploadInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  userId: string;
  onProgress?: (progress: number) => void;
}

// Ajustado para coincidir con el tipo real que devuelve validateSalesData
interface ValidatedRow {
  sku: string;
  fecha: string;
  cantidad: number;
  precio: number;
  promocion: boolean; // Ajustado al tipo real
  categoria: string;
}

interface ProcessingResult {
  totalProcessed: number;
  fileName: string;
  uploadedAt: Date;
}

// Clase de error personalizada para mejor manejo
class FileProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "FileProcessingError";
  }
}

export class FileUploadService {
  private static readonly BATCH_SIZE = 1000; // Para procesar en lotes si hay muchos datos

  static async processFileUpload(
    input: FileUploadInput
  ): Promise<ProcessingResult> {
    try {
      // Validar entrada - Cambiar this por FileUploadService
      FileUploadService.validateInput(input);

      // Parsear archivo
      const rawData = await FileUploadService.parseFile(input);

      // Validar datos
      const validatedData = FileUploadService.validateData(rawData);

      // Procesar en la base de datos
      const result = await FileUploadService.saveToDatabase(
        validatedData,
        input
      );

      // Notificar progreso completado
      input.onProgress?.(100);

      return result;
    } catch (error) {
      // Mejor manejo de errores
      if (error instanceof FileProcessingError) {
        throw error;
      }

      throw new FileProcessingError(
        `Error procesando archivo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        "PROCESSING_ERROR"
      );
    }
  }

  private static validateInput(input: FileUploadInput): void {
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

  private static async parseFile(input: FileUploadInput): Promise<any[]> {
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

  private static validateData(rawData: any[]): ValidatedRow[] {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new FileProcessingError(
        "No se encontraron datos válidos en el archivo",
        "NO_DATA"
      );
    }

    try {
      return validateSalesData(rawData);
    } catch (error) {
      throw new FileProcessingError(
        `Error validando datos: ${
          error instanceof Error ? error.message : "Datos inválidos"
        }`,
        "VALIDATION_ERROR"
      );
    }
  }

  private static async saveToDatabase(
    validatedData: ValidatedRow[],
    input: FileUploadInput
  ): Promise<ProcessingResult> {
    const { userId, originalname, onProgress } = input;
    const uploadedAt = new Date();

    try {
      // Si hay muchos registros, procesar en lotes
      if (validatedData.length > FileUploadService.BATCH_SIZE) {
        return await FileUploadService.processBatches(
          validatedData,
          userId,
          originalname,
          uploadedAt,
          onProgress
        );
      }

      // Procesar todo de una vez si no son muchos registros
      await FileUploadService.insertBatch(
        validatedData,
        userId,
        originalname,
        uploadedAt
      );

      return {
        totalProcessed: validatedData.length,
        fileName: originalname,
        uploadedAt,
      };
    } catch (error) {
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
    const totalBatches = Math.ceil(data.length / FileUploadService.BATCH_SIZE);
    let processedRows = 0;

    for (let i = 0; i < totalBatches; i++) {
      const start = i * FileUploadService.BATCH_SIZE;
      const end = Math.min(start + FileUploadService.BATCH_SIZE, data.length);
      const batch = data.slice(start, end);

      await FileUploadService.insertBatch(batch, userId, fileName, uploadedAt);

      processedRows += batch.length;

      // Actualizar progreso (reservamos el 100% para el final)
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
    await prisma.salesData.createMany({
      data: batch.map((item) => ({
        userId,
        sku: item.sku,
        date: new Date(item.fecha),
        quantity: item.cantidad,
        price: item.precio,
        promotion: item.promocion, // Ahora es boolean, no string
        uploadedAt,
        fileName,
        dataVersion: 1,
        category: item.categoria,
      })),
      skipDuplicates: true,
    });
  }
}

// Mantener la función original para compatibilidad hacia atrás
export const processFileUpload = FileUploadService.processFileUpload;
