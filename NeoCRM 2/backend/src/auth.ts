import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

export type AuthUser = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  status: string;
  role: string;
  permissions: string[];
};

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  if (!payload.sub) throw new Error("Invalid token");
  return String(payload.sub);
}

export async function getAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } }
            }
          }
        }
      }
    }
  });

  if (!user || user.status !== "ACTIVE") return null;

  const role = user.roles[0]?.role.name || "sales";
  const permissions = user.roles.flatMap(ur =>
    ur.role.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`)
  );

  return {
    id: user.id,
    organizationId: user.organizationId,
    name: user.name,
    email: user.email,
    status: user.status,
    role,
    permissions: [...new Set(permissions)]
  };
}
