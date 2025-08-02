"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCSV = parseCSV;
exports.parseExcel = parseExcel;
exports.validateSalesData = validateSalesData;
const sync_1 = require("csv-parse/sync");
const XLSX = __importStar(require("xlsx"));
// Definir posibles nombres de columnas para flexibilidad
const columnMappings = {
    sku: ["sku", "product_id", "codigo_producto"],
    fecha: ["fecha", "date", "transaction_date"],
    cantidad: ["cantidad_vendida", "cantidad", "quantity", "units_sold"],
    precio: ["precio", "price", "unit_price"],
    promocion: ["promocion_activa", "promocion", "promotion", "is_promotion"],
    categoria: ["categoria", "category", "product_category"],
};
// Función para normalizar nombres de columnas
function normalizeColumnName(name) {
    const lowerName = name.toLowerCase().trim();
    for (const [key, aliases] of Object.entries(columnMappings)) {
        if (aliases.includes(lowerName)) {
            return key;
        }
    }
    return lowerName;
}
// Función para normalizar valores booleanos
function normalizeBoolean(value) {
    const strValue = String(value).toLowerCase().trim();
    if (["true", "1", "sí", "si", "yes"].includes(strValue))
        return true;
    if (["false", "0", "no"].includes(strValue))
        return false;
    throw new Error(`Valor inválido para promoción: ${value}`);
}
// Función para convertir número serial de Excel a fecha
function excelSerialToDate(serial) {
    const excelEpoch = new Date(1900, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const adjustedSerial = serial > 59 ? serial - 1 : serial;
    return new Date(excelEpoch.getTime() + (adjustedSerial - 1) * millisecondsPerDay);
}
// Función para validar y parsear fechas
function parseDate(value) {
    // Si es un número (fecha serial de Excel)
    if (typeof value === "number" && !isNaN(value)) {
        const date = excelSerialToDate(value);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
        }
    }
    const strValue = String(value).trim();
    // ISO 8601 (YYYY-MM-DD)
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoRegex.test(strValue)) {
        const date = new Date(strValue);
        if (!isNaN(date.getTime()))
            return strValue;
    }
    // DD/MM/YYYY, MM/DD/YYYY, M/DD/YY, D/MM/YY
    const dateRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;
    const match = strValue.match(dateRegex);
    if (match) {
        let [_, first, second, year] = match;
        let fullYear = parseInt(year);
        if (year.length === 2) {
            fullYear = parseInt(`20${year}`); // Asume años 20XX
            if (fullYear < 2000 || fullYear > 2099) {
                throw new Error(`Año inválido: ${year}`);
            }
        }
        // Probar DD/MM/YYYY o D/MM/YY
        if (parseInt(first) <= 31 && parseInt(second) <= 12) {
            const ddmmyyyy = new Date(fullYear, parseInt(second) - 1, parseInt(first));
            if (!isNaN(ddmmyyyy.getTime())) {
                return ddmmyyyy.toISOString().split("T")[0];
            }
        }
        // Probar MM/DD/YYYY o M/DD/YY
        if (parseInt(first) <= 12 && parseInt(second) <= 31) {
            const mmddyyyy = new Date(fullYear, parseInt(first) - 1, parseInt(second));
            if (!isNaN(mmddyyyy.getTime())) {
                return mmddyyyy.toISOString().split("T")[0];
            }
        }
    }
    throw new Error(`Fecha inválida: ${value}`);
}
// Función para parsear CSV
function parseCSV(buffer) {
    return (0, sync_1.parse)(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: false,
    });
}
// Función para parsear Excel
async function parseExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, {
        raw: false,
        dateNF: "yyyy-mm-dd",
    });
}
// Función para validar datos
function validateSalesData(rawData) {
    const errors = [];
    const seenSKUs = new Set();
    const validatedData = [];
    if (!rawData || rawData.length === 0) {
        throw new Error("El archivo está vacío o no contiene datos válidos");
    }
    // Normalizar nombres de columnas
    const normalizedData = rawData.map((row, index) => {
        const normalizedRow = {};
        for (const key of Object.keys(row)) {
            normalizedRow[normalizeColumnName(key)] = row[key];
        }
        return { row: normalizedRow, index: index + 2 }; // Fila 1 es encabezado
    });
    // Validar que todas las columnas requeridas estén presentes
    const requiredColumns = [
        "sku",
        "fecha",
        "cantidad",
        "precio",
        "promocion",
        "categoria",
    ];
    const firstRow = normalizedData[0]?.row || {};
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
    if (missingColumns.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingColumns.join(", ")}`);
    }
    // Validar cada fila
    for (const { row, index } of normalizedData) {
        try {
            // Validar SKU
            const sku = String(row.sku).trim();
            if (!/^[a-zA-Z0-9]{3,20}$/.test(sku)) {
                throw new Error(`SKU inválido: debe ser alfanumérico, 3-20 caracteres, sin espacios`);
            }
            // Verificar unicidad de SKU + fecha
            const skuDateKey = `${sku}_${row.fecha}`;
            if (seenSKUs.has(skuDateKey)) {
                throw new Error(`SKU duplicado: "${sku}" para la misma fecha`);
            }
            seenSKUs.add(skuDateKey);
            // Validar fecha
            const fecha = parseDate(row.fecha);
            // Validar cantidad
            const cantidadStr = String(row.cantidad).trim();
            const cantidad = parseInt(cantidadStr, 10);
            if (isNaN(cantidad) || cantidad < 1 || cantidad > 100000) {
                throw new Error(`Cantidad inválida: debe ser un entero entre 1 y 100,000`);
            }
            // Validar precio
            const precioStr = String(row.precio).trim();
            const precio = parseFloat(precioStr);
            if (isNaN(precio) || precio <= 0) {
                throw new Error(`Precio inválido: debe ser un decimal positivo`);
            }
            const decimalPlaces = (precioStr.split(".")[1] || "").length;
            if (decimalPlaces > 4) {
                throw new Error(`Precio inválido: máximo 4 decimales permitidos`);
            }
            // Validar promoción
            const promocion = normalizeBoolean(row.promocion);
            // Validar categoría
            const categoria = String(row.categoria).trim();
            if (!categoria) {
                throw new Error(`Categoría inválida: no puede estar vacía`);
            }
            validatedData.push({
                sku,
                fecha,
                cantidad,
                precio,
                promocion,
                categoria,
            });
        }
        catch (error) {
            errors.push(`❌ Fila ${index}: ${error.message}`);
        }
    }
    if (errors.length > 0) {
        throw new Error(`Errores de validación:\n${errors.join("\n")}`);
    }
    return validatedData;
}
//# sourceMappingURL=fileValidator.js.map