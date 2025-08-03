import { Request, Response } from "express";
import {
  generateForecasts,
  getForecastHistory,
  getForecastMetrics,
} from "../services/forecastService";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const postForecast = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sku, forecast_period } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const userId = req.user.userId;
    const results = await generateForecasts(userId, sku, forecast_period);
    res.status(201).json({ message: "Forecasts generated", data: results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getForecastHistoryController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Verificar que el usuario existe
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.user.userId;

    // Extraer filtros de los query parameters
    const filters = {
      sku: req.query.sku as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      category: req.query.category as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset
        ? parseInt(req.query.offset as string)
        : undefined,
    };

    const history = await getForecastHistory(userId, filters);

    res.status(200).json({
      message: "Forecast history retrieved",
      data: history,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getForecastMetricsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Verificar que el usuario existe
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.user.userId;
    const sku = req.query.sku as string;

    const metrics = await getForecastMetrics(userId, sku);

    res.status(200).json({
      message: "Forecast metrics retrieved",
      data: metrics,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
