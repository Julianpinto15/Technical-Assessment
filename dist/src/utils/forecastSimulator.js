"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateForecastsWithValidation = simulateForecastsWithValidation;
function simulateForecastsWithValidation({ history, horizon, confidenceLevel, baseDate = new Date(Math.max(...history.map((h) => h.date.getTime()))), }) {
    if (horizon < 1 || horizon > 6) {
        throw new Error("Horizon must be between 1 and 6 months");
    }
    if (history.length < 2) {
        throw new Error("At least 2 historical data points are required");
    }
    const validLevels = [0.8, 0.9, 0.95];
    if (!validLevels.includes(confidenceLevel)) {
        throw new Error(`Invalid confidence level. Must be one of: ${validLevels.join(", ")}`);
    }
    const baseAvg = history.reduce((acc, d) => acc + d.quantity, 0) / history.length;
    const stdDev = Math.sqrt(history.reduce((acc, d) => acc + Math.pow(d.quantity - baseAvg, 2), 0) /
        history.length);
    const trendComponent = history.length > 1
        ? (history[history.length - 1].quantity - history[0].quantity) /
            (history.length - 1)
        : 0;
    const monthlyAverages = new Map();
    history.forEach((h) => {
        const month = h.date.getMonth();
        if (!monthlyAverages.has(month)) {
            monthlyAverages.set(month, []);
        }
        monthlyAverages.get(month).push(h.quantity);
    });
    const seasonalFactors = new Map();
    monthlyAverages.forEach((quantities, month) => {
        const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
        seasonalFactors.set(month, avg / baseAvg || 1);
    });
    const zValues = {
        0.8: 1.28,
        0.9: 1.64,
        0.95: 1.96,
    };
    const results = Array.from({ length: horizon }, (_, i) => {
        const forecastDate = new Date(baseDate);
        forecastDate.setMonth(baseDate.getMonth() + i + 1);
        const month = forecastDate.getMonth();
        const seasonalFactor = seasonalFactors.get(month) || 1;
        const trend = trendComponent * (i + 1);
        const baseValue = baseAvg * seasonalFactor + trend;
        const noise = Math.random() * stdDev * 0.5;
        const adjustedBaseValue = baseValue + noise;
        const z = zValues[confidenceLevel];
        const upperBound = adjustedBaseValue + z * stdDev;
        const lowerBound = adjustedBaseValue - z * stdDev;
        return {
            forecastDate,
            baseValue: adjustedBaseValue,
            upperBound,
            lowerBound,
            seasonalFactor,
            trendComponent,
        };
    });
    return results;
}
//# sourceMappingURL=forecastSimulator.js.map