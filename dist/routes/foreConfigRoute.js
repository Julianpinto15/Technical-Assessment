"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const foreConfigController_1 = require("../src/controllers/foreConfigController");
const authMiddleware_1 = require("../src/middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post("/config", authMiddleware_1.authenticate, foreConfigController_1.setForecastConfig);
exports.default = router;
//# sourceMappingURL=foreConfigRoute.js.map