import { Express } from "express";
import swaggerUi from "swagger-ui-express";

export const swaggerSpec = {
    openapi: "3.0.3",
    info: { title: "candidate-interview-service", version: "1.0.0" },
    servers: [{ url: "http://localhost:3000" }],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
        schemas: {
            Error: {
                type: "object",
                properties: { error: { oneOf: [{ type: "string" }, { type: "object" }] } },
            },
            Health: {
                type: "object",
                properties: {
                    ok: { type: "boolean" },
                    mongo: { type: "boolean" },
                    postgres: { type: "boolean" },
                },
                required: ["ok"],
            },
            AuthRegisterRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    role: { type: "string", enum: ["USER", "ADMIN"] },
                },
            },
            AuthRegisterResponse: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    email: { type: "string", format: "email" },
                    role: { type: "string", enum: ["USER", "ADMIN"] },
                },
                required: ["id", "email", "role"],
            },
            AuthLoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                },
            },
            AuthLoginResponse: {
                type: "object",
                properties: {
                    access: { type: "string" },
                    refresh: { type: "string" },
                    expiresAt: { type: "string", format: "date-time" },
                },
                required: ["access", "refresh", "expiresAt"],
            },
            AuthRefreshRequest: {
                type: "object",
                required: ["refresh"],
                properties: { refresh: { type: "string" } },
            },
            AuthRefreshResponse: {
                type: "object",
                properties: { access: { type: "string" } },
                required: ["access"],
            },
            Card: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string", enum: ["todo", "inprogress", "done"] },
                    createdBy: { type: "integer" },
                    archived: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
                required: ["_id", "title", "status"],
            },
            CardListResponse: {
                type: "object",
                properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/Card" } },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                },
                required: ["items", "page", "limit", "total"],
            },
            CardCreateRequest: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string", enum: ["todo", "inprogress", "done"] },
                },
            },
            CardUpdateRequest: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string", enum: ["todo", "inprogress", "done"] },
                },
                additionalProperties: false,
            },
            Comment: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    cardId: { type: "string" },
                    body: { type: "string" },
                    authorId: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
                required: ["_id", "cardId", "body", "authorId"],
            },
            CommentListResponse: {
                type: "object",
                properties: { items: { type: "array", items: { $ref: "#/components/schemas/Comment" } } },
                required: ["items"],
            },
            CommentCreateRequest: {
                type: "object",
                required: ["body"],
                properties: { body: { type: "string" } },
            },
            CommentUpdateRequest: {
                type: "object",
                required: ["body"],
                properties: { body: { type: "string" } },
            },
            CardLogItem: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    actorId: { type: "integer" },
                    action: { type: "string" },
                    before: {
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    status: { type: "string", enum: ["todo", "inprogress", "done"] },
                                },
                            },
                            { type: "null" },
                        ],
                    },
                    after: {
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    status: { type: "string", enum: ["todo", "inprogress", "done"] },
                                },
                            },
                            { type: "null" },
                        ],
                    },
                    ip: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                },
                required: ["id", "actorId", "action", "createdAt"],
            },
            CardLogsResponse: {
                type: "object",
                properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/CardLogItem" } },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                },
                required: ["items", "page", "limit", "total"],
            },
        },
    },
    security: [{ bearerAuth: [] }],
    paths: {
        "/health": {
            get: {
                summary: "Health check",
                security: [],
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Health" } } } },
                },
            },
        },
        "/auth/register": {
            post: {
                summary: "Register",
                security: [],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRegisterRequest" } } },
                },
                responses: {
                    201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRegisterResponse" } } } },
                    400: { description: "Bad Request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
                },
            },
        },
        "/auth/login": {
            post: {
                summary: "Login",
                security: [],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthLoginRequest" } } },
                },
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthLoginResponse" } } } },
                    401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
                },
            },
        },
        "/auth/refresh": {
            post: {
                summary: "Refresh access token",
                security: [],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRefreshRequest" } } },
                },
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRefreshResponse" } } } },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/cards": {
            get: {
                summary: "List cards",
                parameters: [
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                    { name: "archived", in: "query", required: false, schema: { type: "boolean", default: false } },
                ],
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CardListResponse" } } } },
                },
            },
            post: {
                summary: "Create card",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/CardCreateRequest" } } },
                },
                responses: {
                    201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Card" } } } },
                    400: { description: "Bad Request" },
                },
            },
        },
        "/cards/{id}": {
            get: {
                summary: "Get card",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Card" } } } },
                    404: { description: "Not Found" },
                },
            },
            patch: {
                summary: "Update card",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/CardUpdateRequest" } } },
                },
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Card" } } } },
                    404: { description: "Not Found" },
                },
            },
            delete: {
                summary: "Delete card",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { 204: { description: "No Content" }, 404: { description: "Not Found" } },
            },
        },
        "/cards/{id}/archive": {
            post: {
                summary: "Archive card",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Card" } } } },
                    404: { description: "Not Found" },
                },
            },
        },
        "/cards/{id}/unarchive": {
            post: {
                summary: "Unarchive card",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Card" } } } },
                    404: { description: "Not Found" },
                },
            },
        },
        "/cards/{id}/comments": {
            get: {
                summary: "List comments",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CommentListResponse" } } } },
                },
            },
            post: {
                summary: "Add comment",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/CommentCreateRequest" } } },
                },
                responses: {
                    201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Comment" } } } },
                    404: { description: "Card Not Found" },
                },
            },
        },
        "/cards/{id}/comments/{commentId}": {
            patch: {
                summary: "Update comment (owner only)",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                    { name: "commentId", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/CommentUpdateRequest" } } },
                },
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Comment" } } } },
                    403: { description: "Forbidden" },
                    404: { description: "Not Found" },
                },
            },
            delete: {
                summary: "Delete comment (owner only)",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                    { name: "commentId", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: { 204: { description: "No Content" }, 403: { description: "Forbidden" }, 404: { description: "Not Found" } },
            },
        },
        "/cards/{id}/logs": {
            get: {
                summary: "Card logs",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                    { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
                ],
                responses: {
                    200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/CardLogsResponse" } } } },
                },
            },
        },
    },
};

export function setupSwagger(app: Express) {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
