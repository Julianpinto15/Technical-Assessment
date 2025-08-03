import { Router } from "express";
import {
  createAlertThreshold,
  getAlertThresholds,
} from "../src/controllers/alertController";
import { authenticate } from "../src/middlewares/authMiddleware";

const router = Router();

router.post("/", authenticate, createAlertThreshold);
router.get("/", authenticate, getAlertThresholds);

export default router;
