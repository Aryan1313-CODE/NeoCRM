export type AuditLog = { id: string; timestamp: string; userId: string; userName: string; action: 'Created' | 'Updated' | 'Deleted' | 'Login' | 'Logout'; resource: string; resourceId?: string; description: string; status: 'success' | 'failed' };
export type AuditFilters = { query: string; action: string; resource: string; status: string; date: string; user: string };
