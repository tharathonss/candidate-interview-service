import { api } from "./helpers";

describe("Auth", () => {
    it("register → login → refresh works", async () => {
        const email = `u.${Date.now()}@test.io`;
        const password = "Passw0rd!";

        await api.post("/auth/register").send({ email, password }).expect(201);

        const login = await api.post("/auth/login").send({ email, password }).expect(200);
        expect(login.body).toHaveProperty("access");
        expect(login.body).toHaveProperty("refresh");

        const refresh = await api
            .post("/auth/refresh")
            .send({ refresh: login.body.refresh })
            .expect(200);

        expect(refresh.body).toHaveProperty("access");
        expect(refresh.body.accessToken).not.toBe(login.body.access);
    });
});
