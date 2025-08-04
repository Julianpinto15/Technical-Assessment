import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare function createAlertThreshold(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAlertThresholds(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getRecentAlerts(req: AuthenticatedRequest, res: Response): Promise<void>;
export {};
//# sourceMappingURL=alertController.d.ts.map