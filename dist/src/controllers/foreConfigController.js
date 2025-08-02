"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setForecastConfig = setForecastConfig;
const prismaClient_1 = __importDefault(require("../prismaClient"));
async function setForecastConfig(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
    }
    const { userId } = req.user;
    const { forecastHorizon, confidenceLevels, alertThresholds, notificationSettings, } = req.body;
    // Validar datos de entrada Validar forecastHorizon
    if (!Array.isArray(forecastHorizon) ||
        forecastHorizon.some((h) => !Number.isInteger(h) || h < 1 || h > 6)) {
        return res
            .status(400)
            .json({
            error: "Horizontes de pronóstico deben ser enteros entre 1 y 6",
        });
    }
    // Validar y convertir confidenceLevels
    if (!Array.isArray(confidenceLevels) ||
        confidenceLevels.some((c) => typeof c !== "number" || c < 0 || c > 100)) {
        return res
            .status(400)
            .json({ error: "Niveles de confianza deben ser números entre 0 y 100" });
    }
    const normalizedConfidenceLevels = confidenceLevels.map((c) => c / 100);
    // Validar alertThresholds y notificationSettings (simplificado)
    if (!alertThresholds ||
        typeof alertThresholds !== "object" ||
        !notificationSettings ||
        typeof notificationSettings !== "object") {
        return res.status(400).json({
            error: "alertThresholds y notificationSettings deben ser objetos",
        });
    }
    try {
        const config = await prismaClient_1.default.configuration.create({
            data: {
                userId: req.user.userId,
                forecastHorizon,
                confidenceLevel: normalizedConfidenceLevels, // Guardar en formato decimal
                alertThresholds,
                notificationSettings,
            },
        });
        res.json(config);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
//# sourceMappingURL=foreConfigController.js.map