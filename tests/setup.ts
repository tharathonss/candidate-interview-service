// tests/setup.ts
import { connectMongo } from "../src/services/mongo";
import { prisma } from "../src/services/prisma";
import mongoose from "mongoose";

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await connectMongo();
    await prisma.$connect();
});

afterAll(async () => {
    try {
        await prisma.$disconnect();
    } catch { }

    try {
        await Promise.all(
            mongoose.connections.map((c) =>
                c.readyState ? c.close(true) : Promise.resolve()
            )
        );
        await mongoose.disconnect();
    } catch { }
});
