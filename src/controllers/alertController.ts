import { Request, Response } from "express";
import * as alertService from "../services/alertService";
import prisma from "../prismaClient"; // Adjust the path if your Prisma client is elsewhere

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

export async function getRecentAlerts(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
