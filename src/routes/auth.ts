import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../services/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { authLimiter } from "../middleware/rate-limit";
import crypto from "node:crypto";

export const authRouter = Router();
authRouter.use(authLimiter);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

authRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, role: role ?? "USER" } });
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (e) { next(e); }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const access = jwt.sign(
      { uid: user.id, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpires }
    );

    const expiresAt = new Date(Date.now() + env.refreshDays * 24 * 3600 * 1000);
    const refresh = crypto.randomUUID();

    await prisma.refreshToken.create({ data: { token: refresh, userId: user.id, expiresAt } });
    res.json({ access, refresh, expiresAt });
  } catch (e) { next(e); }
});

authRouter.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.body?.refresh || "");
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid refresh" });
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    const access = jwt.sign(
      { uid: user.id, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpires }
    );
    res.json({ access });
  } catch (e) { next(e); }
});