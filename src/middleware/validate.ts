import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type From = "body" | "query" | "params";

export function validate(from: From, schema: ZodSchema<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        const parsed = schema.safeParse((req as any)[from]);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        (res.locals as any).validated ??= {};
        (res.locals as any).validated[from] = parsed.data;
        next();
    };
}
