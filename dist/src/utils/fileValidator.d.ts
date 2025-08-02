import { Buffer } from "buffer";
interface ValidatedRow {
    sku: string;
    fecha: string;
    cantidad: number;
    precio: number;
    promocion: boolean;
    categoria: string;
}
export declare function parseCSV(buffer: Buffer): any[];
export declare function parseExcel(buffer: Buffer): Promise<any[]>;
export declare function validateSalesData(rawData: any[]): ValidatedRow[];
export {};
//# sourceMappingURL=fileValidator.d.ts.map