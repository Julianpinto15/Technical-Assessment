import { Request, Response } from "express";
import prisma from "../prismaClient";
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
    const { startDate, endDate } = req.query;

    const data = await getTrendsData(
      userId,
      startDate as string,
      endDate as string
    );
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
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Obtener las últimas 10 alertas para el usuario, ordenadas por createdAt
    const alerts = await prisma.alert.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        message: true,
        sku: true,
        createdAt: true,
      },
    });

    // Mapear las alertas al formato esperado
    const notifications =
      alerts.length > 0
        ? alerts.map((alert) => ({
            id: alert.id,
            message: alert.message,
            sku: alert.sku,
            timestamp: alert.createdAt.toISOString(),
          }))
        : [
            {
              id: "welcome",
              message:
                "Bienvenido a tu dashboard. No tienes alertas pendientes.",
              timestamp: new Date().toISOString(),
              type: "info",
            },
          ];

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
