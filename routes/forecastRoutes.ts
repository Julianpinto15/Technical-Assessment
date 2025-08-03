import { Router } from "express";
import {
  getForecastHistoryController,
  getForecastMetricsController,
  postForecast,
} from "../src/controllers/forecastController";
import { authenticate } from "../src/middlewares/authMiddleware";

const router = Router();

router.post("/simulate", authenticate, postForecast);
router.get("/history", authenticate, getForecastHistoryController);
router.get("/metrics", authenticate, getForecastMetricsController);

export default router;
