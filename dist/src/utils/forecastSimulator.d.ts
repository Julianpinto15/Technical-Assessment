interface ForecastInput {
    history: {
        date: Date;
        quantity: number;
    }[];
    horizon: number;
    confidenceLevel: number;
}
interface ForecastOutput {
    forecastDate: Date;
    baseValue: number;
    upperBound: number;
    lowerBound: number;
    seasonalFactor: number;
    trendComponent: number;
}
export declare function simulateForecastsWithValidation({ history, horizon, confidenceLevel, }: ForecastInput): ForecastOutput[];
export {};
//# sourceMappingURL=forecastSimulator.d.ts.map