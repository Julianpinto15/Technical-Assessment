import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh,
} from "../src/controllers/authController";
import { authenticate } from "../src/middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Error en los datos proporcionados
 */
router.post("/register", register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login", login);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Cerrar sesión (requiere token)
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *       403:
 *         description: No autorizado
 */
router.post("/logout", authenticate, logout);

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Refrescar token de acceso
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: tuRefreshToken
 *     responses:
 *       200:
 *         description: Token actualizado
 *       403:
 *         description: Token inválido o expirado
 */
router.post("/refresh", refresh);

export default router;
