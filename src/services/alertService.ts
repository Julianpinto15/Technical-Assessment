import prisma from "../prismaClient";
import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
import { NotificationsInterface } from "../interface/NotificationsInterface";

// Función helper para validar y convertir notificationSettings
function parseNotificationSettings(
  jsonValue: unknown
): NotificationsInterface | null {
  if (!jsonValue || typeof jsonValue !== "object") {
    return null;
  }

  const obj = jsonValue as Record<string, unknown>;

  // Validar que tiene las propiedades requeridas
  if (typeof obj.email === "boolean" && typeof obj.sms === "boolean") {
    return obj as unknown as NotificationsInterface;
  }

  return null;
}

// Crear un umbral de alerta
export async function createAlertThreshold(
  userId: string,
  data: AlertThresholdsInterface
) {
  if (!["precision", "sales"].includes(data.metric)) {
    throw new Error("Invalid metric. Must be 'precision' or 'sales'.");
  }
  if (!["below", "above"].includes(data.condition)) {
    throw new Error("Invalid condition. Must be 'below' or 'above'.");
  }
  if (data.minThreshold >= data.maxThreshold) {
    throw new Error("minThreshold must be less than maxThreshold.");
  }

  return prisma.alertThreshold.create({
    data: {
      userId,
      sku: data.sku,
      category: data.category,
      metric: data.metric,
      minThreshold: data.minThreshold,
      maxThreshold: data.maxThreshold,
      condition: data.condition,
    },
  });
}

// Listar umbrales de alerta
export async function getAlertThresholds(userId: string) {
  return prisma.alertThreshold.findMany({ where: { userId } });
}

// Verificar alertas para nuevos pronósticos
export async function checkAlerts(
  userId: string,
  forecasts: {
    sku: string;
    data_quality_score: number;
    base_forecast: number;
  }[]
) {
  const alerts: string[] = [];

  for (const forecast of forecasts) {
    const thresholds = await prisma.alertThreshold.findMany({
      where: {
        userId,
        OR: [{ sku: forecast.sku }, { sku: null }],
      },
    });

    for (const threshold of thresholds) {
      if (threshold.metric === "precision") {
        if (
          threshold.condition === "below" &&
          typeof threshold.minThreshold === "number" &&
          forecast.data_quality_score < threshold.minThreshold
        ) {
          alerts.push(
            `Precision too low for SKU ${forecast.sku}: ${forecast.data_quality_score}`
          );
        } else if (
          threshold.condition === "above" &&
          typeof threshold.maxThreshold === "number" &&
          forecast.data_quality_score > threshold.maxThreshold
        ) {
          alerts.push(
            `Precision too high for SKU ${forecast.sku}: ${forecast.data_quality_score}`
          );
        }
      } else if (threshold.metric === "sales") {
        if (
          threshold.condition === "below" &&
          typeof threshold.minThreshold === "number" &&
          forecast.base_forecast < threshold.minThreshold
        ) {
          alerts.push(
            `Sales forecast too low for SKU ${forecast.sku}: ${forecast.base_forecast}`
          );
        } else if (
          threshold.condition === "above" &&
          typeof threshold.maxThreshold === "number" &&
          forecast.base_forecast > threshold.maxThreshold
        ) {
          alerts.push(
            `Sales forecast too high for SKU ${forecast.sku}: ${forecast.base_forecast}`
          );
        }
      }
    }
  }

  // Enviar notificaciones si hay alertas
  if (alerts.length > 0) {
    const config = await prisma.configuration.findUnique({
      where: { userId },
      select: { notificationSettings: true },
    });

    if (config?.notificationSettings) {
      const settings = parseNotificationSettings(config.notificationSettings);

      if (settings) {
        if (settings.email) {
          console.log("Sending email notifications:", alerts);
          // Implementar lógica real de envío de email (ej. nodemailer)
        }
        if (settings.sms) {
          console.log("Sending SMS notifications:", alerts);
          // Implementar lógica real de SMS (ej. Twilio)
        }
      } else {
        console.warn("Invalid notification settings format");
      }
    }
  }

  return alerts;
}
