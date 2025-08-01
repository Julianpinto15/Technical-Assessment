import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare const register: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
export declare const login: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
export declare const logout: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const refresh: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=authController.d.ts.map