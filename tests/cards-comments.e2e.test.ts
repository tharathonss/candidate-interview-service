import { api, registerAndLogin, authHeader } from "./helpers";

describe("Cards & Comments", () => {
    it("logged-in users can CRUD card; only comment owner can edit/delete; logs available", async () => {
        const A = await registerAndLogin("USER");

        const created = await api
            .post("/cards")
            .set(authHeader(A.accessToken))
            .send({ title: "First card", description: "hello", status: "todo" })
            .expect(201);

        const cardId = created.body.id || created.body._id;
        expect(cardId).toBeTruthy();

        await api
            .patch(`/cards/${cardId}`)
            .set(authHeader(A.accessToken))
            .send({ description: "updated" })
            .expect(200);

        const cmt = await api
            .post(`/cards/${cardId}/comments`)
            .set(authHeader(A.accessToken))
            .send({ body: "body test" })
            .expect(201);

        const commentId = cmt.body.id || cmt.body._id;

        const B = await registerAndLogin("USER");
        await api
            .patch(`/cards/${cardId}/comments/${commentId}`)
            .set(authHeader(B.accessToken))
            .send({ body: "no entry" })
            .expect(403);

        await api
            .patch(`/cards/${cardId}/comments/${commentId}`)
            .set(authHeader(A.accessToken))
            .send({ body: "edited by author" })
            .expect(200);

        await api
            .delete(`/cards/${cardId}/comments/${commentId}`)
            .set(authHeader(A.accessToken))
            .expect(204);

        const logs = await api
            .get(`/cards/${cardId}/logs`)
            .set(authHeader(A.accessToken))
            .expect(200);

        expect(logs.body).toEqual(
            expect.objectContaining({
                items: expect.any(Array),
                page: expect.any(Number),
                limit: expect.any(Number),
                total: expect.any(Number),
            })
        );
    });
});
