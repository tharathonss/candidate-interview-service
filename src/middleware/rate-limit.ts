import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const authLimiter = rateLimit({
    windowMs: env.rateLimitAuthWindowMs,
    max: env.rateLimitAuthMax,
    standardHeaders: true,
    legacyHeaders: false,
});

export const generalLimiter = rateLimit({
    windowMs: env.rateLimitGeneralWindowMs,
    max: env.rateLimitGeneralMax,
    standardHeaders: true,
    legacyHeaders: false,
});
