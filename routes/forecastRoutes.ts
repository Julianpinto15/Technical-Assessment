import { Router } from "express";
import { postForecast } from "../src/controllers/forecastController";
import { authenticate } from "../src/middlewares/authMiddleware";

const router = Router();

router.post("/generate", authenticate, postForecast);

export default router;
