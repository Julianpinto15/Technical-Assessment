"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Función para validar que las variables de entorno existan
const getRequiredEnvVar = (varName) => {
    const value = process.env[varName];
    if (!value) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
    return value;
};
console.log("ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET);
console.log("REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET);
exports.jwtConfig = {
    accessSecret: getRequiredEnvVar("JWT_ACCESS_SECRET"),
    refreshSecret: getRequiredEnvVar("JWT_REFRESH_SECRET"),
    accessExpiresIn: "15m", // Access token válido por 15 minutos
    refreshExpiresIn: "7d", // Refresh token válido por 7 días
};
//# sourceMappingURL=jwt.js.map