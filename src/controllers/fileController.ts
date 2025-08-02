import { Response } from "express";
import { Request } from "express";
import multer from "multer";
import { processFileUpload } from "../services/fileService";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Configurar Multer para manejar archivos hasta 10MB
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  storage: multer.memoryStorage(),
});

// ✅ Middleware de subida + controlador
export const uploadFile = [
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("req.user asignado:", req.user);

    try {
      await processFileUpload({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        userId: req.user!.userId, // ya no da error porque usamos AuthenticatedRequest
      });
      res.json({ message: "File uploaded and processed successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
];
