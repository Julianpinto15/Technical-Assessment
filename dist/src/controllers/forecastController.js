"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForecastMetricsController = exports.getForecastHistoryController = exports.postForecast = void 0;
const forecastService_1 = require("../services/forecastService");
const postForecast = async (req, res) => {
    try {
        const { sku } = req.body;
        // Verificar que el usuario existe
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // Usar userId en lugar de id
        const userId = req.user.userId;
        const results = await (0, forecastService_1.generateForecasts)(userId, sku);
        res.status(201).json({ message: "Forecasts generated", data: results });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.postForecast = postForecast;
const getForecastHistoryController = async (req, res) => {
    try {
        // Verificar que el usuario existe
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const userId = req.user.userId;
        // Extraer filtros de los query parameters
        const filters = {
            sku: req.query.sku,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            category: req.query.category,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset
                ? parseInt(req.query.offset)
                : undefined,
        };
        const history = await (0, forecastService_1.getForecastHistory)(userId, filters);
        res.status(200).json({
            message: "Forecast history retrieved",
            data: history,
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getForecastHistoryController = getForecastHistoryController;
const getForecastMetricsController = async (req, res) => {
    try {
        // Verificar que el usuario existe
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const userId = req.user.userId;
        const sku = req.query.sku;
        const metrics = await (0, forecastService_1.getForecastMetrics)(userId, sku);
        res.status(200).json({
            message: "Forecast metrics retrieved",
            data: metrics,
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getForecastMetricsController = getForecastMetricsController;
//# sourceMappingURL=forecastController.js.map