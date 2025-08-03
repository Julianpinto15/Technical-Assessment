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
    // Validar que tiene las propiedades requeridas
    if (typeof obj.email === "boolean" && typeof obj.sms === "boolean") {
        return obj;
    }
    return null;
}
// Crear un umbral de alerta
async function createAlertThreshold(userId, data) {
    if (!["precision", "sales"].includes(data.metric)) {
        throw new Error("Invalid metric. Must be 'precision' or 'sales'.");
    }
    if (!["below", "above"].includes(data.condition)) {
        throw new Error("Invalid condition. Must be 'below' or 'above'.");
    }
    if (data.minThreshold >= data.maxThreshold) {
        throw new Error("minThreshold must be less than maxThreshold.");
    }
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
// Verificar alertas para nuevos pronósticos
async function checkAlerts(userId, forecasts) {
    const alerts = [];
    for (const forecast of forecasts) {
        const thresholds = await prismaClient_1.default.alertThreshold.findMany({
            where: {
                userId,
                OR: [{ sku: forecast.sku }, { sku: null }],
            },
        });
        for (const threshold of thresholds) {
            if (threshold.metric === "precision") {
                if (threshold.condition === "below" &&
                    typeof threshold.minThreshold === "number" &&
                    forecast.data_quality_score < threshold.minThreshold) {
                    alerts.push(`Precision too low for SKU ${forecast.sku}: ${forecast.data_quality_score}`);
                }
                else if (threshold.condition === "above" &&
                    typeof threshold.maxThreshold === "number" &&
                    forecast.data_quality_score > threshold.maxThreshold) {
                    alerts.push(`Precision too high for SKU ${forecast.sku}: ${forecast.data_quality_score}`);
                }
            }
            else if (threshold.metric === "sales") {
                if (threshold.condition === "below" &&
                    typeof threshold.minThreshold === "number" &&
                    forecast.base_forecast < threshold.minThreshold) {
                    alerts.push(`Sales forecast too low for SKU ${forecast.sku}: ${forecast.base_forecast}`);
                }
                else if (threshold.condition === "above" &&
                    typeof threshold.maxThreshold === "number" &&
                    forecast.base_forecast > threshold.maxThreshold) {
                    alerts.push(`Sales forecast too high for SKU ${forecast.sku}: ${forecast.base_forecast}`);
                }
            }
        }
    }
    // Enviar notificaciones si hay alertas
    if (alerts.length > 0) {
        const config = await prismaClient_1.default.configuration.findUnique({
            where: { userId },
            select: { notificationSettings: true },
        });
        if (config?.notificationSettings) {
            const settings = parseNotificationSettings(config.notificationSettings);
            if (settings) {
                if (settings.email) {
                    console.log("Sending email notifications:", alerts);
                    // Implementar lógica real de envío de email (ej. nodemailer)
                }
                if (settings.sms) {
                    console.log("Sending SMS notifications:", alerts);
                    // Implementar lógica real de SMS (ej. Twilio)
                }
            }
            else {
                console.warn("Invalid notification settings format");
            }
        }
    }
    return alerts;
}
//# sourceMappingURL=alertService.js.map