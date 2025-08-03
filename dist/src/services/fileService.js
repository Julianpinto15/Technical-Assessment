"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFileUpload = exports.FileUploadService = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const fileValidator_1 = require("../utils/fileValidator");
// Constantes para tipos MIME
const SUPPORTED_MIME_TYPES = {
    CSV: "text/csv",
    XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    XLS: "application/vnd.ms-excel",
};
// Clase de error personalizada para mejor manejo
class FileProcessingError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "FileProcessingError";
    }
}
class FileUploadService {
    static async processFileUpload(input) {
        try {
            // Validar entrada
            this.validateInput(input);
            // Parsear archivo
            const rawData = await this.parseFile(input);
            // Validar datos
            const validatedData = this.validateData(rawData);
            // Procesar en la base de datos
            const result = await this.saveToDatabase(validatedData, input);
            // Notificar progreso completado
            input.onProgress?.(100);
            return result;
        }
        catch (error) {
            // Mejor manejo de errores
            if (error instanceof FileProcessingError) {
                throw error;
            }
            throw new FileProcessingError(`Error procesando archivo: ${error instanceof Error ? error.message : "Error desconocido"}`, "PROCESSING_ERROR");
        }
    }
    static validateInput(input) {
        if (!input.buffer || input.buffer.length === 0) {
            throw new FileProcessingError("Buffer de archivo vacío", "EMPTY_BUFFER");
        }
        if (!input.userId?.trim()) {
            throw new FileProcessingError("ID de usuario requerido", "MISSING_USER_ID");
        }
        if (!input.originalname?.trim()) {
            throw new FileProcessingError("Nombre de archivo requerido", "MISSING_FILENAME");
        }
    }
    static async parseFile(input) {
        const { buffer, mimetype } = input;
        switch (mimetype) {
            case SUPPORTED_MIME_TYPES.CSV:
                return (0, fileValidator_1.parseCSV)(buffer);
            case SUPPORTED_MIME_TYPES.XLSX:
            case SUPPORTED_MIME_TYPES.XLS:
                return await (0, fileValidator_1.parseExcel)(buffer);
            default:
                throw new FileProcessingError(`Formato de archivo no soportado: ${mimetype}. Formatos válidos: CSV, XLSX, XLS`, "UNSUPPORTED_FORMAT");
        }
    }
    static validateData(rawData) {
        if (!Array.isArray(rawData) || rawData.length === 0) {
            throw new FileProcessingError("No se encontraron datos válidos en el archivo", "NO_DATA");
        }
        try {
            return (0, fileValidator_1.validateSalesData)(rawData);
        }
        catch (error) {
            throw new FileProcessingError(`Error validando datos: ${error instanceof Error ? error.message : "Datos inválidos"}`, "VALIDATION_ERROR");
        }
    }
    static async saveToDatabase(validatedData, input) {
        const { userId, originalname, onProgress } = input;
        const uploadedAt = new Date();
        try {
            // Si hay muchos registros, procesar en lotes
            if (validatedData.length > this.BATCH_SIZE) {
                return await this.processBatches(validatedData, userId, originalname, uploadedAt, onProgress);
            }
            // Procesar todo de una vez si no son muchos registros
            await this.insertBatch(validatedData, userId, originalname, uploadedAt);
            return {
                totalProcessed: validatedData.length,
                fileName: originalname,
                uploadedAt,
            };
        }
        catch (error) {
            throw new FileProcessingError(`Error guardando en base de datos: ${error instanceof Error ? error.message : "Error de BD"}`, "DATABASE_ERROR");
        }
    }
    static async processBatches(data, userId, fileName, uploadedAt, onProgress) {
        const totalBatches = Math.ceil(data.length / this.BATCH_SIZE);
        let processedRows = 0;
        for (let i = 0; i < totalBatches; i++) {
            const start = i * this.BATCH_SIZE;
            const end = Math.min(start + this.BATCH_SIZE, data.length);
            const batch = data.slice(start, end);
            await this.insertBatch(batch, userId, fileName, uploadedAt);
            processedRows += batch.length;
            // Actualizar progreso (reservamos el 100% para el final)
            const progress = Math.min(95, Math.floor((processedRows / data.length) * 100));
            onProgress?.(progress);
        }
        return {
            totalProcessed: data.length,
            fileName,
            uploadedAt,
        };
    }
    static async insertBatch(batch, userId, fileName, uploadedAt) {
        await prismaClient_1.default.salesData.createMany({
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
exports.FileUploadService = FileUploadService;
FileUploadService.BATCH_SIZE = 1000; // Para procesar en lotes si hay muchos datos
// Mantener la función original para compatibilidad hacia atrás
exports.processFileUpload = FileUploadService.processFileUpload;
//# sourceMappingURL=fileService.js.map