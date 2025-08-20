import { makeApp } from "./app";
import { connectMongo } from "./services/mongo";
import { prisma } from "./services/prisma";
import { logger } from "./utils/logger";
import { env } from "./config/env";

(async () => {
    try {
        await connectMongo();
        await prisma.$connect();

        const app = makeApp();
        app.listen(env.port, () => {
            logger.info(`candidate-interview-service listening on :${env.port}`);
            logger.info(`Swagger UI at /docs`);
        });
    } catch (e) {
        logger.error(e);
        process.exit(1);
    }
})();