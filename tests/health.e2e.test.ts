import { api } from "./helpers";

describe("Health", () => {
    it("GET /health is OK and includes db checks", async () => {
        const res = await api.get("/health").expect(200);
        expect(res.body).toBeTruthy();
        expect(res.body.status || res.body.ok).toBeDefined();
        expect(res.body).toHaveProperty("mongo");
        expect(res.body).toHaveProperty("postgres");
    });
});
