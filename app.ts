import express, { Express, Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
// import cors from "cors";
import { setupSwagger } from "./src/docs/swagger";
import authRoutes from "./routes/authRoutes";
import alertRoutes from "./routes/alertRoutes";
import fileRoutes from "./routes/fileRoutes";
import forecastRoutes from "./routes/forecastRoutes";
import forecastConfigRoutes from "./routes/foreConfigRoute";

import indexRouter from "./routes/index";
import usersRouter from "./routes/users";

const app = express();

app.use(logger("dev"));
// app.use(cors());
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
setupSwagger(app);

// Manejador de errores global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

export default app;
