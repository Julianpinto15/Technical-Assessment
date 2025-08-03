export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
//# sourceMappingURL=AuthenticatedRequest.d.ts.map