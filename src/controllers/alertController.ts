import { Request, Response } from "express";
import * as alertService from "../services/alertService";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export async function createAlertThreshold(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.userId; // Asumiendo que authMiddleware agrega user al request
    // Verificar que el usuario existe
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!userId) throw new Error("User not authenticated");

    const alert = await alertService.createAlertThreshold(userId, req.body);
    res.status(201).json(alert);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getAlertThresholds(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const thresholds = await alertService.getAlertThresholds(userId);
    res.json(thresholds);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
