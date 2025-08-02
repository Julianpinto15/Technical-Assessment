import prisma from "../prismaClient";
import {
  validateSalesData,
  parseCSV,
  parseExcel,
} from "../utils/fileValidator";

interface FileUploadInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  userId: string;
  onProgress?: (progress: number) => void; // Para seguimiento de progreso
}

export const processFileUpload = async (
  input: FileUploadInput
): Promise<void> => {
  let rawData: any[];

  // Determinar tipo de archivo
  if (input.mimetype === "text/csv") {
    rawData = parseCSV(input.buffer);
  } else if (
    input.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    input.mimetype === "application/vnd.ms-excel"
  ) {
    rawData = await parseExcel(input.buffer);
  } else {
    throw new Error("Formato de archivo no soportado");
  }

  // Validar datos
  const validatedData = validateSalesData(rawData);
  const totalRows = validatedData.length;

  // Insertar en la base de datos
  await prisma.salesData.createMany({
    data: validatedData.map((item) => ({
      userId: input.userId,
      sku: item.sku,
      date: new Date(item.fecha),
      quantity: item.cantidad,
      price: item.precio,
      promotion: item.promocion,
      uploadedAt: new Date(),
      fileName: input.originalname,
      dataVersion: 1,
      category: item.categoria,
    })),
    skipDuplicates: true, // si quieres evitar duplicados
  });

  // Notificar progreso
  input.onProgress?.(100);
};
