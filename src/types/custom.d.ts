import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/tokenService";
declare module "./routes/index";
declare module "./routes/users";

//docts
declare module "swagger-jsdoc" {
  export interface SwaggerDefinition {
    openapi: string;
    info: {
      title: string;
      version: string;
      description?: string;
    };
    servers?: Array<{
      url: string;
      description?: string;
    }>;
  }

  export interface Options {
    definition: SwaggerDefinition;
    apis: string[];
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: import("../services/tokenService").TokenPayload;
  }
}
