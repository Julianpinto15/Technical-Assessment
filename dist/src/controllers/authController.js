"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.logout = exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const authService_1 = require("../services/authService");
exports.register = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const user = await (0, authService_1.registerUser)(req.body);
            res.status(201).json({
                message: "User registered successfully",
                user: { id: user.id, email: user.email },
            });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
];
exports.login = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { accessToken, refreshToken } = await (0, authService_1.loginUser)(req.body);
            res.json({ accessToken, refreshToken });
        }
        catch (error) {
            res.status(401).json({ message: error.message });
        }
    },
];
const logout = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        await (0, authService_1.logoutUser)(req.user.userId);
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.logout = logout;
const refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ message: "Refresh token is required" });
    try {
        const accessToken = await (0, authService_1.refreshAccessToken)(refreshToken);
        res.json({ accessToken });
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
};
exports.refresh = refresh;
//# sourceMappingURL=authController.js.map