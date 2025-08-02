"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forecastController_1 = require("../src/controllers/forecastController");
const authMiddleware_1 = require("../src/middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post("/generate", authMiddleware_1.authenticate, forecastController_1.postForecast);
exports.default = router;
//# sourceMappingURL=forecastRoutes.js.map