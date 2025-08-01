"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessToken = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const hash_1 = require("../utils/hash");
const tokenService_1 = require("./tokenService");
const registerUser = async (input) => {
    const hashedPassword = await (0, hash_1.hashPassword)(input.password);
    return prismaClient_1.default.user.create({
        data: {
            email: input.email,
            password: hashedPassword,
            role: input.role || "user",
        },
    });
};
exports.registerUser = registerUser;
const loginUser = async (input) => {
    const user = await prismaClient_1.default.user.findUnique({ where: { email: input.email } });
    if (!user)
        throw new Error("Invalid credentials");
    const isPasswordValid = await (0, hash_1.comparePassword)(input.password, user.password);
    if (!isPasswordValid)
        throw new Error("Invalid credentials");
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = (0, tokenService_1.generateAccessToken)(payload);
    const refreshToken = (0, tokenService_1.generateRefreshToken)(payload);
    // Guardar refresh token en la base de datos
    await prismaClient_1.default.user.update({
        where: { id: user.id },
        data: { refreshToken, lastLogin: new Date() },
    });
    return { accessToken, refreshToken };
};
exports.loginUser = loginUser;
const logoutUser = async (userId) => {
    await prismaClient_1.default.user.update({
        where: { id: userId },
        data: { refreshToken: null },
    });
};
exports.logoutUser = logoutUser;
const refreshAccessToken = async (refreshToken) => {
    try {
        const payload = (0, tokenService_1.verifyRefreshToken)(refreshToken);
        const user = await prismaClient_1.default.user.findUnique({
            where: { id: payload.userId },
        });
        if (!user || user.refreshToken !== refreshToken)
            throw new Error("Invalid refresh token");
        const newPayload = { userId: user.id, email: user.email, role: user.role };
        return (0, tokenService_1.generateAccessToken)(newPayload);
    }
    catch (error) {
        throw new Error("Invalid refresh token");
    }
};
exports.refreshAccessToken = refreshAccessToken;
//# sourceMappingURL=authService.js.map