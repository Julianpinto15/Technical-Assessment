import prisma from "../prismaClient";
import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
import { NotificationsInterface } from "../interface/NotificationsInterface";

export async function upsertForecastConfig(
  userId: string,
  forecastHorizon: number[],
  confidenceLevel: number[],
  alertThresholds: AlertThresholdsInterface = {
    minThreshold: 0.1,
    maxThreshold: 0.9,
    metric: "precision",
    condition: "below",
  },
  notificationSettings: NotificationsInterface = { email: false, sms: false }
) {
  // Validar que el usuario exista
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    throw new Error("User not found");
  }

  // Validar alertThresholds
  if (alertThresholds.minThreshold >= alertThresholds.maxThreshold) {
    throw new Error("minThreshold must be less than maxThreshold");
  }
  if (
    alertThresholds.metric &&
    !["precision", "sales"].includes(alertThresholds.metric)
  ) {
    throw new Error("Invalid metric. Must be 'precision' or 'sales'.");
  }
  if (
    alertThresholds.condition &&
    !["below", "above"].includes(alertThresholds.condition)
  ) {
    throw new Error("Invalid condition. Must be 'below' or 'above'.");
  }

  // Actualizar o crear la configuración en Configuration
  const config = await prisma.configuration.upsert({
    where: { userId },
    create: {
      userId,
      forecastHorizon,
      confidenceLevel,
      notificationSettings,
    },
    update: {
      forecastHorizon,
      confidenceLevel,
      notificationSettings,
    },
  });

  // Actualizar o crear el umbral en AlertThreshold sin usar índice con nulls
  if (alertThresholds) {
    const existing = await prisma.alertThreshold.findFirst({
      where: {
        userId,
        metric: alertThresholds.metric || "precision",
        sku: alertThresholds.sku ?? undefined,
        category: alertThresholds.category ?? undefined,
      },
    });

    if (existing) {
      await prisma.alertThreshold.update({
        where: { id: existing.id },
        data: {
          sku: alertThresholds.sku,
          category: alertThresholds.category,
          metric: alertThresholds.metric || "precision",
          minThreshold: alertThresholds.minThreshold,
          maxThreshold: alertThresholds.maxThreshold,
          condition: alertThresholds.condition || "below",
        },
      });
    } else {
      await prisma.alertThreshold.create({
        data: {
          userId,
          sku: alertThresholds.sku,
          category: alertThresholds.category,
          metric: alertThresholds.metric || "precision",
          minThreshold: alertThresholds.minThreshold,
          maxThreshold: alertThresholds.maxThreshold,
          condition: alertThresholds.condition || "below",
        },
      });
    }
  }

  return config;
}
