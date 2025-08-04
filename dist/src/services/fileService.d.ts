interface FileUploadInput {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    userId: string;
    onProgress?: (progress: number) => void;
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
export declare class FileUploadService {
    private static readonly BATCH_SIZE;
    private static createAlert;
    static processFileUpload(input: FileUploadInput): Promise<ProcessingResult>;
    static previewFileUpload(input: FileUploadInput): Promise<PreviewResult>;
    static mapFileColumns(input: MappingInput): Promise<{
        errors: string[];
    }>;
    static confirmFileUpload(input: ConfirmUploadInput): Promise<{
        message: string;
    }>;
    private static validateInput;
    private static parseFile;
    private static validateData;
    private static saveToDatabase;
    private static processBatches;
    private static insertBatch;
}
export declare const processFileUpload: typeof FileUploadService.processFileUpload;
export declare const previewFileUpload: typeof FileUploadService.previewFileUpload;
export declare const mapFileColumns: typeof FileUploadService.mapFileColumns;
export declare const confirmFileUpload: typeof FileUploadService.confirmFileUpload;
export {};
//# sourceMappingURL=fileService.d.ts.map