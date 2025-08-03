"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertForecastConfig = upsertForecastConfig;
exports.upsertForecastConfigLegacy = upsertForecastConfigLegacy;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const library_1 = require("@prisma/client/runtime/library");
// Constantes para validaciones
const VALID_METRICS = ["precision", "sales"];
const VALID_CONDITIONS = ["below", "above"];
const DEFAULT_ALERT_THRESHOLDS = {
    minThreshold: 0.1,
    maxThreshold: 0.9,
    metric: "precision",
    condition: "below",
};
const DEFAULT_NOTIFICATION_SETTINGS = {
    email: false,
    sms: false,
};
// Clase de error personalizada
class ForecastConfigError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "ForecastConfigError";
    }
}
// Funciones de validación separadas
function validateUserId(userId) {
    const errors = [];
    if (!userId || typeof userId !== "string") {
        errors.push("userId is required and must be a string");
    }
    if (userId && userId.trim().length === 0) {
        errors.push("userId cannot be empty");
    }
    return { isValid: errors.length === 0, errors };
}
function validateForecastHorizon(forecastHorizon) {
    const errors = [];
    if (!Array.isArray(forecastHorizon)) {
        errors.push("forecastHorizon must be an array");
        return { isValid: false, errors };
    }
    if (forecastHorizon.length === 0) {
        errors.push("forecastHorizon cannot be empty");
    }
    const invalidValues = forecastHorizon.filter((h) => !Number.isInteger(h) || h <= 0);
    if (invalidValues.length > 0) {
        errors.push("forecastHorizon must contain only positive integers");
    }
    return { isValid: errors.length === 0, errors };
}
function validateConfidenceLevel(confidenceLevel) {
    const errors = [];
    if (!Array.isArray(confidenceLevel)) {
        errors.push("confidenceLevel must be an array");
        return { isValid: false, errors };
    }
    if (confidenceLevel.length === 0) {
        errors.push("confidenceLevel cannot be empty");
    }
    const invalidValues = confidenceLevel.filter((c) => typeof c !== "number" || c < 0 || c > 1);
    if (invalidValues.length > 0) {
        errors.push("confidenceLevel values must be numbers between 0 and 1");
    }
    return { isValid: errors.length === 0, errors };
}
function validateAlertThresholds(alertThresholds) {
    const errors = [];
    // Validar valores originales
    const originalMin = alertThresholds.minThreshold;
    const originalMax = alertThresholds.maxThreshold;
    // Para sistemas empresariales de pronósticos, permitir rangos más amplios
    // Determinar si son porcentajes o decimales basado en el valor más alto
    const isPercentage = originalMin > 1 || originalMax > 1;
    if (isPercentage) {
        // Validar como porcentajes - permitir hasta 500% para casos extremos de demanda
        if (originalMin < 0 || originalMin > 500) {
            errors.push("minThreshold must be between 0 and 500 (percentage)");
        }
        if (originalMax < 0 || originalMax > 500) {
            errors.push("maxThreshold must be between 0 and 500 (percentage)");
        }
    }
    else {
        // Validar como decimales (0-5.0 para permitir hasta 500%)
        if (originalMin < 0 || originalMin > 5.0) {
            errors.push("minThreshold must be between 0 and 5.0 (decimal)");
        }
        if (originalMax < 0 || originalMax > 5.0) {
            errors.push("maxThreshold must be between 0 and 5.0 (decimal)");
        }
    }
    // Validar relación entre min y max (usando misma escala)
    if (originalMin >= originalMax) {
        errors.push("minThreshold must be less than maxThreshold");
    }
    // Solo normalizar si no hay errores
    if (errors.length === 0) {
        const minThreshold = isPercentage ? originalMin / 100 : originalMin;
        const maxThreshold = isPercentage ? originalMax / 100 : originalMax;
        // Actualizar los valores en el objeto original con los valores normalizados
        alertThresholds.minThreshold = minThreshold;
        alertThresholds.maxThreshold = maxThreshold;
    }
    // Validar métrica
    if (alertThresholds.metric &&
        !VALID_METRICS.includes(alertThresholds.metric)) {
        errors.push(`Invalid metric. Must be one of: ${VALID_METRICS.join(", ")}`);
    }
    // Validar condición
    if (alertThresholds.condition &&
        !VALID_CONDITIONS.includes(alertThresholds.condition)) {
        errors.push(`Invalid condition. Must be one of: ${VALID_CONDITIONS.join(", ")}`);
    }
    return { isValid: errors.length === 0, errors };
}
// Función para validar entrada completa
function validateInput(params) {
    const validations = [
        validateUserId(params.userId),
        validateForecastHorizon(params.forecastHorizon),
        validateConfidenceLevel(params.confidenceLevel),
    ];
    if (params.alertThresholds) {
        validations.push(validateAlertThresholds(params.alertThresholds));
    }
    const allErrors = validations.flatMap((v) => v.errors);
    if (allErrors.length > 0) {
        throw new ForecastConfigError(`Validation failed: ${allErrors.join(", ")}`, "VALIDATION_ERROR");
    }
}
// Función para verificar si el usuario existe
async function ensureUserExists(userId) {
    try {
        const userExists = await prismaClient_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true }, // Solo seleccionar lo mínimo necesario
        });
        if (!userExists) {
            throw new ForecastConfigError("User not found", "USER_NOT_FOUND");
        }
    }
    catch (error) {
        if (error instanceof ForecastConfigError)
            throw error;
        throw new ForecastConfigError("Error checking user existence", "DATABASE_ERROR");
    }
}
// Función para manejar la configuración
async function upsertConfiguration(userId, forecastHorizon, confidenceLevel, notificationSettings, tx) {
    return await tx.configuration.upsert({
        where: { userId },
        create: {
            userId,
            forecastHorizon,
            confidenceLevel,
            notificationSettings,
        },
        update: {
            forecastHorizon,
            confidenceLevel,
            notificationSettings,
        },
    });
}
// Función para manejar los umbrales de alerta
async function upsertAlertThreshold(userId, alertThresholds, tx) {
    const searchCriteria = {
        userId,
        metric: alertThresholds.metric || "precision",
        sku: alertThresholds.sku ?? null,
        category: alertThresholds.category ?? null,
    };
    try {
        const existing = await tx.alertThreshold.findFirst({
            where: searchCriteria,
            select: { id: true },
        });
        const thresholdData = {
            sku: alertThresholds.sku || null,
            category: alertThresholds.category || null,
            metric: alertThresholds.metric || "precision",
            minThreshold: alertThresholds.minThreshold,
            maxThreshold: alertThresholds.maxThreshold,
            condition: alertThresholds.condition || "below",
        };
        if (existing) {
            await tx.alertThreshold.update({
                where: { id: existing.id },
                data: thresholdData,
            });
        }
        else {
            await tx.alertThreshold.create({
                data: {
                    userId,
                    ...thresholdData,
                },
            });
        }
    }
    catch (error) {
        throw new ForecastConfigError("Error upserting alert threshold", "DATABASE_ERROR");
    }
}
// Función principal refactorizada
async function upsertForecastConfig(params) {
    // Aplicar valores por defecto
    const { userId, forecastHorizon, confidenceLevel, alertThresholds = DEFAULT_ALERT_THRESHOLDS, notificationSettings = DEFAULT_NOTIFICATION_SETTINGS, } = params;
    // Validar entrada
    validateInput({
        userId,
        forecastHorizon,
        confidenceLevel,
        alertThresholds,
        notificationSettings,
    });
    try {
        // Verificar que el usuario existe
        await ensureUserExists(userId);
        // Usar transacción para operaciones atómicas
        const result = await prismaClient_1.default.$transaction(async (tx) => {
            // Upsert configuración
            const config = await upsertConfiguration(userId, forecastHorizon, confidenceLevel, notificationSettings, tx);
            // Upsert alert thresholds si se proporcionaron
            if (alertThresholds) {
                await upsertAlertThreshold(userId, alertThresholds, tx);
            }
            return config;
        });
        // Log exitoso (en producción usarías un logger real)
        console.log(`Forecast config updated successfully for user: ${userId}`);
        return result;
    }
    catch (error) {
        // Log del error (en producción usarías un logger real)
        console.error("Error in upsertForecastConfig:", error);
        if (error instanceof ForecastConfigError) {
            throw error;
        }
        // Re-throw errores de Prisma con mejor contexto
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            throw new ForecastConfigError(`Database operation failed: ${error.message}`, "DATABASE_ERROR");
        }
        // Error genérico
        throw new ForecastConfigError("An unexpected error occurred while updating forecast configuration", "INTERNAL_ERROR");
    }
}
// Función wrapper para mantener compatibilidad con la API anterior
async function upsertForecastConfigLegacy(userId, forecastHorizon, confidenceLevel, alertThresholds, notificationSettings) {
    return upsertForecastConfig({
        userId,
        forecastHorizon,
        confidenceLevel,
        alertThresholds,
        notificationSettings,
    });
}
//# sourceMappingURL=foreConfigService.js.map