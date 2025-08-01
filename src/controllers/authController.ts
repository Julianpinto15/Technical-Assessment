import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../services/authService";

export const register = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await registerUser(req.body);
      res.status(201).json({
        message: "User registered successfully",
        user: { id: user.id, email: user.email },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
];

export const login = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { accessToken, refreshToken } = await loginUser(req.body);
      res.json({ accessToken, refreshToken });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  },
];

export const logout = async (req: Request, res: Response) => {
  try {
    await logoutUser(req.user!.userId); // Asumimos que el middleware auth agrega req.user
    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token is required" });

  try {
    const accessToken = await refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};
