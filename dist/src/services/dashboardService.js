"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = exports.getTrendsData = exports.getDashboardSummary = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const date_fns_1 = require("date-fns");
// ✅ Métricas generales del dashboard
const getDashboardSummary = async (userId) => {
    const now = new Date();
    const startOfCurrentMonth = (0, date_fns_1.startOfMonth)(now);
    const endOfCurrentMonth = (0, date_fns_1.endOfMonth)(now);
    const startOfLastMonth = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
    const endOfLastMonth = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
    // Métricas del mes actual
    const currentMonthData = await prismaClient_1.default.salesData.findMany({
        where: {
            userId: userId, // ✅ Filtrar por usuario
            date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
        select: {
            quantity: true,
            price: true,
        },
    });
    // Métricas del mes anterior
    const lastMonthData = await prismaClient_1.default.salesData.findMany({
        where: {
            userId: userId, // ✅ Filtrar por usuario
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
    // Calcular totales
    const currentSales = currentMonthData.reduce((acc, row) => acc + row.quantity, 0);
    const currentRevenue = currentMonthData.reduce((acc, row) => acc + row.quantity * row.price, 0);
    const lastSales = lastMonthData.reduce((acc, row) => acc + row.quantity, 0);
    const lastRevenue = lastMonthData.reduce((acc, row) => acc + row.quantity * row.price, 0);
    // Calcular porcentajes de cambio
    const salesChange = lastSales > 0 ? ((currentSales - lastSales) / lastSales) * 100 : 0;
    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    // Contar productos únicos y categorías
    const uniqueProducts = await prismaClient_1.default.salesData.groupBy({
        by: ["sku"],
        where: {
            userId: userId, // ✅ Filtrar por usuario
            date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
    });
    const uniqueCategories = await prismaClient_1.default.salesData.groupBy({
        by: ["category"],
        where: {
            userId: userId, // ✅ Filtrar por usuario
            date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
    });
    return {
        totalSales: currentSales,
        totalRevenue: Math.round(currentRevenue),
        totalProducts: uniqueProducts.length,
        totalCategories: uniqueCategories.length,
        salesChange: Math.round(salesChange * 100) / 100, // 2 decimales
        revenueChange: Math.round(revenueChange * 100) / 100,
    };
};
exports.getDashboardSummary = getDashboardSummary;
// ✅ Datos de tendencias por los últimos 12 meses
const getTrendsData = async (userId) => {
    const now = new Date();
    const months = [];
    // Construir rango de los últimos 12 meses
    for (let i = 11; i >= 0; i--) {
        const date = (0, date_fns_1.subMonths)(now, i);
        const start = (0, date_fns_1.startOfMonth)(date);
        const end = (0, date_fns_1.endOfMonth)(date);
        const label = start.toLocaleString("es-CO", { month: "short" });
        months.push({ start, end, label });
    }
    // Obtener datos por cada mes
    const salesData = await Promise.all(months.map(async ({ start, end, label }) => {
        // ✅ Filtrar por usuario
        const rows = await prismaClient_1.default.salesData.findMany({
            where: {
                userId: userId, // ✅ Filtrar por usuario específico
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
        // Sumar ventas e ingresos manualmente
        const totalSales = rows.reduce((acc, row) => acc + row.quantity, 0);
        const totalRevenue = rows.reduce((acc, row) => acc + row.quantity * row.price, 0);
        return {
            month: label,
            totalSales,
            totalRevenue: Math.round(totalRevenue),
        };
    }));
    return {
        labels: salesData.map((m) => m.month),
        sales: salesData.map((m) => m.totalSales),
        revenue: salesData.map((m) => m.totalRevenue),
    };
};
exports.getTrendsData = getTrendsData;
// ✅ Notificaciones del usuario específico
const getNotifications = async (userId) => {
    try {
        // Obtener alertas reales del usuario
        const alerts = await prismaClient_1.default.alert.findMany({
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
    }
    catch (error) {
        console.error("Error obteniendo notificaciones:", error);
        return [];
    }
};
exports.getNotifications = getNotifications;
//# sourceMappingURL=dashboardService.js.map