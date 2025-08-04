"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../src/middlewares/authMiddleware");
const dashboardController_1 = require("../src/controllers/dashboardController");
const router = (0, express_1.Router)();
router.get("/dashboard", authMiddleware_1.authenticate, dashboardController_1.getDashboardMetrics);
router.get("/dashboard/trends", authMiddleware_1.authenticate, dashboardController_1.getDashboardTrends);
router.get("/dashboard/notifications", authMiddleware_1.authenticate, dashboardController_1.getDashboardNotifications);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map