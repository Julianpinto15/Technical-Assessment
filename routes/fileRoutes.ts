import { Router } from "express";
import { uploadFile } from "../src/controllers/fileController";
import { authenticate } from "../src/middlewares/authMiddleware";

const router = Router();

router.post("/upload", authenticate, uploadFile);

export default router;
