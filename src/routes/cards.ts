import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Card } from "../models/card.model";
import { Comment } from "../models/comment.model";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { prisma } from "../services/prisma";
import { logCardChange } from "../services/audit";

type AuditRow = {
    id: number;
    actorId: number;
    action: string;
    beforeTitle: string | null;
    beforeDescription: string | null;
    beforeStatus: string | null;
    afterTitle: string | null;
    afterDescription: string | null;
    afterStatus: string | null;
    ip: string | null;
    createdAt: Date;
};

export const cardsRouter = Router();

cardsRouter.use(auth(true));

const idParam = z.object({
    id: z.string().refine(Types.ObjectId.isValid, "Invalid id"),
});
type IdParam = z.infer<typeof idParam>;

const commentIdParam = z.object({
    id: z.string().refine(Types.ObjectId.isValid, "Invalid card id"),
    commentId: z.string().refine(Types.ObjectId.isValid, "Invalid comment id"),
});
type CommentPath = z.infer<typeof commentIdParam>;

const createSchema = z.object({
    title: z.string().min(1),
    description: z.string().default(""),
    status: z.enum(["todo", "inprogress", "done"]).default("todo"),
});
type CreateBody = z.infer<typeof createSchema>;

const updateSchema = createSchema.partial();
type UpdateBody = z.infer<typeof updateSchema>;

const listQuery = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    archived: z.coerce.boolean().default(false),
});
type ListQuery = z.infer<typeof listQuery>;

const commentCreate = z.object({ body: z.string().min(1) });
type CommentCreate = z.infer<typeof commentCreate>;
const commentUpdate = z.object({ body: z.string().min(1) });
type CommentUpdate = z.infer<typeof commentUpdate>;

cardsRouter.get("/", validate("query", listQuery), async (_req, res) => {
    const { page, limit, archived } = (res.locals as any).validated.query as ListQuery;
    const filter = archived ? {} : { archived: { $ne: true } };
    const [items, total] = await Promise.all([
        Card.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Card.countDocuments(filter),
    ]);
    res.json({ items, page, limit, total });
});

cardsRouter.post("/", validate("body", createSchema), async (req, res, next) => {
    try {
        const user = (req as any).user!;
        const dto = (res.locals as any).validated.body as CreateBody;
        const card = await Card.create({ ...dto, createdBy: user.uid });
        await logCardChange({
            actorId: user.uid,
            cardId: String(card._id),
            action: "card.create",
            after: { title: card.title, description: card.description, status: card.status },
            ip: req.ip,
        });
        res.status(201).json(card);
    } catch (e) {
        next(e);
    }
});

cardsRouter.get("/:id", validate("params", idParam), async (_req, res) => {
    const { id } = (res.locals as any).validated.params as IdParam;
    const card = await Card.findById(id).lean();
    if (!card) return res.status(404).json({ error: "Not found" });
    res.json(card);
});

cardsRouter.patch(
    "/:id",
    validate("params", idParam),
    validate("body", updateSchema),
    async (req, res, next) => {
        try {
            const user = (req as any).user!;
            const { id } = (res.locals as any).validated.params as IdParam;
            const body = (res.locals as any).validated.body as UpdateBody;
            const before = await Card.findById(id);
            if (!before) return res.status(404).json({ error: "Not found" });
            const after = await Card.findByIdAndUpdate(before._id, body, { new: true });
            await logCardChange({
                actorId: user.uid,
                cardId: String(before._id),
                action: "card.update",
                before: { title: before.title, description: before.description, status: before.status },
                after: { title: after!.title, description: after!.description, status: after!.status },
                ip: req.ip,
            });
            res.json(after);
        } catch (e) {
            next(e);
        }
    }
);

cardsRouter.post("/:id/archive", validate("params", idParam), async (req, res, next) => {
    try {
        const user = (req as any).user!;
        const { id } = (res.locals as any).validated.params as IdParam;
        const updated = await Card.findByIdAndUpdate(id, { archived: true }, { new: true });
        if (!updated) return res.status(404).json({ error: "Not found" });
        await prisma.auditLog.create({ data: { actorId: user.uid, action: "card.archive", entity: "card", entityId: id, ip: req.ip } });
        res.json(updated);
    } catch (e) {
        next(e);
    }
});

cardsRouter.post("/:id/unarchive", validate("params", idParam), async (req, res, next) => {
    try {
        const user = (req as any).user!;
        const { id } = (res.locals as any).validated.params as IdParam;
        const updated = await Card.findByIdAndUpdate(id, { archived: false }, { new: true });
        if (!updated) return res.status(404).json({ error: "Not found" });
        await prisma.auditLog.create({ data: { actorId: user.uid, action: "card.unarchive", entity: "card", entityId: id, ip: req.ip } });
        res.json(updated);
    } catch (e) {
        next(e);
    }
});

cardsRouter.delete("/:id", validate("params", idParam), async (req, res, next) => {
    try {
        const user = (req as any).user!;
        const { id } = (res.locals as any).validated.params as IdParam;
        const found = await Card.findByIdAndDelete(id);
        if (!found) return res.status(404).json({ error: "Not found" });
        await logCardChange({
            actorId: user.uid,
            cardId: String(found._id),
            action: "card.delete",
            before: { title: found.title, description: found.description, status: found.status },
            ip: req.ip,
        });
        await Comment.deleteMany({ cardId: found._id });
        res.status(204).send();
    } catch (e) {
        next(e);
    }
});

cardsRouter.get("/:id/comments", validate("params", idParam), async (_req, res) => {
    const { id } = (res.locals as any).validated.params as IdParam;
    const items = await Comment.find({ cardId: id }).sort({ createdAt: -1 }).lean();
    res.json({ items });
});

cardsRouter.post(
    "/:id/comments",
    validate("params", idParam),
    validate("body", commentCreate),
    async (req, res, next) => {
        try {
            const user = (req as any).user!;
            const { id } = (res.locals as any).validated.params as IdParam;
            const body = (res.locals as any).validated.body as CommentCreate;
            const exists = await Card.exists({ _id: id });
            if (!exists) return res.status(404).json({ error: "Card not found" });
            const c = await Comment.create({ cardId: id, body: body.body, authorId: user.uid });
            res.status(201).json(c);
        } catch (e) {
            next(e);
        }
    }
);

cardsRouter.patch(
    "/:id/comments/:commentId",
    validate("params", commentIdParam),
    validate("body", commentUpdate),
    async (req, res, next) => {
        try {
            const user = (req as any).user!;
            const { id, commentId } = (res.locals as any).validated.params as CommentPath;
            const body = (res.locals as any).validated.body as CommentUpdate;
            const c = await Comment.findById(commentId);
            if (!c || String(c.cardId) !== id) return res.status(404).json({ error: "Not found" });
            if (c.authorId !== user.uid) return res.status(403).json({ error: "Forbidden" });
            c.body = body.body;
            await c.save();
            res.json(c);
        } catch (e) {
            next(e);
        }
    }
);

cardsRouter.delete(
    "/:id/comments/:commentId",
    validate("params", commentIdParam),
    async (req, res, next) => {
        try {
            const user = (req as any).user!;
            const { id, commentId } = (res.locals as any).validated.params as CommentPath;
            const c = await Comment.findById(commentId);
            if (!c || String(c.cardId) !== id) return res.status(404).json({ error: "Not found" });
            if (c.authorId !== user.uid) return res.status(403).json({ error: "Forbidden" });
            await Comment.deleteOne({ _id: c._id });
            res.status(204).send();
        } catch (e) {
            next(e);
        }
    }
);

cardsRouter.get(
    "/:id/logs",
    validate("params", idParam),
    validate("query", z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(10) })),
    async (_req, res) => {
        const { id } = (res.locals as any).validated.params as IdParam;
        const { page, limit } = (res.locals as any).validated.query as { page: number; limit: number };
        const [rows, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { entity: "card", entityId: id },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where: { entity: "card", entityId: id } }),
        ]);
        const items = (rows as AuditRow[]).map((r) => ({
            id: r.id,
            actorId: r.actorId,
            action: r.action,
            before:
                (r.beforeTitle ?? r.beforeDescription ?? r.beforeStatus) != null
                    ? { title: r.beforeTitle ?? undefined, description: r.beforeDescription ?? undefined, status: r.beforeStatus ?? undefined }
                    : null,
            after:
                (r.afterTitle ?? r.afterDescription ?? r.afterStatus) != null
                    ? { title: r.afterTitle ?? undefined, description: r.afterDescription ?? undefined, status: r.afterStatus ?? undefined }
                    : null,
            ip: r.ip ?? undefined,
            createdAt: r.createdAt,
        }));
        res.json({ items, page, limit, total });
    }
);
