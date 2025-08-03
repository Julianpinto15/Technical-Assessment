interface FileUploadInput {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    userId: string;
    onProgress?: (progress: number) => void;
}
interface ProcessingResult {
    totalProcessed: number;
    fileName: string;
    uploadedAt: Date;
}
export declare class FileUploadService {
    private static readonly BATCH_SIZE;
    static processFileUpload(input: FileUploadInput): Promise<ProcessingResult>;
    private static validateInput;
    private static parseFile;
    private static validateData;
    private static saveToDatabase;
    private static processBatches;
    private static insertBatch;
}
export declare const processFileUpload: typeof FileUploadService.processFileUpload;
export {};
//# sourceMappingURL=fileService.d.ts.map