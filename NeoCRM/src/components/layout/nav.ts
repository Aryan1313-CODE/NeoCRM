import type { Permission } from '../../permissions/permissionTypes';
export type NavigationItem = { label: string; path: string; icon: string; permission: Permission };
export const navigation: { label: string; items: NavigationItem[] }[] = [
  { label: 'Workspace', items: [{ label: 'Dashboard', path: '/dashboard', icon: '◫', permission: 'dashboard.view' }] },
  { label: 'Manage', items: [
    { label: 'Customers', path: '/customers', icon: '♧', permission: 'customers.view' },
    { label: 'Leads', path: '/leads', icon: '⌁', permission: 'leads.view' },
    { label: 'Deals', path: '/deals', icon: '◇', permission: 'deals.view' },
    { label: 'Products', path: '/products', icon: '▤', permission: 'products.view' },
    { label: 'Quotes', path: '/quotes', icon: '▧', permission: 'quotes.view' },
    { label: 'Orders', path: '/orders', icon: '▣', permission: 'orders.view' },
  ] },
  { label: 'Insights', items: [
    { label: 'Audit logs', path: '/audit', icon: '◷', permission: 'audit.view' },
    { label: 'Compliance', path: '/compliance', icon: '⬡', permission: 'compliance.view' },
    { label: 'Analytics', path: '/analytics', icon: '▥', permission: 'analytics.view' },
    { label: 'Tasks', path: '/tasks', icon: '☷', permission: 'tasks.view' },
  ] },
];
export const settingsNav: NavigationItem = { label: 'Settings', path: '/settings', icon: '⚙', permission: 'settings.view' };
