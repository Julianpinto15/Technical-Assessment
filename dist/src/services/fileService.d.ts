interface FileUploadInput {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    userId: string;
}
export declare const processFileUpload: (input: FileUploadInput) => Promise<void>;
export {};
//# sourceMappingURL=fileService.d.ts.map