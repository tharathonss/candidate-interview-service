import request from "supertest";
import { makeApp } from "../src/app";

export const app = makeApp();
export const api = request(app);

export const randomEmail = (p = "user") =>
    `${p}.${Date.now()}${Math.floor(Math.random() * 999)}@test.io`;

export async function registerAndLogin(role: "USER" | "ADMIN" = "USER") {
    const email = randomEmail(role.toLowerCase());
    const password = "Passw0rd!";
    await api.post("/auth/register").send({ email, password, role }).expect(201);
    const login = await api.post("/auth/login").send({ email, password }).expect(200);
    const { access, refresh, user } = login.body;
    return { accessToken: access, refreshToken: refresh, user, email, password };
}

export function authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
}
