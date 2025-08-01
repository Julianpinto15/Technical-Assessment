"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../src/controllers/authController");
const authMiddleware_1 = require("../src/middlewares/authMiddleware");
const router = (0, express_1.Router)();
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
router.post("/register", authController_1.register);
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
router.post("/login", authController_1.login);
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
router.post("/logout", authMiddleware_1.authenticate, authController_1.logout);
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
router.post("/refresh", authController_1.refresh);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map