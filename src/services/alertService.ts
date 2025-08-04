import prisma from "../prismaClient";
import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
import { NotificationsInterface } from "../interface/NotificationsInterface";

// Tipos para mejor tipado
type ForecastData = {
  sku: string;
  data_quality_score: number;
  base_forecast: number;
  forecastDate: Date;
};

type AlertResult = {
  message: string;
  forecastDate: string;
};

// Función helper para validar y convertir notificationSettings
function parseNotificationSettings(
  jsonValue: unknown
): NotificationsInterface | null {
  if (!jsonValue || typeof jsonValue !== "object") {
    return null;
  }

  const obj = jsonValue as Record<string, unknown>;

  if (typeof obj.email === "boolean" && typeof obj.sms === "boolean") {
    return obj as NotificationsInterface;
  }

  return null;
}

// Validaciones separadas para mejor legibilidad
function validateMetric(metric: string): void {
  if (!["precision", "sales"].includes(metric)) {
    throw new Error("Invalid metric. Must be 'precision' or 'sales'.");
  }
}

function validateCondition(condition: string): void {
  if (!["below", "above"].includes(condition)) {
    throw new Error("Invalid condition. Must be 'below' or 'above'.");
  }
}

function validateThresholds(minThreshold: number, maxThreshold: number): void {
  if (minThreshold >= maxThreshold) {
    throw new Error("minThreshold must be less than maxThreshold.");
  }
}

// Crear un umbral de alerta
export async function createAlertThreshold(
  userId: string,
  data: AlertThresholdsInterface
) {
  validateMetric(data.metric);
  validateCondition(data.condition);
  validateThresholds(data.minThreshold, data.maxThreshold);

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

// Funciones de verificación actualizadas para mejor evaluación de umbrales
function checkPrecisionAlert(
  forecast: ForecastData,
  threshold: AlertThresholdsInterface,
  alertKey: string,
  seenMessages: Set<string>
): AlertResult | null {
  const { data_quality_score, sku, forecastDate } = forecast;
  const { condition, minThreshold, maxThreshold } = threshold;

  if (seenMessages.has(alertKey)) return null;

  // Normalizar data_quality_score si los umbrales están en una escala diferente
  // Suponemos que los umbrales están en la escala 0-1, no 0-150
  const normalizedScore = data_quality_score * 150; // Escala de 0-1 a 0-150
  if (condition === "above" && typeof maxThreshold === "number") {
    if (normalizedScore > maxThreshold) {
      seenMessages.add(alertKey);
      return {
        message: `Precision too high for SKU ${sku}: ${data_quality_score}`,
        forecastDate: forecastDate.toISOString(),
      };
    }
  }

  if (condition === "above" && typeof maxThreshold === "number") {
    if (data_quality_score > maxThreshold) {
      seenMessages.add(alertKey);
      return {
        message: `Precision too high for SKU ${sku}: ${data_quality_score}`,
        forecastDate: forecastDate.toISOString(),
      };
    }
  }

  return null;
}

function checkSalesAlert(
  forecast: ForecastData,
  threshold: AlertThresholdsInterface,
  alertKey: string,
  seenMessages: Set<string>
): AlertResult | null {
  const { base_forecast, sku, forecastDate } = forecast;
  const { condition, minThreshold, maxThreshold } = threshold;

  if (seenMessages.has(alertKey)) return null;

  // Evaluación mejorada de condiciones para sales
  if (condition === "below" && typeof minThreshold === "number") {
    if (base_forecast < minThreshold) {
      seenMessages.add(alertKey);
      return {
        message: `Sales forecast too low for SKU ${sku}: ${base_forecast}`,
        forecastDate: forecastDate.toISOString(),
      };
    }
  }

  if (condition === "above" && typeof maxThreshold === "number") {
    if (base_forecast > maxThreshold) {
      seenMessages.add(alertKey);
      return {
        message: `Sales forecast too high for SKU ${sku}: ${base_forecast}`,
        forecastDate: forecastDate.toISOString(),
      };
    }
  }

  return null;
}

// Tipo para los datos que vienen de Prisma
type PrismaAlertThreshold = {
  id: string;
  sku: string | null;
  category: string | null;
  metric: string;
  minThreshold: number;
  maxThreshold: number;
  condition: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

// Función para convertir de Prisma a nuestra interfaz
function convertPrismaThreshold(
  prismaThreshold: PrismaAlertThreshold
): AlertThresholdsInterface {
  return {
    sku: prismaThreshold.sku ?? undefined,
    category: prismaThreshold.category ?? undefined,
    metric: prismaThreshold.metric,
    minThreshold: prismaThreshold.minThreshold,
    maxThreshold: prismaThreshold.maxThreshold,
    condition: prismaThreshold.condition,
  };
}

// Función para procesar un solo forecast contra un threshold (ACTUALIZADA)
function processAlert(
  forecast: ForecastData,
  prismaThreshold: PrismaAlertThreshold,
  seenMessages: Set<string>
): AlertResult | null {
  // Convertir threshold de Prisma a nuestra interfaz
  const threshold = convertPrismaThreshold(prismaThreshold);

  // Clave única más específica que incluye el ID del threshold
  const alertKey = `${prismaThreshold.id}-${threshold.metric}-${
    threshold.condition
  }-${forecast.sku}-${forecast.forecastDate.toISOString()}`;

  switch (threshold.metric) {
    case "precision":
      return checkPrecisionAlert(forecast, threshold, alertKey, seenMessages);
    case "sales":
      return checkSalesAlert(forecast, threshold, alertKey, seenMessages);
    default:
      return null;
  }
}

// Función para enviar notificaciones
async function sendNotifications(
  userId: string,
  alerts: AlertResult[]
): Promise<void> {
  if (alerts.length === 0) return;

  const config = await prisma.configuration.findUnique({
    where: { userId },
    select: { notificationSettings: true },
  });

  if (!config?.notificationSettings) return;

  const settings = parseNotificationSettings(config.notificationSettings);
  if (!settings) {
    console.warn("Invalid notification settings format");
    return;
  }

  const messages = alerts.map((alert) => alert.message);

  if (settings.email) {
    console.log("Sending email notifications:", messages);
  }

  if (settings.sms) {
    console.log("Sending SMS notifications:", messages);
  }
}

// Verificar alertas para nuevos pronósticos (función principal ACTUALIZADA)
export async function checkAlerts(userId: string, forecasts: ForecastData[]) {
  const alerts: AlertResult[] = [];
  const seenMessages = new Set<string>();

  for (const forecast of forecasts) {
    const thresholds = await prisma.alertThreshold.findMany({
      where: {
        userId,
        OR: [{ sku: forecast.sku }, { sku: null }],
      },
    });

    for (const threshold of thresholds) {
      const alertKey = `${threshold.id}-${threshold.metric}-${
        threshold.condition
      }-${forecast.sku}-${forecast.forecastDate.toISOString()}`;
      const alert = processAlert(forecast, threshold, seenMessages);
      if (alert) {
        alerts.push(alert);
      }
    }
  }

  await prisma.alert.createMany({
    data: alerts.map((alert) => ({
      userId,
      sku: alert.message.match(/SKU (\w+)/)?.[1] || "UNKNOWN",
      message: alert.message,
      forecastDate: new Date(alert.forecastDate),
    })),
    skipDuplicates: true,
  });

  await sendNotifications(userId, alerts);
  return alerts;
}

// ✅ NUEVA FUNCIÓN: Crear alerta directa (por error u otra causa)
export async function createAlert(
  userId: string,
  message: string
): Promise<void> {
  await prisma.alert.create({
    data: {
      userId,
      sku: "GENERAL",
      message,
      forecastDate: new Date(), // Puedes omitir si tu modelo lo permite
    },
  });
}
