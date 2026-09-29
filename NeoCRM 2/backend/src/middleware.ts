import { Request, Response, NextFunction } from "express";
import { getAuthUser, verifyToken, AuthUser } from "./auth";
import { writeAudit } from "./audit";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    const userId = verifyToken(header.slice(7));
    const user = await getAuthUser(userId);
    if (!user) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or inactive session" } });
    }

    req.authUser = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } });
  }
}

export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user) return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });

    const allowed = user.permissions.includes(`${resource}:${action}`);
    if (!allowed) {
      await writeAudit({
        organizationId: user.organizationId,
        actorUserId: user.id,
        action: req.method,
        resource,
        resourceId: String(req.params.id),
        result: "DENIED",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." } });
    }

    next();
  };
}
