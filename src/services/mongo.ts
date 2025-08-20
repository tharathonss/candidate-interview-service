import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export async function connectMongo() {
    await mongoose.connect(env.mongoUrl);
    logger.info("Mongo connected");
}