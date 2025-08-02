export declare function generateForecasts(userId: string, sku: string): Promise<{
    sku: string;
    forecast_period: Date;
    base_forecast: number;
    upper_bound: number;
    lower_bound: number;
    confidence_level: number;
    seasonal_factor: number;
    trend_component: number;
    generated_at: string;
    model_version: string;
    data_quality_score: number;
}[]>;
//# sourceMappingURL=forecastService.d.ts.map