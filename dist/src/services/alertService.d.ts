import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
type ForecastData = {
    sku: string;
    data_quality_score: number;
    base_forecast: number;
    forecastDate: Date;
};
type AlertResult = {
    message: string;
    forecastDate: string;
};
export declare function createAlertThreshold(userId: string, data: AlertThresholdsInterface): Promise<{
    id: string;
    sku: string | null;
    category: string | null;
    metric: string;
    minThreshold: number;
    maxThreshold: number;
    condition: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}>;
export declare function getAlertThresholds(userId: string): Promise<{
    id: string;
    sku: string | null;
    category: string | null;
    metric: string;
    minThreshold: number;
    maxThreshold: number;
    condition: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}[]>;
export declare function checkAlerts(userId: string, forecasts: ForecastData[]): Promise<AlertResult[]>;
export {};
//# sourceMappingURL=alertService.d.ts.map