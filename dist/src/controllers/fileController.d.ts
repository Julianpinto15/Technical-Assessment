import { Response } from "express";
import { Request } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare const uploadFile: (((error: any, req: Request, res: Response, next: any) => Response<any, Record<string, any>> | undefined) | import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>> | ((req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
export declare const previewFile: (((error: any, req: Request, res: Response, next: any) => Response<any, Record<string, any>> | undefined) | import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>> | ((req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
export declare const mapColumns: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const confirmUpload: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=fileController.d.ts.map