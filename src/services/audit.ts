import { prisma } from "./prisma";

export type CardStatus = "todo" | "inprogress" | "done";

type Snapshot = {
  title?: string;
  description?: string;
  status?: CardStatus;
};

export async function logCardChange(args: {
  actorId: number;
  cardId: string;
  action: "card.create" | "card.update" | "card.delete";
  before?: Snapshot;
  after?: Snapshot;
  ip?: string;
}) {
  const b = args.before ?? {};
  const a = args.after ?? {};
  await prisma.auditLog.create({
    data: {
      actorId: args.actorId,
      action: args.action,
      entity: "card",
      entityId: args.cardId,
      beforeTitle: b.title ?? null,
      beforeDescription: b.description ?? null,
      beforeStatus: b.status ?? null,
      afterTitle: a.title ?? null,
      afterDescription: a.description ?? null,
      afterStatus: a.status ?? null,
      ip: args.ip,
    },
  });
}
