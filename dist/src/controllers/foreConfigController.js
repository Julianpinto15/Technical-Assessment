"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setForecastConfig = setForecastConfig;
const foreConfigService_1 = require("../services/foreConfigService");
async function setForecastConfig(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
    }
    const { userId } = req.user;
    const { forecastHorizon, confidenceLevels, alertThresholds, notificationSettings, } = req.body;
    // Validar forecastHorizon
    if (!Array.isArray(forecastHorizon) ||
        forecastHorizon.some((h) => !Number.isInteger(h) || h < 1 || h > 6)) {
        return res.status(400).json({
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
    // Validar alertThresholds
    if (alertThresholds &&
        (typeof alertThresholds.minThreshold !== "number" ||
            typeof alertThresholds.maxThreshold !== "number" ||
            alertThresholds.minThreshold >= alertThresholds.maxThreshold)) {
        return res.status(400).json({
            error: "alertThresholds debe tener minThreshold < maxThreshold",
        });
    }
    // Validar notificationSettings
    if (!notificationSettings ||
        typeof notificationSettings.email !== "boolean" ||
        typeof notificationSettings.sms !== "boolean") {
        return res.status(400).json({
            error: "notificationSettings debe tener propiedades email y sms de tipo boolean",
        });
    }
    try {
        const config = await (0, foreConfigService_1.upsertForecastConfig)(userId, forecastHorizon, normalizedConfidenceLevels, alertThresholds, notificationSettings);
        res.json(config);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
//# sourceMappingURL=foreConfigController.js.map