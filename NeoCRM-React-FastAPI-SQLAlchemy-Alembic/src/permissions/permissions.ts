export const PERMISSIONS = {
  DASHBOARD: 'dashboard.view',
  CUSTOMERS: 'customers.view',
  CUSTOMERS_WRITE: 'customers.write',
  LEADS: 'leads.view',
  DEALS: 'deals.view',
  PRODUCTS: 'products.view',
  QUOTES: 'quotes.view',
  ORDERS: 'orders.view',
  COMPLIANCE: 'compliance.view',
  ANALYTICS: 'analytics.view',
  TASKS: 'tasks.view',
  USERS: 'users.view',
  AUDIT: 'audit.view',
  ORG: 'organization.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  sales_manager: [PERMISSIONS.DASHBOARD, PERMISSIONS.CUSTOMERS, PERMISSIONS.CUSTOMERS_WRITE, PERMISSIONS.LEADS, PERMISSIONS.DEALS, PERMISSIONS.PRODUCTS, PERMISSIONS.QUOTES, PERMISSIONS.ORDERS, PERMISSIONS.COMPLIANCE, PERMISSIONS.ANALYTICS, PERMISSIONS.TASKS],
  sales: [PERMISSIONS.DASHBOARD, PERMISSIONS.CUSTOMERS, PERMISSIONS.CUSTOMERS_WRITE, PERMISSIONS.LEADS, PERMISSIONS.DEALS, PERMISSIONS.PRODUCTS, PERMISSIONS.QUOTES, PERMISSIONS.TASKS],
  inventory: [PERMISSIONS.DASHBOARD, PERMISSIONS.PRODUCTS, PERMISSIONS.ORDERS, PERMISSIONS.COMPLIANCE],
  auditor: [PERMISSIONS.DASHBOARD, PERMISSIONS.AUDIT, PERMISSIONS.ANALYTICS],
};

export type Role = keyof typeof ROLE_PERMISSIONS;

export function hasPermission(user: { role?: string } | null | undefined, permission: Permission | string) {
  const permissions: readonly Permission[] | undefined = user ? ROLE_PERMISSIONS[user.role as Role] : undefined;
  return Boolean(permissions?.includes(permission as Permission));
}
