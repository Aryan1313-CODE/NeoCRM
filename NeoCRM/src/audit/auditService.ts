import { getAuditLogs } from './mockAuditAdapter';
import type { AuditFilters, AuditLog } from './types';
export async function listAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
 const logs = await getAuditLogs(); const query = filters.query.trim().toLowerCase(); const now = Date.now();
 return logs.filter(log => { const date = new Date(log.timestamp); const age = now - date.getTime();
  const matchesDate = filters.date === 'All time' || (filters.date === 'Today' && date.toDateString() === new Date().toDateString()) || (filters.date === 'Last 7 days' && age <= 7 * 86400000) || (filters.date === 'Last 30 days' && age <= 30 * 86400000);
  return (!query || [log.userName,log.action,log.resource,log.description].some(value=>value.toLowerCase().includes(query))) && (!filters.action || filters.action==='All' || log.action===filters.action) && (!filters.resource || filters.resource==='All' || log.resource===filters.resource) && (!filters.status || filters.status==='All' || log.status===filters.status.toLowerCase()) && (!filters.user || filters.user==='All' || log.userName===filters.user) && matchesDate;
 });
}
