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
export declare const registerUser: (input: RegisterInput) => Promise<User>;
export declare const loginUser: (input: LoginInput) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare const logoutUser: (userId: string) => Promise<void>;
export declare const refreshAccessToken: (refreshToken: string) => Promise<string>;
export {};
//# sourceMappingURL=authService.d.ts.map