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
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    rawData = await parseExcel(input.buffer);
  } else {
    throw new Error("Unsupported file format");
  }

  // Validar datos
  const validatedData = validateSalesData(rawData);

  // Guardar en la base de datos
  await prisma.salesData.createMany({
    data: validatedData.map((item) => ({
      userId: input.userId,
      sku: item.sku,
      date: new Date(item.fecha), // Usar fecha validada
      quantity: item.cantidad,
      price: item.precio,
      promotion: item.promocion,
      uploadedAt: new Date(),
      fileName: input.originalname,
      dataVersion: 1, // Versión inicial
    })),
  });
};
