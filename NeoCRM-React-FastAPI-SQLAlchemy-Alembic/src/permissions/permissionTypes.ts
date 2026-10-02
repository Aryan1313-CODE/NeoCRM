export const permissions = [
  'dashboard.view', 'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
  'leads.view', 'leads.create', 'leads.edit', 'leads.delete', 'deals.view', 'deals.create', 'deals.edit', 'deals.delete',
  'products.view', 'quotes.view', 'orders.view', 'compliance.view', 'analytics.view', 'tasks.view', 'settings.view', 'audit.view',
  'users.view', 'users.create', 'users.edit', 'users.status', 'organization.view', 'organization.edit',
] as const;
export type Permission = (typeof permissions)[number];
export type PermissionScenario = 'customer-sales' | 'analytics-only' | 'management-admin' | 'users-reader';
