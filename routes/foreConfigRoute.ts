import { Router } from "express";
import { setForecastConfig } from "../src/controllers/foreConfigController";
import { authenticate } from "../src/middlewares/authMiddleware";

const router = Router();

router.post("/config", authenticate, setForecastConfig);

export default router;
