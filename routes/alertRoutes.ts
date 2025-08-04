import { Router } from "express";
import {
  createAlertThreshold,
  getAlertThresholds,
  getRecentAlerts,
} from "../src/controllers/alertController";
import { authenticate } from "../src/middlewares/authMiddleware";

const router = Router();

router.post("/", authenticate, createAlertThreshold);
router.get("/", authenticate, getAlertThresholds);
router.get("/recent", authenticate, getRecentAlerts);

export default router;
