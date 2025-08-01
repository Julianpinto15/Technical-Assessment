import prisma from "../../prismaClient";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./tokenService";
import { User } from "../generated/prisma";

interface RegisterInput {
  email: string;
  password: string;
  role?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput): Promise<User> => {
  const hashedPassword = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      role: input.role || "user",
    },
  });
};

export const loginUser = async (
  input: LoginInput
): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new Error("Invalid credentials");

  const isPasswordValid = await comparePassword(input.password, user.password);
  if (!isPasswordValid) throw new Error("Invalid credentials");

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Guardar refresh token en la base de datos
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLogin: new Date() },
  });

  return { accessToken, refreshToken };
};

export const logoutUser = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<string> => {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user || user.refreshToken !== refreshToken)
      throw new Error("Invalid refresh token");

    const newPayload = { userId: user.id, email: user.email, role: user.role };
    return generateAccessToken(newPayload);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};
