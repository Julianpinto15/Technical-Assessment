import { Request, Response } from "express";
import { upsertForecastConfig } from "../services/foreConfigService";
import { AlertThresholdsInterface } from "../interface/AlertThresholdsInterface";
import { NotificationsInterface } from "../interface/NotificationsInterface";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export async function setForecastConfig(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { userId } = req.user;
  const {
    forecastHorizon,
    confidenceLevels,
    alertThresholds,
    notificationSettings,
  } = req.body;

  // Validar forecastHorizon
  if (
    !Array.isArray(forecastHorizon) ||
    forecastHorizon.some((h: number) => !Number.isInteger(h) || h < 1 || h > 6)
  ) {
    return res.status(400).json({
      error: "Horizontes de pronóstico deben ser enteros entre 1 y 6",
    });
  }

  // Validar y convertir confidenceLevels
  if (
    !Array.isArray(confidenceLevels) ||
    confidenceLevels.some(
      (c: number) => typeof c !== "number" || c < 0 || c > 100
    )
  ) {
    return res
      .status(400)
      .json({ error: "Niveles de confianza deben ser números entre 0 y 100" });
  }
  const normalizedConfidenceLevels = confidenceLevels.map(
    (c: number) => c / 100
  );

  // Validar alertThresholds
  if (
    alertThresholds &&
    (typeof alertThresholds.minThreshold !== "number" ||
      typeof alertThresholds.maxThreshold !== "number" ||
      alertThresholds.minThreshold >= alertThresholds.maxThreshold)
  ) {
    return res.status(400).json({
      error: "alertThresholds debe tener minThreshold < maxThreshold",
    });
  }

  // Validar notificationSettings
  if (
    !notificationSettings ||
    typeof notificationSettings.email !== "boolean" ||
    typeof notificationSettings.sms !== "boolean"
  ) {
    return res.status(400).json({
      error:
        "notificationSettings debe tener propiedades email y sms de tipo boolean",
    });
  }

  try {
    const config = await upsertForecastConfig(
      userId,
      forecastHorizon,
      normalizedConfidenceLevels,
      alertThresholds as AlertThresholdsInterface,
      notificationSettings as NotificationsInterface
    );
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
