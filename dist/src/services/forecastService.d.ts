export declare function generateForecasts(userId: string, sku: string): Promise<{
    userId: string;
    sku: string;
    forecastDate: Date;
    baseValue: number;
    upperBound: number;
    lowerBound: number;
    confidenceLevel: number;
    modelVersion: string;
}[]>;
//# sourceMappingURL=forecastService.d.ts.map