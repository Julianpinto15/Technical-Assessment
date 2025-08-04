"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateForecasts = generateForecasts;
exports.getAvailableSkus = getAvailableSkus;
exports.getForecastHistory = getForecastHistory;
exports.getForecastMetrics = getForecastMetrics;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const forecastSimulator_1 = require("../utils/forecastSimulator");
const alertService_1 = require("./alertService");
// Función para generar datos históricos simulados
function generateSimulatedHistory(sku, months = 12) {
    const history = [];
    // Generar patrones realistas basados en el SKU
    const skuHash = sku.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
    }, 0);
    const baseValue = 10 + Math.abs(skuHash % 90); // Base entre 10-100
    const seasonalAmplitude = 0.2 + Math.abs(skuHash % 100) / 500; // 0.2-0.4
    const trendRate = -0.02 + Math.abs(skuHash % 100) / 2500; // -0.02 a 0.02
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    for (let i = 0; i < months; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        // Componente estacional (ciclo anual)
        const seasonalFactor = 1 + seasonalAmplitude * Math.sin((i / 12) * 2 * Math.PI);
        // Componente de tendencia
        const trendFactor = 1 + trendRate * i;
        // Ruido aleatorio (±15%)
        const noiseFactor = 0.85 + Math.random() * 0.3;
        // Variación semanal (algunos productos venden más en ciertos días)
        const weeklyFactor = 0.9 + Math.abs(skuHash % 7) / 35;
        const quantity = Math.max(1, Math.round(baseValue * seasonalFactor * trendFactor * noiseFactor * weeklyFactor));
        history.push({
            date,
            quantity,
        });
    }
    console.log(`Generated ${months} months of simulated data for SKU ${sku}`);
    console.log(`Base value: ${baseValue}, Seasonal amplitude: ${seasonalAmplitude.toFixed(3)}, Trend: ${trendRate.toFixed(4)}`);
    return history;
}
async function generateForecasts(userId, sku, forecastPeriod) {
    // Verificar configuración
    const config = await prismaClient_1.default.configuration.findUnique({ where: { userId } });
    if (!config)
        throw new Error("No forecast configuration found for user");
    // Intentar obtener datos históricos reales
    let history = await prismaClient_1.default.salesData.findMany({
        where: { userId, sku },
        orderBy: { date: "asc" },
        select: { date: true, quantity: true },
    });
    let dataSource = "historical";
    // Si no hay suficientes datos históricos, generar datos simulados
    if (history.length < 2) {
        console.log(`SKU ${sku}: Insufficient historical data (${history.length} records). Generating simulated data...`);
        history = generateSimulatedHistory(sku, 18); // 18 meses para mejor precisión
        dataSource = "simulated";
    }
    else {
        console.log(`SKU ${sku}: Using ${history.length} historical records`);
    }
    const horizon = Math.max(...config.forecastHorizon);
    const confidenceLevel = Math.max(...config.confidenceLevel);
    // Usar forecastPeriod si se proporciona, o la última fecha de history como base
    const baseDate = forecastPeriod
        ? new Date(forecastPeriod)
        : history[history.length - 1].date;
    // Validar que baseDate es una fecha válida
    if (isNaN(baseDate.getTime())) {
        throw new Error("Invalid forecast_period format");
    }
    const simulated = (0, forecastSimulator_1.simulateForecastsWithValidation)({
        history,
        horizon,
        confidenceLevel,
        baseDate,
    });
    const modelVersion = dataSource === "simulated" ? "v1.0-sim" : "v1.0";
    const generatedAt = new Date();
    // Verificar pronósticos existentes para evitar duplicados
    const existingForecasts = await prismaClient_1.default.forecast.findMany({
        where: {
            userId,
            sku,
            forecastDate: { in: simulated.map((item) => item.forecastDate) },
        },
        select: { forecastDate: true },
    });
    const existingDates = new Set(existingForecasts.map((f) => f.forecastDate.toISOString()));
    // Filtrar solo los pronósticos que no existen ya
    const newForecasts = simulated.filter((item) => !existingDates.has(item.forecastDate.toISOString()));
    // Solo crear pronósticos si hay nuevos
    if (newForecasts.length > 0) {
        await prismaClient_1.default.forecast.createMany({
            data: newForecasts.map((item) => ({
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
    }
    // Calcular data_quality_score dinámicamente
    let dataQualityScore = 0.87;
    if (dataSource === "simulated") {
        // Para datos simulados, calcular calidad basada en consistencia del patrón
        const values = history.map((h) => h.quantity);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;
        // Calidad inversa a la variabilidad (más consistente = mejor calidad)
        dataQualityScore = Math.max(0.6, Math.min(0.95, 1 - coefficientOfVariation));
    }
    else {
        // Para datos históricos, calcular precisión comparando con ventas reales
        const sales = await prismaClient_1.default.salesData.findMany({
            where: { userId, sku },
            select: { date: true, quantity: true },
        });
        let totalError = 0;
        let matchedCount = 0;
        for (const sim of simulated) {
            const sale = sales.find((s) => s.date.toISOString() === sim.forecastDate.toISOString());
            if (sale) {
                const error = Math.abs(sim.baseValue - sale.quantity) / sale.quantity;
                totalError += error;
                matchedCount++;
            }
        }
        if (matchedCount > 0) {
            dataQualityScore = Math.max(0, Math.min(1, 1 - totalError / matchedCount));
        }
    }
    // Generar alertas para todos los pronósticos simulados
    const alerts = await (0, alertService_1.checkAlerts)(userId, simulated.map((item) => ({
        sku,
        data_quality_score: dataQualityScore,
        base_forecast: item.baseValue,
        forecastDate: item.forecastDate,
    })));
    console.log(`Generated ${simulated.length} forecasts for SKU ${sku} using ${dataSource} data`);
    console.log(`Data quality score: ${dataQualityScore.toFixed(3)}`);
    // Retornar todos los pronósticos simulados con información sobre el origen de datos
    return simulated.map((item) => ({
        sku,
        forecast_period: item.forecastDate.toISOString(),
        base_forecast: item.baseValue,
        upper_bound: item.upperBound,
        lower_bound: item.lowerBound,
        confidence_level: confidenceLevel,
        seasonal_factor: item.seasonalFactor,
        trend_component: item.trendComponent,
        generated_at: generatedAt.toISOString(),
        model_version: modelVersion,
        data_quality_score: dataQualityScore,
        data_source: dataSource, // Información adicional para debugging
        alerts: alerts
            .filter((alert) => alert.forecastDate === item.forecastDate.toISOString())
            .map((alert) => alert.message),
    }));
}
// Función auxiliar para obtener SKUs disponibles (útil para testing)
async function getAvailableSkus(userId) {
    const historicalSkus = await prismaClient_1.default.salesData.findMany({
        where: { userId },
        select: { sku: true },
        distinct: ["sku"],
    });
    const forecastSkus = await prismaClient_1.default.forecast.findMany({
        where: { userId },
        select: { sku: true },
        distinct: ["sku"],
    });
    return {
        historical: historicalSkus.map((s) => s.sku),
        forecasted: forecastSkus.map((s) => s.sku),
        canSimulate: "ANY_SKU", // Indica que cualquier SKU se puede simular
    };
}
// El resto de las funciones permanecen igual...
async function getForecastHistory(userId, filters) {
    const { sku, startDate, endDate, category, limit = 100, offset = 0, } = filters;
    const where = { userId };
    if (sku)
        where.sku = sku;
    if (startDate || endDate) {
        where.forecastDate = {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
        };
    }
    if (category) {
        const skus = await prismaClient_1.default.salesData
            .findMany({
            where: { userId, category },
            select: { sku: true },
        })
            .then((data) => data.map((d) => d.sku));
        const forecasts = await prismaClient_1.default.forecast.findMany({
            where: {
                userId,
                sku: { in: skus },
                forecastDate: {
                    gte: startDate ? new Date(startDate) : undefined,
                    lte: endDate ? new Date(endDate) : undefined,
                },
            },
            take: limit,
            skip: offset,
            orderBy: { forecastDate: "desc" },
            select: {
                sku: true,
                forecastDate: true,
                baseValue: true,
                upperBound: true,
                lowerBound: true,
                confidenceLevel: true,
                seasonalFactor: true,
                trendComponent: true,
                generatedAt: true,
                modelVersion: true,
            },
        });
        const skuCategories = await prismaClient_1.default.salesData.findMany({
            where: { userId, sku: { in: skus } },
            select: { sku: true, category: true },
            distinct: ["sku"],
        });
        const categoryMap = new Map(skuCategories.map((sc) => [sc.sku, sc.category]));
        return forecasts.map((f) => ({
            sku: f.sku,
            forecast_period: f.forecastDate.toISOString(),
            base_forecast: f.baseValue,
            upper_bound: f.upperBound,
            lower_bound: f.lowerBound,
            confidence_level: f.confidenceLevel,
            seasonal_factor: f.seasonalFactor,
            trend_component: f.trendComponent,
            generated_at: f.generatedAt.toISOString(),
            model_version: f.modelVersion,
            category: categoryMap.get(f.sku) || category,
        }));
    }
    const forecasts = await prismaClient_1.default.forecast.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { forecastDate: "desc" },
        select: {
            sku: true,
            forecastDate: true,
            baseValue: true,
            upperBound: true,
            lowerBound: true,
            confidenceLevel: true,
            seasonalFactor: true,
            trendComponent: true,
            generatedAt: true,
            modelVersion: true,
        },
    });
    return forecasts.map((f) => ({
        sku: f.sku,
        forecast_period: f.forecastDate.toISOString(),
        base_forecast: f.baseValue,
        upper_bound: f.upperBound,
        lower_bound: f.lowerBound,
        confidence_level: f.confidenceLevel,
        seasonal_factor: f.seasonalFactor,
        trend_component: f.trendComponent,
        generated_at: f.generatedAt.toISOString(),
        model_version: f.modelVersion,
    }));
}
async function getForecastMetrics(userId, sku) {
    const where = { userId };
    if (sku)
        where.sku = sku;
    const forecasts = await prismaClient_1.default.forecast.findMany({
        where,
        select: {
            sku: true,
            baseValue: true,
            forecastDate: true,
        },
    });
    const sales = await prismaClient_1.default.salesData.findMany({
        where: { userId, sku },
        select: { sku: true, quantity: true, date: true, category: true },
    });
    const totalForecasts = forecasts.length;
    const avgForecast = forecasts.length
        ? forecasts.reduce((sum, f) => sum + f.baseValue, 0) / forecasts.length
        : 0;
    let totalError = 0;
    let matchedCount = 0;
    for (const forecast of forecasts) {
        const sale = sales.find((s) => s.date.toISOString() === forecast.forecastDate.toISOString());
        if (sale) {
            const error = Math.abs(forecast.baseValue - sale.quantity) / sale.quantity;
            totalError += error;
            matchedCount++;
        }
    }
    const avgPrecision = matchedCount ? 1 - totalError / matchedCount : 0;
    const categoryMetrics = await prismaClient_1.default.salesData.groupBy({
        by: ["category"],
        where: { userId },
        _avg: { quantity: true },
        _count: { quantity: true },
    });
    return {
        totalForecasts,
        avgForecast,
        avgPrecision,
        categoryMetrics: categoryMetrics.map((cm) => ({
            category: cm.category,
            avgSales: cm._avg.quantity,
            totalProducts: cm._count.quantity,
        })),
    };
}
//# sourceMappingURL=forecastService.js.map