import prisma from "../prismaClient";
import { simulateForecastsWithValidation } from "../utils/forecastSimulator";

export async function generateForecasts(userId: string, sku: string) {
  const config = await prisma.configuration.findUnique({ where: { userId } });
  if (!config) throw new Error("No forecast configuration found for user");

  const history = await prisma.salesData.findMany({
    where: { userId, sku },
    orderBy: { date: "asc" },
    select: { date: true, quantity: true },
  });

  if (history.length < 2)
    throw new Error("Not enough historical data to forecast");

  // Seleccionar un solo valor para horizon y confidenceLevel
  const horizon = Math.max(...config.forecastHorizon); // Horizonte más largo
  const confidenceLevel = Math.max(...config.confidenceLevel); // Convertir a decimal

  const simulated = simulateForecastsWithValidation({
    history,
    horizon,
    confidenceLevel,
  });

  const modelVersion = "v1.0";
  const generatedAt = new Date();
  const dataQualityScore = 0.87; // Puedes calcular esto dinámicamente

  // Guardar en base de datos
  await prisma.forecast.createMany({
    data: simulated.map((item) => ({
      userId,
      sku,
      forecastDate: item.forecastDate,
      baseValue: item.baseValue,
      upperBound: item.upperBound,
      lowerBound: item.lowerBound,
      confidenceLevel,
      seasonalFactor: item.seasonalFactor,
      trendComponent: item.trendComponent,
      generatedAt,
      modelVersion,
    })),
  });

  // Retornar estructura extendida para respuesta JSON
  return simulated.map((item) => ({
    sku,
    forecast_period: item.forecastDate,
    base_forecast: item.baseValue,
    upper_bound: item.upperBound,
    lower_bound: item.lowerBound,
    confidence_level: confidenceLevel,
    seasonal_factor: item.seasonalFactor,
    trend_component: item.trendComponent,
    generated_at: generatedAt.toISOString(),
    model_version: modelVersion,
    data_quality_score: dataQualityScore,
  }));
}
