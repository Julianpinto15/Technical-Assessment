import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
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
export declare function checkAlerts(userId: string, forecasts: {
    sku: string;
    data_quality_score: number;
    base_forecast: number;
}[]): Promise<string[]>;
//# sourceMappingURL=alertService.d.ts.map