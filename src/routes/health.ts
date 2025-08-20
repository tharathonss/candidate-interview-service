import { Router } from "express";
import mongoose from "mongoose";
import { prisma } from "../services/prisma";

export const health = Router();

health.get("/", async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  await prisma.$queryRaw`SELECT 1;`;
  res.json({ ok: true, mongo: mongoOk, postgres: true });
});