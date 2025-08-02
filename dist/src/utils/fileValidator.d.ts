interface SalesDataInput {
    sku: string;
    fecha: string;
    cantidad: number;
    precio: number;
    promocion: boolean;
    categoria: string;
}
export declare const validateSalesData: (data: any[]) => SalesDataInput[];
export declare const parseCSV: (buffer: Buffer) => any[];
export declare const parseExcel: (buffer: Buffer) => Promise<any[]>;
export {};
//# sourceMappingURL=fileValidator.d.ts.map