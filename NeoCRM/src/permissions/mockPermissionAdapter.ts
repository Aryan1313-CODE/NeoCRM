import type { Permission, PermissionScenario } from './permissionTypes';
const scenarios: Record<PermissionScenario, readonly Permission[]> = {
 'customer-sales': ['dashboard.view', 'customers.view', 'customers.create', 'leads.view'],
 'analytics-only': ['dashboard.view', 'analytics.view'],
 'management-admin': ['dashboard.view','settings.view','users.view','users.create','users.edit','users.status','organization.view','organization.edit','audit.view'],
 'users-reader': ['dashboard.view','settings.view','users.view'],
};
/** Development-only permission fixture; never use as an authorization source in production. */
export async function getMockPermissions(): Promise<readonly Permission[]> {
 const scenario = import.meta.env.VITE_MOCK_PERMISSION_SCENARIO ?? 'management-admin';
 return scenarios[scenario] ?? scenarios['management-admin'];
}

