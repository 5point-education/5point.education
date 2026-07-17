import { AccountAuditAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function recordAccountAudit(data: {
  action: AccountAuditAction;
  userId?: string;
  actorId?: string;
  email?: string;
  request?: Request;
  metadata?: Record<string, unknown>;
}) {
  const request = data.request;
  return db.accountAudit.create({
    data: {
      action: data.action,
      userId: data.userId,
      actorId: data.actorId,
      email: data.email,
      ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request?.headers.get("x-real-ip") || undefined,
      userAgent: request?.headers.get("user-agent") || undefined,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
