import express, { Express, Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors"; // ✅ Descomentado
import { setupSwagger } from "./src/docs/swagger";
import authRoutes from "./routes/authRoutes";
import alertRoutes from "./routes/alertRoutes";
import fileRoutes from "./routes/fileRoutes";
import forecastRoutes from "./routes/forecastRoutes";
import forecastConfigRoutes from "./routes/foreConfigRoute";
import dashboardRoutes from "./routes/dashboardRoutes";

import indexRouter from "./routes/index";
import usersRouter from "./routes/users";

const app = express();

app.use(logger("dev"));

// ✅ Configuración CORS para desarrollo
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:3000", // Si tienes frontend en 3000
      "http://127.0.0.1:5173", // Alternativa de localhost
    ],
    credentials: true, // Permitir cookies y headers de autorización
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
    ],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/forecast", forecastConfigRoutes);
app.use("/api", dashboardRoutes);

setupSwagger(app);

// Manejador de errores global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

export default app;
