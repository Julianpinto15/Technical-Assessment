"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateForecasts = generateForecasts;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const forecastSimulator_1 = require("../utils/forecastSimulator");
async function generateForecasts(userId, sku) {
    const config = await prismaClient_1.default.configuration.findUnique({ where: { userId } });
    if (!config)
        throw new Error("No forecast configuration found for user");
    const history = await prismaClient_1.default.salesData.findMany({
        where: { userId, sku },
        orderBy: { date: "asc" },
        select: { date: true, quantity: true },
    });
    if (history.length < 2)
        throw new Error("Not enough historical data to forecast");
    // Seleccionar un solo valor para horizon y confidenceLevel
    const horizon = Math.max(...config.forecastHorizon); // Horizonte más largo
    const confidenceLevel = Math.max(...config.confidenceLevel); // Convertir a decimal
    const simulated = (0, forecastSimulator_1.simulateForecastsWithValidation)({
        history,
        horizon,
        confidenceLevel,
    });
    const modelVersion = "v1.0";
    const generatedAt = new Date();
    const dataQualityScore = 0.87; // Puedes calcular esto dinámicamente
    // Guardar en base de datos
    await prismaClient_1.default.forecast.createMany({
        data: simulated.map((item) => ({
            userId,
            sku,
            forecastDate: item.forecastDate,
            baseValue: item.baseValue,
            upperBound: item.upperBound,
            lowerBound: item.lowerBound,
            confidenceLevel,
            seasonalFactor: item.seasonalFactor,
            trendComponent: item.trendComponent,
            generatedAt,
            modelVersion,
        })),
    });
    // Retornar estructura extendida para respuesta JSON
    return simulated.map((item) => ({
        sku,
        forecast_period: item.forecastDate,
        base_forecast: item.baseValue,
        upper_bound: item.upperBound,
        lower_bound: item.lowerBound,
        confidence_level: confidenceLevel,
        seasonal_factor: item.seasonalFactor,
        trend_component: item.trendComponent,
        generated_at: generatedAt.toISOString(),
        model_version: modelVersion,
        data_quality_score: dataQualityScore,
    }));
}
//# sourceMappingURL=forecastService.js.map