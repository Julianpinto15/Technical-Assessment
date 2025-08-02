export function simulateForecastsWithValidation({
  history,
  horizon,
  confidenceLevel,
}: {
  history: { date: Date; quantity: number }[];
  horizon: number;
  confidenceLevel: number;
}) {
  const baseAvg =
    history.reduce((acc, d) => acc + d.quantity, 0) / history.length;
  const stdDev = Math.sqrt(
    history.reduce((acc, d) => acc + Math.pow(d.quantity - baseAvg, 2), 0) /
      history.length
  );

  const zValues = { 80: 1.28, 90: 1.64, 95: 1.96 } as const;
  const validLevels = Object.keys(zValues).map(Number);

  if (!validLevels.includes(confidenceLevel)) {
    throw new Error(
      `Invalid confidence level. Must be one of: ${validLevels.join(", ")}`
    );
  }

  const results = Array.from({ length: horizon }, (_, i) => {
    const forecastDate = new Date();
    forecastDate.setMonth(forecastDate.getMonth() + i + 1);

    const noise = Math.random() * stdDev * 0.5;
    const baseValue = baseAvg + noise;

    const z = zValues[confidenceLevel as keyof typeof zValues];

    return {
      forecastDate,
      baseValue,
      upperBound: baseValue + z * stdDev,
      lowerBound: baseValue - z * stdDev,
    };
  });

  return results;
}
