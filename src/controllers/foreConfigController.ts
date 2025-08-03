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

interface ForecastConfigRequestBody {
  forecastHorizon: number[];
  confidenceLevels: number[]; // Del frontend
  alertThresholds?: AlertThresholdsInterface;
  notificationSettings: NotificationsInterface;
}

export async function setForecastConfig(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    // Verificar autenticación
    if (!req.user) {
      return res.status(401).json({
        error: "User not authenticated",
        code: "UNAUTHORIZED",
      });
    }

    const { userId } = req.user;
    const {
      forecastHorizon,
      confidenceLevels,
      alertThresholds,
      notificationSettings,
    }: ForecastConfigRequestBody = req.body;

    // Validaciones básicas del controlador (UI/UX related)
    if (!Array.isArray(forecastHorizon) || forecastHorizon.length === 0) {
      return res.status(400).json({
        error: "forecastHorizon is required and must be a non-empty array",
        code: "INVALID_FORECAST_HORIZON",
      });
    }

    if (!Array.isArray(confidenceLevels) || confidenceLevels.length === 0) {
      return res.status(400).json({
        error: "confidenceLevels is required and must be a non-empty array",
        code: "INVALID_CONFIDENCE_LEVELS",
      });
    }

    if (!notificationSettings || typeof notificationSettings !== "object") {
      return res.status(400).json({
        error: "notificationSettings is required",
        code: "INVALID_NOTIFICATION_SETTINGS",
      });
    }

    // Normalizar confidenceLevels (del frontend vienen como porcentajes 0-100)
    const normalizedConfidenceLevels = confidenceLevels.map((level: number) => {
      // Si viene como porcentaje (>1), convertir a decimal
      return level > 1 ? level / 100 : level;
    });

    // Preparar datos para el servicio
    const configData = {
      userId,
      forecastHorizon,
      confidenceLevel: normalizedConfidenceLevels, // Nota: cambié el nombre aquí
      alertThresholds,
      notificationSettings,
    };

    // Llamar al servicio (aquí se hacen las validaciones de negocio)
    const result = await upsertForecastConfig(configData);

    return res.status(200).json({
      success: true,
      message: "Forecast configuration updated successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error in setForecastConfig:", error);

    // Manejar errores específicos del servicio
    if (error.name === "ForecastConfigError") {
      const statusCode =
        error.code === "VALIDATION_ERROR"
          ? 400
          : error.code === "USER_NOT_FOUND"
          ? 404
          : 500;

      return res.status(statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    // Error genérico
    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}
