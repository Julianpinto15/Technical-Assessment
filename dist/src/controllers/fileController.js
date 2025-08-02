"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const multer_1 = __importDefault(require("multer"));
const fileService_1 = require("../services/fileService");
// Configurar Multer para manejar archivos hasta 10MB
const upload = (0, multer_1.default)({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    storage: multer_1.default.memoryStorage(),
});
// ✅ Middleware de subida + controlador
exports.uploadFile = [
    upload.single("file"),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        console.log("req.user asignado:", req.user);
        try {
            await (0, fileService_1.processFileUpload)({
                buffer: req.file.buffer,
                mimetype: req.file.mimetype,
                originalname: req.file.originalname,
                userId: req.user.userId, // ya no da error porque usamos AuthenticatedRequest
            });
            res.json({ message: "File uploaded and processed successfully" });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
];
//# sourceMappingURL=fileController.js.map