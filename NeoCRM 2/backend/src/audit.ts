import { prisma } from "./prisma";

function toJson(value: unknown) {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export async function writeAudit(input: {
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  result: "SUCCESS" | "DENIED" | "FAILURE";
  beforeState?: unknown;
  afterState?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      result: input.result,
      beforeState: toJson(input.beforeState) as any,
      afterState: toJson(input.afterState) as any,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}
