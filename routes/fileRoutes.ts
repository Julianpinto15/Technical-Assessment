import { Router } from "express";
import {
  uploadFile,
  previewFile,
  mapColumns,
  confirmUpload,
} from "../src/controllers/fileController";
import { authenticate } from "../src/middlewares/authMiddleware";
import prisma from "../src/prismaClient";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const router = Router();

router.post("/upload", authenticate, uploadFile);
router.post("/upload/preview", authenticate, previewFile);
router.post("/upload/map", authenticate, mapColumns);
router.post("/upload/confirm", authenticate, confirmUpload);
router.get("/alerts", authenticate, async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: authReq.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    res.json(alerts);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({ message: `Error al obtener alertas: ${message}` });
  }
});

export default router;
