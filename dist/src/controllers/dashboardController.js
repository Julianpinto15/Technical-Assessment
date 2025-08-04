"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardNotifications = exports.getDashboardTrends = exports.getDashboardMetrics = void 0;
const dashboardService_1 = require("../services/dashboardService");
// ✅ Métricas generales del dashboard (resumen)
const getDashboardMetrics = async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const userId = req.user.userId;
        const data = await (0, dashboardService_1.getDashboardSummary)(userId); // ✅ Nuevo servicio para métricas generales
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
        const data = await (0, dashboardService_1.getTrendsData)(userId); // ✅ Con userId
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
        if (!req.user?.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const userId = req.user.userId;
        const notifications = await (0, dashboardService_1.getNotifications)(userId); // ✅ Con userId
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getDashboardNotifications = getDashboardNotifications;
//# sourceMappingURL=dashboardController.js.map