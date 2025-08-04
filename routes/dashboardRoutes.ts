import { Router } from "express";
import { authenticate } from "../src/middlewares/authMiddleware";
import {
  getDashboardMetrics,
  getDashboardNotifications,
  getDashboardTrends,
} from "../src/controllers/dashboardController";

const router = Router();

router.get("/dashboard", authenticate, getDashboardMetrics);
router.get("/dashboard/trends", authenticate, getDashboardTrends);
router.get("/dashboard/notifications", authenticate, getDashboardNotifications);

export default router;
