import { parseISO } from "date-fns";
import prisma from "../prismaClient";
import {
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  subMonths,
  isValid,
  addMonths,
} from "date-fns";

export const getDashboardSummary = async (
  userId: string,
  startDateParam?: string,
  endDateParam?: string
) => {
  const now = new Date();

  // ✅ Si se pasan fechas, las usa
  let startDate = startDateParam ? parseISO(startDateParam) : startOfMonth(now);
  let endDate = endDateParam ? parseISO(endDateParam) : endOfMonth(now);

  // ✅ Validar que las fechas sean válidas
  if (!isValid(startDate)) startDate = startOfMonth(now);
  if (!isValid(endDate)) endDate = endOfMonth(now);

  // ✅ Rango para el mes anterior (para comparar)
  const startOfLastMonth = subMonths(startDate, 1);
  const endOfLastMonth = subMonths(endDate, 1);

  // Datos del rango actual
  const currentData = await prisma.salesData.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      quantity: true,
      price: true,
    },
  });

  // Datos del rango anterior
  const lastData = await prisma.salesData.findMany({
    where: {
      userId,
      date: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
    select: {
      quantity: true,
      price: true,
    },
  });

  const currentSales = currentData.reduce((acc, row) => acc + row.quantity, 0);
  const currentRevenue = currentData.reduce(
    (acc, row) => acc + row.quantity * row.price,
    0
  );

  const lastSales = lastData.reduce((acc, row) => acc + row.quantity, 0);
  const lastRevenue = lastData.reduce(
    (acc, row) => acc + row.quantity * row.price,
    0
  );

  const salesChange =
    lastSales > 0 ? ((currentSales - lastSales) / lastSales) * 100 : 0;
  const revenueChange =
    lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  // Contar productos únicos y categorías
  const uniqueProducts = await prisma.salesData.groupBy({
    by: ["sku"],
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const uniqueCategories = await prisma.salesData.groupBy({
    by: ["category"],
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return {
    totalSales: currentSales,
    totalRevenue: Math.round(currentRevenue),
    totalProducts: uniqueProducts.length,
    totalCategories: uniqueCategories.length,
    salesChange: Math.round(salesChange * 100) / 100,
    revenueChange: Math.round(revenueChange * 100) / 100,
  };
};

// ✅ Datos de tendencias por los últimos 12 meses
export const getTrendsData = async (
  userId: string,
  startDateParam?: string,
  endDateParam?: string
) => {
  const now = new Date();

  const startDate =
    startDateParam && isValid(parseISO(startDateParam))
      ? parseISO(startDateParam)
      : addMonths(now, -11); // hace 11 meses

  const endDate =
    endDateParam && isValid(parseISO(endDateParam))
      ? parseISO(endDateParam)
      : now;

  // Generar meses intermedios
  const months = eachMonthOfInterval({ start: startDate, end: endDate }).map(
    (date) => {
      return {
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        label: format(date, "MMM", { locale: undefined }),
      };
    }
  );

  const salesData = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const rows = await prisma.salesData.findMany({
        where: {
          userId,
          date: {
            gte: start,
            lte: end,
          },
        },
        select: {
          quantity: true,
          price: true,
        },
      });

      const totalSales = rows.reduce((acc, r) => acc + r.quantity, 0);
      const totalRevenue = rows.reduce(
        (acc, r) => acc + r.quantity * r.price,
        0
      );

      return {
        month: label,
        totalSales,
        totalRevenue: Math.round(totalRevenue),
      };
    })
  );

  return {
    labels: salesData.map((m) => m.month),
    sales: salesData.map((m) => m.totalSales),
    revenue: salesData.map((m) => m.totalRevenue),
  };
};

// ✅ Notificaciones del usuario específico
export const getNotifications = async (userId: string) => {
  try {
    // Obtener alertas reales del usuario
    const alerts = await prisma.alert.findMany({
      where: {
        userId: userId, // ✅ Filtrar por usuario
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Últimas 10 alertas
      select: {
        id: true,
        message: true,
        sku: true,
        forecastDate: true,
        createdAt: true,
      },
    });

    // Formatear para el frontend
    const notifications = alerts.map((alert) => ({
      id: alert.id,
      message: `${alert.message} - SKU: ${alert.sku}`,
      timestamp: alert.createdAt.toISOString(),
      type: "alert",
    }));

    // Si no hay alertas, agregar una notificación de bienvenida
    if (notifications.length === 0) {
      notifications.push({
        id: "welcome",
        message: "Bienvenido a tu dashboard. No tienes alertas pendientes.",
        timestamp: new Date().toISOString(),
        type: "info",
      });
    }

    return notifications;
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    return [];
  }
};

export const getDashboardStats = async (userId: string) => {
  // Total usuarios
  const userCount = await prisma.user.count();

  // Total pronósticos del usuario
  const forecastCount = await prisma.forecast.count({
    where: { userId },
  });

  // Total alertas del usuario
  const alertCount = await prisma.alert.count({
    where: { userId },
  });

  // Precisión promedio del usuario
  const precisions = await prisma.forecast.findMany({
    where: { userId },
    select: { confidenceLevel: true },
  });

  const avgPrecision =
    precisions.length > 0
      ? precisions.reduce((acc, f) => acc + f.confidenceLevel, 0) /
        precisions.length
      : 0;

  return {
    userCount,
    forecastCount,
    alertCount,
    avgPrecision: parseFloat(avgPrecision.toFixed(2)),
  };
};
