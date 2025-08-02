import { Request, Response } from "express";
import prisma from "../prismaClient";
import { authenticate } from "../middlewares/authMiddleware";

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

  // Validar datos de entrada Validar forecastHorizon
  if (
    !Array.isArray(forecastHorizon) ||
    forecastHorizon.some((h: number) => !Number.isInteger(h) || h < 1 || h > 6)
  ) {
    return res
      .status(400)
      .json({
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

  // Validar alertThresholds y notificationSettings (simplificado)
  if (
    !alertThresholds ||
    typeof alertThresholds !== "object" ||
    !notificationSettings ||
    typeof notificationSettings !== "object"
  ) {
    return res.status(400).json({
      error: "alertThresholds y notificationSettings deben ser objetos",
    });
  }

  try {
    const config = await prisma.configuration.create({
      data: {
        userId: req.user.userId,
        forecastHorizon,
        confidenceLevel: normalizedConfidenceLevels, // Guardar en formato decimal
        alertThresholds,
        notificationSettings,
      },
    });
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
