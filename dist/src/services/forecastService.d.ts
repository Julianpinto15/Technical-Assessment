export declare function generateForecasts(userId: string, sku: string, forecastPeriod?: string): Promise<{
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
    data_source: string;
    alerts: string[];
}[]>;
export declare function getAvailableSkus(userId: string): Promise<{
    historical: string[];
    forecasted: string[];
    canSimulate: string;
}>;
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