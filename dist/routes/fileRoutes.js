"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileController_1 = require("../src/controllers/fileController");
const authMiddleware_1 = require("../src/middlewares/authMiddleware");
const prismaClient_1 = __importDefault(require("../src/prismaClient"));
const router = (0, express_1.Router)();
router.post("/upload", authMiddleware_1.authenticate, fileController_1.uploadFile);
router.post("/upload/preview", authMiddleware_1.authenticate, fileController_1.previewFile);
router.post("/upload/map", authMiddleware_1.authenticate, fileController_1.mapColumns);
router.post("/upload/confirm", authMiddleware_1.authenticate, fileController_1.confirmUpload);
router.get("/alerts", authMiddleware_1.authenticate, async (req, res) => {
    const authReq = req;
    try {
        const alerts = await prismaClient_1.default.alert.findMany({
            where: { userId: authReq.user.userId },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        res.json(alerts);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ message: `Error al obtener alertas: ${message}` });
    }
});
exports.default = router;
//# sourceMappingURL=fileRoutes.js.map