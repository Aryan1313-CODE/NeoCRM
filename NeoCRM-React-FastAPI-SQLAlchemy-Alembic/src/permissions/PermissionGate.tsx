import React from "react";
import { usePermissions } from "./PermissionProvider";
export function PermissionGate({ permission, children, fallback = null }) {
  const { can } = usePermissions();
  return can(permission) ? children : fallback;
}
