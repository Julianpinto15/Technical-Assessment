import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/tokenService";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // Agregar payload al request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
