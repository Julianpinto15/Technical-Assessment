"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlertThreshold = createAlertThreshold;
exports.getAlertThresholds = getAlertThresholds;
exports.checkAlerts = checkAlerts;
const prismaClient_1 = __importDefault(require("../prismaClient"));
// Función helper para validar y convertir notificationSettings
function parseNotificationSettings(jsonValue) {
    if (!jsonValue || typeof jsonValue !== "object") {
        return null;
    }
    const obj = jsonValue;
    if (typeof obj.email === "boolean" && typeof obj.sms === "boolean") {
        return obj;
    }
    return null;
}
// Validaciones separadas para mejor legibilidad
function validateMetric(metric) {
    if (!["precision", "sales"].includes(metric)) {
        throw new Error("Invalid metric. Must be 'precision' or 'sales'.");
    }
}
function validateCondition(condition) {
    if (!["below", "above"].includes(condition)) {
        throw new Error("Invalid condition. Must be 'below' or 'above'.");
    }
}
function validateThresholds(minThreshold, maxThreshold) {
    if (minThreshold >= maxThreshold) {
        throw new Error("minThreshold must be less than maxThreshold.");
    }
}
// Crear un umbral de alerta
async function createAlertThreshold(userId, data) {
    validateMetric(data.metric);
    validateCondition(data.condition);
    validateThresholds(data.minThreshold, data.maxThreshold);
    return prismaClient_1.default.alertThreshold.create({
        data: {
            userId,
            sku: data.sku,
            category: data.category,
            metric: data.metric,
            minThreshold: data.minThreshold,
            maxThreshold: data.maxThreshold,
            condition: data.condition,
        },
    });
}
// Listar umbrales de alerta
async function getAlertThresholds(userId) {
    return prismaClient_1.default.alertThreshold.findMany({ where: { userId } });
}
// Funciones de verificación actualizadas para mejor evaluación de umbrales
function checkPrecisionAlert(forecast, threshold, alertKey, seenMessages) {
    const { data_quality_score, sku, forecastDate } = forecast;
    const { condition, minThreshold, maxThreshold } = threshold;
    if (seenMessages.has(alertKey))
        return null;
    // Evaluación mejorada de condiciones
    if (condition === "below" && typeof minThreshold === "number") {
        if (data_quality_score < minThreshold) {
            seenMessages.add(alertKey);
            return {
                message: `Precision too low for SKU ${sku}: ${data_quality_score}`,
                forecastDate: forecastDate.toISOString(),
            };
        }
    }
    if (condition === "above" && typeof maxThreshold === "number") {
        if (data_quality_score > maxThreshold) {
            seenMessages.add(alertKey);
            return {
                message: `Precision too high for SKU ${sku}: ${data_quality_score}`,
                forecastDate: forecastDate.toISOString(),
            };
        }
    }
    return null;
}
function checkSalesAlert(forecast, threshold, alertKey, seenMessages) {
    const { base_forecast, sku, forecastDate } = forecast;
    const { condition, minThreshold, maxThreshold } = threshold;
    if (seenMessages.has(alertKey))
        return null;
    // Evaluación mejorada de condiciones para sales
    if (condition === "below" && typeof minThreshold === "number") {
        if (base_forecast < minThreshold) {
            seenMessages.add(alertKey);
            return {
                message: `Sales forecast too low for SKU ${sku}: ${base_forecast}`,
                forecastDate: forecastDate.toISOString(),
            };
        }
    }
    if (condition === "above" && typeof maxThreshold === "number") {
        if (base_forecast > maxThreshold) {
            seenMessages.add(alertKey);
            return {
                message: `Sales forecast too high for SKU ${sku}: ${base_forecast}`,
                forecastDate: forecastDate.toISOString(),
            };
        }
    }
    return null;
}
// Función para convertir de Prisma a nuestra interfaz
function convertPrismaThreshold(prismaThreshold) {
    return {
        sku: prismaThreshold.sku ?? undefined,
        category: prismaThreshold.category ?? undefined,
        metric: prismaThreshold.metric,
        minThreshold: prismaThreshold.minThreshold,
        maxThreshold: prismaThreshold.maxThreshold,
        condition: prismaThreshold.condition,
    };
}
// Función para procesar un solo forecast contra un threshold (ACTUALIZADA)
function processAlert(forecast, prismaThreshold, seenMessages) {
    // Convertir threshold de Prisma a nuestra interfaz
    const threshold = convertPrismaThreshold(prismaThreshold);
    // Clave única más específica que incluye el ID del threshold
    const alertKey = `${prismaThreshold.id}-${threshold.metric}-${threshold.condition}-${forecast.sku}-${forecast.forecastDate.toISOString()}`;
    switch (threshold.metric) {
        case "precision":
            return checkPrecisionAlert(forecast, threshold, alertKey, seenMessages);
        case "sales":
            return checkSalesAlert(forecast, threshold, alertKey, seenMessages);
        default:
            return null;
    }
}
// Función para enviar notificaciones
async function sendNotifications(userId, alerts) {
    if (alerts.length === 0)
        return;
    const config = await prismaClient_1.default.configuration.findUnique({
        where: { userId },
        select: { notificationSettings: true },
    });
    if (!config?.notificationSettings)
        return;
    const settings = parseNotificationSettings(config.notificationSettings);
    if (!settings) {
        console.warn("Invalid notification settings format");
        return;
    }
    const messages = alerts.map((alert) => alert.message);
    if (settings.email) {
        console.log("Sending email notifications:", messages);
    }
    if (settings.sms) {
        console.log("Sending SMS notifications:", messages);
    }
}
// Verificar alertas para nuevos pronósticos (función principal ACTUALIZADA)
async function checkAlerts(userId, forecasts) {
    const alerts = [];
    const seenMessages = new Set();
    for (const forecast of forecasts) {
        const thresholds = await prismaClient_1.default.alertThreshold.findMany({
            where: {
                userId,
                OR: [{ sku: forecast.sku }, { sku: null }],
            },
        });
        for (const threshold of thresholds) {
            const alertKey = `${threshold.id}-${threshold.metric}-${threshold.condition}-${forecast.sku}-${forecast.forecastDate.toISOString()}`;
            const alert = processAlert(forecast, threshold, seenMessages);
            if (alert) {
                alerts.push(alert);
            }
        }
    }
    await sendNotifications(userId, alerts);
    return alerts;
}
//# sourceMappingURL=alertService.js.map