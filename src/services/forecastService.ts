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

  const simulated = simulateForecastsWithValidation({
    history,
    horizon: config.forecastHorizon,
    confidenceLevel: config.confidenceLevel,
  });

  const modelVersion = "sim-v1";

  const records = simulated.map((item) => ({
    userId,
    sku,
    forecastDate: item.forecastDate,
    baseValue: item.baseValue,
    upperBound: item.upperBound,
    lowerBound: item.lowerBound,
    confidenceLevel: config.confidenceLevel,
    modelVersion,
  }));

  await prisma.forecast.createMany({ data: records });
  return records;
}
