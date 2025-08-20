import express from "express";
import cors from "cors";
import helmet from "helmet";
import { generalLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./middleware/error";
import { health } from "./routes/health";
import { authRouter } from "./routes/auth";
import { cardsRouter } from "./routes/cards";
import { setupSwagger } from "./config/swagger";


export function makeApp() {
    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: "1mb" }));
    app.use(generalLimiter);

    app.use("/health", health);
    app.use("/auth", authRouter);
    app.use("/cards", cardsRouter);
    setupSwagger(app);

    app.use(errorHandler);
    return app;
}