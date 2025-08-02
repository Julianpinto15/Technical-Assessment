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
    // Mapeo flexible de columnas
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
        // Mapear las columnas dinámicamente
        for (const [key, aliases] of Object.entries(columnMapping)) {
            const value = aliases.find((alias) => row[alias] !== undefined);
            if (value) {
                mappedRow[key] = row[value];
            }
            else {
                rowErrors.push(`Missing or invalid ${key} at row ${index + 1}`);
            }
        }
        // Validar SKU
        if (!/^[a-zA-Z0-9]{3,20}$/.test(mappedRow.sku)) {
            rowErrors.push(`Invalid SKU at row ${index + 1}`);
        }
        // Validar fecha (detección automática de formatos)
        const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
        let date = new Date(mappedRow.fecha);
        for (const format of dateFormats) {
            date = new Date(mappedRow.fecha);
            if (!isNaN(date.getTime()))
                break;
        }
        if (isNaN(date.getTime())) {
            rowErrors.push(`Invalid date at row ${index + 1}`);
        }
        // Validar cantidad
        const quantity = parseInt(mappedRow.cantidad);
        if (isNaN(quantity) || quantity < 1 || quantity > 100000) {
            rowErrors.push(`Invalid quantity at row ${index + 1}`);
        }
        // Validar precio
        const price = parseFloat(mappedRow.precio);
        if (isNaN(price) ||
            price < 0 ||
            price.toString().split(".")[1]?.length > 4) {
            rowErrors.push(`Invalid price at row ${index + 1}`);
        }
        // Validar promoción
        const promotion = ["true", "1", "si", "yes"].includes(mappedRow.promocion?.toLowerCase());
        if (mappedRow.promocion &&
            !["true", "false", "1", "0", "si", "no", "yes", "no"].includes(mappedRow.promocion.toLowerCase())) {
            rowErrors.push(`Invalid promotion at row ${index + 1}`);
        }
        // Validar categoría
        if (!mappedRow.categoria || typeof mappedRow.categoria !== "string") {
            rowErrors.push(`Invalid category at row ${index + 1}`);
        }
        if (rowErrors.length === 0) {
            validatedData.push({
                sku: mappedRow.sku,
                fecha: mappedRow.fecha,
                cantidad: quantity,
                precio: price,
                promocion: promotion,
                categoria: mappedRow.categoria,
            });
        }
        else {
            errors.push(...rowErrors);
        }
    });
    if (errors.length > 0) {
        throw new Error(`Validation errors:\n${errors.join("\n")}`);
    }
    return validatedData;
};
exports.validateSalesData = validateSalesData;
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