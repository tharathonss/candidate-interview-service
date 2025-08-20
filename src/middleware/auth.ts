import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = { uid: number; role: "USER" | "ADMIN" };

export function auth(required = true) {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
        if (!token) return required ? res.status(401).json({ error: "Unauthorized" }) : next();
        try {
            const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
            (req as any).user = payload;
            next();
        } catch {
            return res.status(401).json({ error: "Unauthorized" });
        }
    };
}