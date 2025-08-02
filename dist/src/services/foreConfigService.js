"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertForecastConfig = upsertForecastConfig;
const prismaClient_1 = __importDefault(require("../prismaClient"));
async function upsertForecastConfig(userId, forecastHorizon, confidenceLevel, alertThresholds = {
    minThreshold: 0.1,
    maxThreshold: 0.9,
}, notificationSettings = { email: false, sms: false }) {
    // Validar que el usuario exista
    const userExists = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
    if (!userExists) {
        throw new Error("User not found");
    }
    return prismaClient_1.default.configuration.upsert({
        where: { userId },
        create: {
            userId,
            forecastHorizon,
            confidenceLevel,
            alertThresholds: JSON.stringify(alertThresholds),
            notificationSettings: JSON.stringify(notificationSettings),
        },
        update: {
            forecastHorizon,
            confidenceLevel,
            alertThresholds: JSON.stringify(alertThresholds),
            notificationSettings: JSON.stringify(notificationSettings),
        },
    });
}
//# sourceMappingURL=foreConfigService.js.map