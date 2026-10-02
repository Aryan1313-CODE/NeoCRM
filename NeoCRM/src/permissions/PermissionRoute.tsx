import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { usePermissions } from './PermissionProvider';
import type { Permission } from './permissionTypes';

export function Forbidden() {
  return <main className="access-state-page"><Card className="access-state-card"><span className="access-code">403</span><p className="eyebrow">WORKSPACE ACCESS</p><h1>Access restricted</h1><p>You don’t have permission to access this section. If you think you need access, contact your workspace administrator.</p><Link className="button button-primary" to="/dashboard">Return to Dashboard <span aria-hidden="true">→</span></Link></Card></main>;
}
function PermissionCheckLoading() {
  return <main className="access-state-page" role="status"><Card className="access-state-card"><span className="loading-mark">N</span><h1>Checking access…</h1><p>Your workspace permissions are loading.</p></Card></main>;
}
function PermissionUnavailable() {
  return <main className="access-state-page" role="alert"><Card className="access-state-card"><p className="eyebrow">WORKSPACE ACCESS</p><h1>Access can’t be verified</h1><p>Permission information is not connected yet. Please try again after your workspace access is available.</p><Link className="button button-secondary" to="/dashboard">Return to Dashboard <span aria-hidden="true">→</span></Link></Card></main>;
}
export function PermissionRoute({ permission, children }: { permission: Permission; children: ReactNode }) {
  const access = usePermissions();
  if (access.status === 'loading') return <PermissionCheckLoading />;
  if (access.status === 'unavailable') return <PermissionUnavailable />;
  return access.hasPermission(permission) ? <>{children}</> : <Forbidden />;
}
