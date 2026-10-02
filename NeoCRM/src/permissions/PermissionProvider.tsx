import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { loadPermissions } from './permissionService';
import type { Permission } from './permissionTypes';

type PermissionStatus = 'loading' | 'available' | 'unavailable';
type PermissionContextValue = { permissions: readonly Permission[]; status: PermissionStatus; hasPermission: (permission: Permission) => boolean; hasAnyPermission: (required: readonly Permission[]) => boolean; hasAllPermissions: (required: readonly Permission[]) => boolean };
const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth();
  const [permissions, setPermissions] = useState<readonly Permission[]>([]);
  const [status, setStatus] = useState<PermissionStatus>('loading');
  const [loadedUser, setLoadedUser] = useState<typeof user>(null);

  useEffect(() => {
    let active = true;
    if (authStatus === 'checking') { setStatus('loading'); return () => { active = false; }; }
    if (authStatus !== 'authenticated' || !user) { setPermissions([]); setLoadedUser(null); setStatus('available'); return () => { active = false; }; }
    setPermissions([]); setLoadedUser(null); setStatus('loading');
    loadPermissions(user).then(result => {
      if (!active) return;
      setPermissions(result); setLoadedUser(user); setStatus('available');
    }).catch(() => {
      if (!active) return;
      setPermissions([]); setLoadedUser(user); setStatus('unavailable');
    });
    return () => { active = false; };
  }, [authStatus, user]);

  const effectiveStatus: PermissionStatus = authStatus === 'checking' || (authStatus === 'authenticated' && loadedUser !== user) ? 'loading' : status;
  const granted = useMemo(() => new Set(permissions), [permissions]);
  const hasPermission = useCallback((permission: Permission) => effectiveStatus === 'available' && granted.has(permission), [effectiveStatus, granted]);
  const hasAnyPermission = useCallback((required: readonly Permission[]) => required.some(hasPermission), [hasPermission]);
  const hasAllPermissions = useCallback((required: readonly Permission[]) => required.every(hasPermission), [hasPermission]);
  const value = useMemo(() => ({ permissions, status: effectiveStatus, hasPermission, hasAnyPermission, hasAllPermissions }), [permissions, effectiveStatus, hasPermission, hasAnyPermission, hasAllPermissions]);
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}
export function usePermissions() { const value = useContext(PermissionContext); if (!value) throw new Error('usePermissions must be used inside PermissionProvider'); return value; }
