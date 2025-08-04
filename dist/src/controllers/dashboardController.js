"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardNotifications = exports.getDashboardTrends = exports.getDashboardMetrics = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const dashboardService_1 = require("../services/dashboardService");
const dashboardService_2 = require("../services/dashboardService");
const getDashboardMetrics = async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const userId = req.user.userId;
        const data = await (0, dashboardService_2.getDashboardStats)(userId); // ← esta es la nueva función
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
// ✅ Datos de tendencias (gráficos de línea)
const getDashboardTrends = async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;
        const data = await (0, dashboardService_1.getTrendsData)(userId, startDate, endDate);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getDashboardTrends = getDashboardTrends;
// ✅ Notificaciones por usuario
const getDashboardNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // Obtener las últimas 10 alertas para el usuario, ordenadas por createdAt
        const alerts = await prismaClient_1.default.alert.findMany({
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
        const notifications = alerts.length > 0
            ? alerts.map((alert) => ({
                id: alert.id,
                message: alert.message,
                sku: alert.sku,
                timestamp: alert.createdAt.toISOString(),
            }))
            : [
                {
                    id: "welcome",
                    message: "Bienvenido a tu dashboard. No tienes alertas pendientes.",
                    timestamp: new Date().toISOString(),
                    type: "info",
                },
            ];
        res.json(notifications);
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getDashboardNotifications = getDashboardNotifications;
//# sourceMappingURL=dashboardController.js.map