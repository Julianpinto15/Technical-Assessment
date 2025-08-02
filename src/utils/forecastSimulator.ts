interface ForecastInput {
  history: { date: Date; quantity: number }[];
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

export function simulateForecastsWithValidation({
  history,
  horizon,
  confidenceLevel,
}: ForecastInput): ForecastOutput[] {
  // Validar horizonte
  if (horizon < 1 || horizon > 6) {
    throw new Error("Horizon must be between 1 and 6 months");
  }

  // Validar datos históricos
  if (history.length < 2) {
    throw new Error("At least 2 historical data points are required");
  }

  // Validar confidenceLevel (espera valores entre 0 y 1)
  const validLevels = [0.8, 0.9, 0.95];
  if (!validLevels.includes(confidenceLevel)) {
    throw new Error(
      `Invalid confidence level. Must be one of: ${validLevels.join(", ")}`
    );
  }

  // Calcular promedio y desviación estándar
  const baseAvg =
    history.reduce((acc, d) => acc + d.quantity, 0) / history.length;
  const stdDev = Math.sqrt(
    history.reduce((acc, d) => acc + Math.pow(d.quantity - baseAvg, 2), 0) /
      history.length
  );

  // Calcular tendencia simple (diferencia promedio entre puntos consecutivos)
  const trendComponent =
    history.length > 1
      ? (history[history.length - 1].quantity - history[0].quantity) /
        (history.length - 1)
      : 0;

  // Calcular factor estacional simple (promedio por mes)
  const monthlyAverages = new Map<number, number[]>();
  history.forEach((h) => {
    const month = h.date.getMonth();
    if (!monthlyAverages.has(month)) {
      monthlyAverages.set(month, []);
    }
    monthlyAverages.get(month)!.push(h.quantity);
  });
  const seasonalFactors = new Map<number, number>();
  monthlyAverages.forEach((quantities, month) => {
    const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    seasonalFactors.set(month, avg / baseAvg || 1); // Normalizar respecto al promedio
  });

  // Usar la última fecha de los datos históricos
  const lastDate = new Date(Math.max(...history.map((h) => h.date.getTime())));

  // Generar valores Z para intervalos de confianza
  const zValues: { [key: number]: number } = {
    0.8: 1.28,
    0.9: 1.64,
    0.95: 1.96,
  };

  const results: ForecastOutput[] = Array.from({ length: horizon }, (_, i) => {
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(lastDate.getMonth() + i + 1);

    // Aplicar tendencia y estacionalidad
    const month = forecastDate.getMonth();
    const seasonalFactor = seasonalFactors.get(month) || 1;
    const trend = trendComponent * (i + 1);
    const baseValue = baseAvg * seasonalFactor + trend;

    // Añadir ruido
    const noise = Math.random() * stdDev * 0.5;
    const adjustedBaseValue = baseValue + noise;

    // Calcular intervalos de confianza
    const z = zValues[confidenceLevel];
    const upperBound = adjustedBaseValue + z * stdDev;
    const lowerBound = adjustedBaseValue - z * stdDev;

    return {
      forecastDate,
      baseValue: adjustedBaseValue,
      upperBound,
      lowerBound,
      seasonalFactor,
      trendComponent,
    };
  });

  return results;
}
