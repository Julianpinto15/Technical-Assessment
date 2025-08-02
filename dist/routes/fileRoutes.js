"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileController_1 = require("../src/controllers/fileController");
const authMiddleware_1 = require("../src/middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post("/upload", authMiddleware_1.authenticate, fileController_1.uploadFile);
exports.default = router;
//# sourceMappingURL=fileRoutes.js.map