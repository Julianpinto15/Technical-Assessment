"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alertController_1 = require("../src/controllers/alertController");
const authMiddleware_1 = require("../src/middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.authenticate, alertController_1.createAlertThreshold);
router.get("/", authMiddleware_1.authenticate, alertController_1.getAlertThresholds);
exports.default = router;
//# sourceMappingURL=alertRoutes.js.map