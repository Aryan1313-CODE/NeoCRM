export type UserRole = 'Administrator' | 'Manager' | 'Sales' | 'Viewer';
export type UserStatus = 'Active' | 'Inactive';
export type ManagedUser = { id: string; name: string; email: string; role: UserRole; status: UserStatus; lastActive: string };
export type UserInput = Pick<ManagedUser, 'name' | 'email' | 'role' | 'status'>;
export const userRoles: UserRole[] = ['Administrator', 'Manager', 'Sales', 'Viewer'];
export const userStatuses: UserStatus[] = ['Active', 'Inactive'];
