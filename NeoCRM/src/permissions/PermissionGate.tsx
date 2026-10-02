import type { ReactNode } from 'react';
import type { Permission } from './permissionTypes';
import { usePermissions } from './PermissionProvider';

type Props = {
  permission?: Permission;
  permissions?: readonly Permission[];
  require?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
};
export function PermissionGate({ permission, permissions, require = 'any', fallback = null, children }: Props) {
  const access = usePermissions();
  if (access.status !== 'available') return <>{fallback}</>;
  const required = permissions ?? (permission ? [permission] : []);
  const allowed = require === 'all' ? access.hasAllPermissions(required) : access.hasAnyPermission(required);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
