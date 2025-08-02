export declare function simulateForecastsWithValidation({ history, horizon, confidenceLevel, }: {
    history: {
        date: Date;
        quantity: number;
    }[];
    horizon: number;
    confidenceLevel: number;
}): {
    forecastDate: Date;
    baseValue: number;
    upperBound: number;
    lowerBound: number;
}[];
//# sourceMappingURL=forecastSimulator.d.ts.map