"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertForecastConfig = upsertForecastConfig;
const prismaClient_1 = __importDefault(require("../prismaClient"));
async function upsertForecastConfig(userId, forecastHorizon, confidenceLevel, alertThresholds = {
    minThreshold: 0.1,
    maxThreshold: 0.9,
    metric: "precision",
    condition: "below",
}, notificationSettings = { email: false, sms: false }) {
    // Validar que el usuario exista
    const userExists = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new Error("User not found");
    }
    // Validar alertThresholds
    if (alertThresholds.minThreshold >= alertThresholds.maxThreshold) {
        throw new Error("minThreshold must be less than maxThreshold");
    }
    if (alertThresholds.metric &&
        !["precision", "sales"].includes(alertThresholds.metric)) {
        throw new Error("Invalid metric. Must be 'precision' or 'sales'.");
    }
    if (alertThresholds.condition &&
        !["below", "above"].includes(alertThresholds.condition)) {
        throw new Error("Invalid condition. Must be 'below' or 'above'.");
    }
    // Actualizar o crear la configuración en Configuration
    const config = await prismaClient_1.default.configuration.upsert({
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
    // Actualizar o crear el umbral en AlertThreshold sin usar índice con nulls
    if (alertThresholds) {
        const existing = await prismaClient_1.default.alertThreshold.findFirst({
            where: {
                userId,
                metric: alertThresholds.metric || "precision",
                sku: alertThresholds.sku ?? undefined,
                category: alertThresholds.category ?? undefined,
            },
        });
        if (existing) {
            await prismaClient_1.default.alertThreshold.update({
                where: { id: existing.id },
                data: {
                    sku: alertThresholds.sku,
                    category: alertThresholds.category,
                    metric: alertThresholds.metric || "precision",
                    minThreshold: alertThresholds.minThreshold,
                    maxThreshold: alertThresholds.maxThreshold,
                    condition: alertThresholds.condition || "below",
                },
            });
        }
        else {
            await prismaClient_1.default.alertThreshold.create({
                data: {
                    userId,
                    sku: alertThresholds.sku,
                    category: alertThresholds.category,
                    metric: alertThresholds.metric || "precision",
                    minThreshold: alertThresholds.minThreshold,
                    maxThreshold: alertThresholds.maxThreshold,
                    condition: alertThresholds.condition || "below",
                },
            });
        }
    }
    return config;
}
//# sourceMappingURL=foreConfigService.js.map