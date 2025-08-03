import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare function setForecastConfig(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=foreConfigController.d.ts.map