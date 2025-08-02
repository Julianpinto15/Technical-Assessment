"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateForecastsWithValidation = simulateForecastsWithValidation;
function simulateForecastsWithValidation({ history, horizon, confidenceLevel, }) {
    const baseAvg = history.reduce((acc, d) => acc + d.quantity, 0) / history.length;
    const stdDev = Math.sqrt(history.reduce((acc, d) => acc + Math.pow(d.quantity - baseAvg, 2), 0) /
        history.length);
    const zValues = { 80: 1.28, 90: 1.64, 95: 1.96 };
    const validLevels = Object.keys(zValues).map(Number);
    if (!validLevels.includes(confidenceLevel)) {
        throw new Error(`Invalid confidence level. Must be one of: ${validLevels.join(", ")}`);
    }
    const results = Array.from({ length: horizon }, (_, i) => {
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i + 1);
        const noise = Math.random() * stdDev * 0.5;
        const baseValue = baseAvg + noise;
        const z = zValues[confidenceLevel];
        return {
            forecastDate,
            baseValue,
            upperBound: baseValue + z * stdDev,
            lowerBound: baseValue - z * stdDev,
        };
    });
    return results;
}
//# sourceMappingURL=forecastSimulator.js.map