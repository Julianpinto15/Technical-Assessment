import { Request, Response } from "express";
import { generateForecasts } from "../services/forecastService";

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
    const { sku } = req.body;

    // Verificar que el usuario existe
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Usar userId en lugar de id
    const userId = req.user.userId;

    const results = await generateForecasts(userId, sku);
    res.status(201).json({ message: "Forecasts generated", data: results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
