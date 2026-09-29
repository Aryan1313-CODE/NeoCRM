import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import { prisma } from "./prisma";
import { getAuthUser, signToken, verifyPassword } from "./auth";
import { authenticate, requirePermission } from "./middleware";
import { writeAudit } from "./audit";

const app = express();
const PORT = Number(process.env.PORT || 8000);

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:8080")
  .split(",").map(x => x.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({ origin: origins, credentials: false }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

app.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Valid email and password are required" } });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || user.status !== "ACTIVE" || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
    if (user) {
      await writeAudit({ organizationId: user.organizationId, actorUserId: user.id, action: "LOGIN", resource: "Auth", result: "DENIED", ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    }
    return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
  }

  const authUser = await getAuthUser(user.id);
  if (!authUser) return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unable to create session" } });

  const token = signToken(user.id);
  await writeAudit({ organizationId: user.organizationId, actorUserId: user.id, action: "LOGIN", resource: "Auth", result: "SUCCESS", ipAddress: req.ip, userAgent: req.headers["user-agent"] });

  return res.json({
    access_token: token,
    user: {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      organization: (await prisma.organization.findUnique({ where: { id: authUser.organizationId } }))?.name || ""
    }
  });
});

app.get("/auth/me", authenticate, async (req, res) => {
  const u = req.authUser!;
  res.json({
    id: u.id, name: u.name, email: u.email, role: u.role,
    organization: (await prisma.organization.findUnique({ where: { id: u.organizationId } }))?.name || ""
  });
});

app.post("/auth/logout", authenticate, async (req, res) => {
  const u = req.authUser!;
  await writeAudit({ organizationId: u.organizationId, actorUserId: u.id, action: "LOGOUT", resource: "Auth", result: "SUCCESS", ipAddress: req.ip, userAgent: req.headers["user-agent"] });
  res.json({ success: true });
});

app.get("/users", authenticate, requirePermission("users", "read"), async (req, res) => {
  const users = await prisma.user.findMany({
    where: { organizationId: req.authUser!.organizationId },
    orderBy: { createdAt: "asc" },
    include: { roles: { include: { role: true } } }
  });
  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.roles[0]?.role.name || "sales",
    status: u.status === "ACTIVE" ? "Active" : "Inactive"
  })));
});

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "sales_manager", "sales", "inventory", "auditor"]),
  status: z.enum(["Active", "Inactive"])
});

async function getRole(name: string) {
  const role = await prisma.role.findUnique({ where: { name } });
  if (!role) throw new Error("Role not configured");
  return role;
}

app.post("/users", authenticate, requirePermission("users", "write"), async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid user data" } });

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return res.status(409).json({ success: false, error: { code: "EMAIL_ALREADY_EXISTS", message: "A user with this email already exists." } });
  }

  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash("Welcome@123");
  const role = await getRole(parsed.data.role);

  const created = await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        organizationId: req.authUser!.organizationId,
        name: parsed.data.name,
        email,
        passwordHash,
        status: parsed.data.status === "Active" ? "ACTIVE" : "INACTIVE"
      }
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user;
  });

  await writeAudit({
    organizationId: req.authUser!.organizationId, actorUserId: req.authUser!.id,
    action: "CREATE", resource: "User", resourceId: created.id, result: "SUCCESS",
    afterState: { name: created.name, email: created.email, role: parsed.data.role, status: parsed.data.status },
    ipAddress: req.ip, userAgent: req.headers["user-agent"]
  });

  res.status(201).json({ id: created.id, name: created.name, email: created.email, role: parsed.data.role, status: parsed.data.status });
});

app.put("/users/:id", authenticate, requirePermission("users", "write"), async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid user data" } });

  const userId = String(req.params.id);
  const existing = await prisma.user.findFirst({ where: { id: userId, organizationId: req.authUser!.organizationId }, include: { roles: { include: { role: true } } } });
  if (!existing) return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User was not found." } });

  const role = await getRole(parsed.data.role);
  const updated = await prisma.$transaction(async tx => {
    const user = await tx.user.update({
      where: { id: existing.id },
      data: { name: parsed.data.name, email: parsed.data.email.toLowerCase(), status: parsed.data.status === "Active" ? "ACTIVE" : "INACTIVE" }
    });
    await tx.userRole.deleteMany({ where: { userId: user.id } });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user;
  });

  await writeAudit({
    organizationId: req.authUser!.organizationId, actorUserId: req.authUser!.id,
    action: "UPDATE", resource: "User", resourceId: updated.id, result: "SUCCESS",
    beforeState: { name: existing.name, email: existing.email, role: existing.roles[0]?.role.name, status: existing.status },
    afterState: { name: updated.name, email: updated.email, role: parsed.data.role, status: parsed.data.status },
    ipAddress: req.ip, userAgent: req.headers["user-agent"]
  });

  res.json({ id: updated.id, name: updated.name, email: updated.email, role: parsed.data.role, status: parsed.data.status });
});

app.delete("/users/:id", authenticate, requirePermission("users", "write"), async (req, res) => {
  const userId = String(req.params.id);
  const existing = await prisma.user.findFirst({ where: { id: userId, organizationId: req.authUser!.organizationId } });
  if (!existing) return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User was not found." } });

  const updated = await prisma.user.update({ where: { id: existing.id }, data: { status: "INACTIVE" } });
  await writeAudit({
    organizationId: req.authUser!.organizationId, actorUserId: req.authUser!.id,
    action: "DELETE", resource: "User", resourceId: existing.id, result: "SUCCESS",
    beforeState: { status: existing.status }, afterState: { status: updated.status },
    ipAddress: req.ip, userAgent: req.headers["user-agent"]
  });
  res.json({ success: true });
});

app.get("/organization", authenticate, requirePermission("organization", "read"), async (req, res) => {
  const org = await prisma.organization.findUnique({ where: { id: req.authUser!.organizationId } });
  res.json(org ? { name: org.name, industry: org.industry, location: org.location, currency: org.currency } : {});
});

const orgSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  location: z.string().min(1),
  currency: z.string().min(1)
});

app.put("/organization", authenticate, requirePermission("organization", "write"), async (req, res) => {
  const parsed = orgSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid organization data" } });

  const before = await prisma.organization.findUnique({ where: { id: req.authUser!.organizationId } });
  const updated = await prisma.organization.update({ where: { id: req.authUser!.organizationId }, data: parsed.data });

  await writeAudit({
    organizationId: req.authUser!.organizationId, actorUserId: req.authUser!.id,
    action: "UPDATE", resource: "Organization", resourceId: updated.id, result: "SUCCESS",
    beforeState: before, afterState: updated, ipAddress: req.ip, userAgent: req.headers["user-agent"]
  });

  res.json({ name: updated.name, industry: updated.industry, location: updated.location, currency: updated.currency });
});

app.get("/audit", authenticate, requirePermission("audit", "read"), async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  const action = String(req.query.action || "");
  const result = String(req.query.result || "");

  const where: any = { organizationId: req.authUser!.organizationId };
  if (action) where.action = action;
  if (result) where.result = result;

  const logs = await prisma.auditLog.findMany({
    where, orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit, take: limit,
    include: { actor: true }
  });

  res.json(logs.map(l => ({
    id: l.id,
    actor: l.actor?.name || "Unknown",
    action: l.action,
    resource: l.resource,
    result: l.result,
    time: l.createdAt.toISOString()
  })));
});

app.get("/leads", authenticate, requirePermission("leads", "read"), async (req, res) => {
  const leads = await prisma.lead.findMany({ where: { organizationId: req.authUser!.organizationId }, orderBy: { createdAt: "desc" } });
  res.json(leads.map(l => ({ id: l.id, company: l.company, contactName: l.contactName, status: l.status, value: Number(l.value), createdAt: l.createdAt.toISOString() })));
});

app.get("/customers", authenticate, requirePermission("customers", "read"), async (req, res) => {
  const search = String(req.query.search || "").trim();
  const where: any = { organizationId: req.authUser!.organizationId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } }
    ];
  }
  const customers = await prisma.customer.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json(customers.map(c => ({
    id: c.id, name: c.name, company: c.company, type: c.type,
    industry: c.industry, location: c.location,
    last: c.lastContactAt ? c.lastContactAt.toISOString() : "Never",
    status: c.status
  })));
});

const customerSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  type: z.string().min(1),
  industry: z.string().min(1),
  location: z.string().min(1)
});

app.post("/customers", authenticate, requirePermission("customers", "write"), async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid customer data" } });

  const c = await prisma.customer.create({
    data: { organizationId: req.authUser!.organizationId, ...parsed.data, lastContactAt: new Date() }
  });
  await writeAudit({
    organizationId: req.authUser!.organizationId, actorUserId: req.authUser!.id,
    action: "CREATE", resource: "Customer", resourceId: c.id, result: "SUCCESS",
    afterState: c, ipAddress: req.ip, userAgent: req.headers["user-agent"]
  });
  res.status(201).json({ id: c.id, ...parsed.data, last: "Just now", status: c.status });
});

app.get("/dashboard/summary", authenticate, requirePermission("dashboard", "read"), async (req, res) => {
  const orgId = req.authUser!.organizationId;
  const [activeCustomers, totalCustomers, activeLeads, pipeline, quotesSent, totalClosed, won] = await Promise.all([
    prisma.customer.count({ where: { organizationId: orgId, status: "Active" } }),
    prisma.customer.count({ where: { organizationId: orgId } }),
    prisma.lead.count({ where: { organizationId: orgId, status: { notIn: ["WON", "LOST"] } } }),
    prisma.lead.aggregate({ where: { organizationId: orgId, status: { notIn: ["WON", "LOST"] } }, _sum: { value: true } }),
    prisma.quote.count({ where: { organizationId: orgId, status: { in: ["SENT", "ACCEPTED"] } } }),
    prisma.lead.count({ where: { organizationId: orgId, status: { in: ["WON", "LOST"] } } }),
    prisma.lead.count({ where: { organizationId: orgId, status: "WON" } })
  ]);
  const conversionRate = totalClosed ? Number(((won / totalClosed) * 100).toFixed(1)) : 0;
  res.json({
    totalCustomers, activeLeads, pipelineValue: Number(pipeline._sum.value || 0),
    quotesSent, conversionRate, activeCustomers
  });
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

app.get("/ai/health", authenticate, requirePermission("dashboard", "read"), async (_req, res) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);
    const data = await response.json();
    res.status(response.ok ? 200 : 503).json(data);
  } catch {
    res.status(503).json({ status: "error", service: "ai", message: "AI service unavailable" });
  }
});

const aiEmailSchema = z.object({ subject: z.string().optional().default(""), body: z.string().min(1) });

app.post("/ai/email/classify", authenticate, requirePermission("leads", "read"), async (req, res) => {
  const parsed = aiEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "A non-empty email body is required" } });
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/v1/email/classify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch {
    res.status(503).json({ success: false, error: { code: "AI_SERVICE_UNAVAILABLE", message: "AI service unavailable" } });
  }
});

app.use((_req, res) => res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } }));

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "The server encountered an error." } });
});

app.listen(PORT, () => {
  console.log(`Chemora backend running on http://localhost:${PORT}`);
});
