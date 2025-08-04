import { Request, Response } from "express";
import {
  getNotifications,
  getTrendsData,
  getDashboardSummary,
} from "../services/dashboardService";
import { getDashboardStats } from "../services/dashboardService";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const getDashboardMetrics = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.user.userId;
    const data = await getDashboardStats(userId); // ← esta es la nueva función
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Datos de tendencias (gráficos de línea)
export const getDashboardTrends = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.user.userId;
    const data = await getTrendsData(userId); // ✅ Con userId
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Notificaciones por usuario
export const getDashboardNotifications = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.user.userId;
    const notifications = await getNotifications(userId); // ✅ Con userId
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
