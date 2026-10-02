import { apiList } from "./api";
export interface AuditEvent { id: string; actor: string; action: string; resource: string; result: string; time: string }
type ListResponse<T> = T[] | { data: T[] };
export const auditService = { list: (params: Record<string, string | number>) => apiList<ListResponse<AuditEvent>>("/audit", params) };
