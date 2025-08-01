import dotenv from "dotenv";

dotenv.config();

// Función para validar que las variables de entorno existan
const getRequiredEnvVar = (varName: string): string => {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
  return value;
};

console.log("ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET);
console.log("REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET);

export const jwtConfig = {
  accessSecret: getRequiredEnvVar("JWT_ACCESS_SECRET"),
  refreshSecret: getRequiredEnvVar("JWT_REFRESH_SECRET"),
  accessExpiresIn: "15m" as const, // Access token válido por 15 minutos
  refreshExpiresIn: "7d" as const, // Refresh token válido por 7 días
} as const;
