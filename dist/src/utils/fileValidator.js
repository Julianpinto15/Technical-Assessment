"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExcel = exports.parseCSV = exports.validateSalesData = void 0;
const sync_1 = require("csv-parse/sync");
const exceljs_1 = __importDefault(require("exceljs"));
const validateSalesData = (data) => {
    const validatedData = [];
    const errors = [];
    const columnMapping = {
        sku: ["sku", "product_id", "codigo"],
        fecha: ["fecha", "date", "fecha_venta"],
        cantidad: ["cantidad", "cantidad_vendida", "quantity", "units_sold"],
        precio: ["precio", "price", "unit_price"],
        promocion: ["promocion", "promocion_activa", "promotion", "is_promotion"],
        categoria: ["categoria", "category", "producto_categoria"],
    };
    data.forEach((row, index) => {
        const rowErrors = [];
        const mappedRow = {};
        for (const [key, aliases] of Object.entries(columnMapping)) {
            const value = aliases.find((alias) => row[alias] !== undefined);
            if (value) {
                mappedRow[key] = row[value];
            }
            else {
                rowErrors.push(`❌ Fila ${index + 2}: Falta la columna "${key}"`);
            }
        }
        // SKU
        if (!/^[a-zA-Z0-9]{3,20}$/.test(mappedRow.sku)) {
            rowErrors.push(`❌ Fila ${index + 2}: SKU inválido "${mappedRow.sku}"`);
        }
        // FECHA (formato flexible)
        const rawDate = mappedRow.fecha;
        const parsedDate = parseFlexibleDate(rawDate);
        if (!parsedDate) {
            rowErrors.push(`❌ Fila ${index + 2}: Fecha inválida "${rawDate}"`);
        }
        // CANTIDAD
        const cantidad = parseInt(mappedRow.cantidad);
        if (isNaN(cantidad) || cantidad < 1 || cantidad > 100000) {
            rowErrors.push(`❌ Fila ${index + 2}: Cantidad inválida "${mappedRow.cantidad}"`);
        }
        // PRECIO
        const precio = parseFloat(mappedRow.precio);
        if (isNaN(precio) ||
            precio < 0 ||
            mappedRow.precio.toString().split(".")[1]?.length > 4) {
            rowErrors.push(`❌ Fila ${index + 2}: Precio inválido "${mappedRow.precio}"`);
        }
        // PROMOCION (normalización)
        const normPromo = normalizeBoolean(mappedRow.promocion);
        if (normPromo === null) {
            rowErrors.push(`❌ Fila ${index + 2}: Promoción inválida "${mappedRow.promocion}"`);
        }
        // CATEGORIA
        if (!mappedRow.categoria || typeof mappedRow.categoria !== "string") {
            rowErrors.push(`❌ Fila ${index + 2}: Categoría inválida`);
        }
        if (rowErrors.length > 0) {
            errors.push(...rowErrors);
        }
        else {
            validatedData.push({
                sku: mappedRow.sku,
                fecha: parsedDate.toISOString(), // Fecha válida en ISO
                cantidad,
                precio,
                promocion: normPromo,
                categoria: mappedRow.categoria,
            });
        }
    });
    if (errors.length > 0) {
        throw new Error(`Errores de validación:\n${errors.join("\n")}`);
    }
    return validatedData;
};
exports.validateSalesData = validateSalesData;
// 🔁 Normalizador de booleanos
function normalizeBoolean(value) {
    if (typeof value !== "string")
        return null;
    const val = value.trim().toLowerCase();
    if (["true", "1", "si", "sí", "yes"].includes(val))
        return true;
    if (["false", "0", "no"].includes(val))
        return false;
    return null;
}
// 📅 Detección flexible de fechas
function parseFlexibleDate(dateStr) {
    if (!dateStr)
        return null;
    const parts = dateStr.split(/[\/\-]/);
    let d;
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            // YYYY-MM-DD
            d = new Date(dateStr);
        }
        else if (parseInt(parts[1]) > 12) {
            // DD/MM/YYYY
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        else {
            // MM/DD/YYYY
            d = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        }
    }
    else {
        d = new Date(dateStr);
    }
    return isNaN(d.getTime()) ? null : d;
}
const parseCSV = (buffer) => {
    return (0, sync_1.parse)(buffer, { columns: true, skip_empty_lines: true });
};
exports.parseCSV = parseCSV;
const parseExcel = async (buffer) => {
    const workbook = new exceljs_1.default.Workbook();
    await workbook.xlsx.load(buffer.buffer);
    const worksheet = workbook.worksheets[0];
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1)
            return; // Saltar encabezados
        const rowData = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            rowData[cell.text] = row.getCell(colNumber).text;
        });
        rows.push(rowData);
    });
    return rows;
};
exports.parseExcel = parseExcel;
//# sourceMappingURL=fileValidator.js.map