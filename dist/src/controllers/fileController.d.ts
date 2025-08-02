import { Response } from "express";
import { Request } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare const uploadFile: (import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>> | ((req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
export {};
//# sourceMappingURL=fileController.d.ts.map