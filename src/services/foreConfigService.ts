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
  },
  notificationSettings: NotificationsInterface = { email: false, sms: false }
) {
  // Validar que el usuario exista
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    throw new Error("User not found");
  }

  return prisma.configuration.upsert({
    where: { userId },
    create: {
      userId,
      forecastHorizon,
      confidenceLevel,
      alertThresholds: JSON.stringify(alertThresholds),
      notificationSettings: JSON.stringify(notificationSettings),
    },
    update: {
      forecastHorizon,
      confidenceLevel,
      alertThresholds: JSON.stringify(alertThresholds),
      notificationSettings: JSON.stringify(notificationSettings),
    },
  });
}
