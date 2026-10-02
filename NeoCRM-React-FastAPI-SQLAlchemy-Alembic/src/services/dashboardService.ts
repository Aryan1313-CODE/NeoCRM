import { api } from "./api";
import { auditService } from "./auditService";
export const dashboardService = { summary: () => api.get("/dashboard/summary"), recentActivity: () => auditService.list({ page: 1, limit: 4 }) };
