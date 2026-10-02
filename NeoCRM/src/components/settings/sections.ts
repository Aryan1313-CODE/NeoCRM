import type { Permission } from '../../permissions/permissionTypes';
export const settingsSections: { label: string; path: string; permission: Permission }[] = [
 { label: 'General', path: '/settings', permission: 'settings.view' },
 { label: 'Users', path: '/settings/users', permission: 'users.view' },
 { label: 'Organization', path: '/settings/organization', permission: 'organization.view' },
];
