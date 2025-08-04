// fileController.ts
import { Response } from "express";
import { Request } from "express";
import multer from "multer";
import {
  processFileUpload,
  previewFileUpload,
  mapFileColumns,
  confirmFileUpload,
} from "../services/fileService";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Configuración de multer mejorada
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldSize: 1024 * 1024, // 1MB para campos de texto
  },
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/csv",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Formato de archivo no válido: ${file.mimetype}. Solo se permiten CSV, XLSX, XLS`
        )
      );
    }
  },
});

// Middleware para manejar errores de multer
const handleMulterError = (
  error: any,
  req: Request,
  res: Response,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "El archivo es demasiado grande. Máximo 10MB permitido.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: 'Campo de archivo inesperado. Use el campo "file".',
      });
    }
  }

  if (error.message.includes("Formato de archivo no válido")) {
    return res.status(400).json({ message: error.message });
  }

  next(error);
};

export const uploadFile = [
  upload.single("file"),
  handleMulterError,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("=== Upload File Debug ===");
    console.log("User:", req.user);
    console.log(
      "File:",
      req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : "No file"
    );
    console.log("Body:", req.body);

    // Validaciones previas
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message:
          "No se ha subido ningún archivo. Asegúrate de usar el campo 'file'.",
      });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        message: "El archivo está vacío",
      });
    }

    try {
      const result = await processFileUpload({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        userId: req.user.userId,
        onProgress: (progress) => {
          console.log(`Progreso: ${progress}%`);
        },
      });

      res.json({
        message: "Archivo cargado y procesado exitosamente",
        data: result,
      });
    } catch (error: any) {
      console.error("Error en uploadFile:", error);

      // Manejo específico de errores
      const statusCode = error.code === "VALIDATION_ERROR" ? 422 : 400;
      res.status(statusCode).json({
        message: error.message || "Error procesando el archivo",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  },
];

export const previewFile = [
  upload.single("file"),
  handleMulterError,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("=== Preview File Debug ===");
    console.log("User:", req.user);
    console.log(
      "File:",
      req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : "No file"
    );

    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No se ha subido ningún archivo para vista previa",
      });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        message: "El archivo está vacío",
      });
    }

    try {
      const result = await previewFileUpload({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        userId: req.user.userId,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error en previewFile:", error);
      res.status(400).json({
        message: error.message || "Error generando vista previa",
        code: error.code || "PREVIEW_ERROR",
      });
    }
  },
];

export const mapColumns = async (req: AuthenticatedRequest, res: Response) => {
  console.log("=== Map Columns Debug ===");
  console.log("User:", req.user);
  console.log("Body:", req.body);

  if (!req.user?.userId) {
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  try {
    const { fileName, mapping } = req.body;

    // Validaciones
    if (!fileName || typeof fileName !== "string") {
      return res.status(400).json({
        message: "fileName es requerido y debe ser una cadena",
      });
    }

    if (!mapping || typeof mapping !== "object") {
      return res.status(400).json({
        message: "mapping es requerido y debe ser un objeto",
      });
    }

    const result = await mapFileColumns({
      fileName,
      mapping,
      userId: req.user.userId,
    });

    res.json(result);
  } catch (error: any) {
    console.error("Error en mapColumns:", error);
    res.status(400).json({
      message: error.message || "Error mapeando columnas",
      code: error.code || "MAPPING_ERROR",
    });
  }
};

export const confirmUpload = [
  upload.single("file"),
  handleMulterError,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const file = req.file;
      let mapping = req.body.mapping;
      const fileName = req.body.fileName;

      if (!file) {
        return res.status(400).json({ message: "Archivo es requerido" });
      }

      if (!fileName || typeof fileName !== "string") {
        return res
          .status(400)
          .json({ message: "fileName es requerido y debe ser una cadena" });
      }

      if (!mapping) {
        return res.status(400).json({
          message: "mapping es requerido",
        });
      }

      // Parsear mapping si viene como string
      if (typeof mapping === "string") {
        try {
          mapping = JSON.parse(mapping);
        } catch (err) {
          return res.status(400).json({
            message: "Error al parsear el mapeo de columnas",
          });
        }
      }

      // Ejecutar lógica de servicio
      const result = await confirmFileUpload({
        fileName,
        userId: req.user.userId,
        buffer: file.buffer,
        mimetype: file.mimetype,
        mapping,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error en confirmUpload:", error);
      return res.status(400).json({
        message: error.message || "Error confirmando carga",
        code: error.code || "CONFIRMATION_ERROR",
      });
    }
  },
];
