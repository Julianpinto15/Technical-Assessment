"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postForecast = void 0;
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
//# sourceMappingURL=forecastController.js.map