import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import { hasPermission } from "./permissions";

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const value = useMemo(() => ({ user, can: permission => hasPermission(user, permission), role: user?.role || null }), [user]);
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) throw new Error("usePermissions must be inside PermissionProvider");
  return context;
}
