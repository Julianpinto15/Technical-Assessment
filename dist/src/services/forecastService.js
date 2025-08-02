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
    const simulated = (0, forecastSimulator_1.simulateForecastsWithValidation)({
        history,
        horizon: config.forecastHorizon,
        confidenceLevel: config.confidenceLevel,
    });
    const modelVersion = "sim-v1";
    const records = simulated.map((item) => ({
        userId,
        sku,
        forecastDate: item.forecastDate,
        baseValue: item.baseValue,
        upperBound: item.upperBound,
        lowerBound: item.lowerBound,
        confidenceLevel: config.confidenceLevel,
        modelVersion,
    }));
    await prismaClient_1.default.forecast.createMany({ data: records });
    return records;
}
//# sourceMappingURL=forecastService.js.map