export declare function generateForecasts(userId: string, sku: string): Promise<{
    sku: string;
    forecast_period: string;
    base_forecast: number;
    upper_bound: number;
    lower_bound: number;
    confidence_level: number;
    seasonal_factor: number;
    trend_component: number;
    generated_at: string;
    model_version: string;
    data_quality_score: number;
    alerts: string[];
}[]>;
export declare function getForecastHistory(userId: string, filters: {
    sku?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    sku: string;
    forecast_period: string;
    base_forecast: number;
    upper_bound: number;
    lower_bound: number;
    confidence_level: number;
    seasonal_factor: number;
    trend_component: number;
    generated_at: string;
    model_version: string;
}[]>;
export declare function getForecastMetrics(userId: string, sku?: string): Promise<{
    totalForecasts: number;
    avgForecast: number;
    avgPrecision: number;
    categoryMetrics: {
        category: string;
        avgSales: number | null;
        totalProducts: number;
    }[];
}>;
//# sourceMappingURL=forecastService.d.ts.map