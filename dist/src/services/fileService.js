"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFileUpload = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const fileValidator_1 = require("../utils/fileValidator");
const processFileUpload = async (input) => {
    let rawData;
    // Determinar tipo de archivo
    if (input.mimetype === "text/csv") {
        rawData = (0, fileValidator_1.parseCSV)(input.buffer);
    }
    else if (input.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        input.mimetype === "application/vnd.ms-excel") {
        rawData = await (0, fileValidator_1.parseExcel)(input.buffer);
    }
    else {
        throw new Error("Formato de archivo no soportado");
    }
    // Validar datos
    const validatedData = (0, fileValidator_1.validateSalesData)(rawData);
    const totalRows = validatedData.length;
    // Insertar en la base de datos
    await prismaClient_1.default.salesData.createMany({
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
exports.processFileUpload = processFileUpload;
//# sourceMappingURL=fileService.js.map