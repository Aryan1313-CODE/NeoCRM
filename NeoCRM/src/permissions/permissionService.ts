import type { AuthUser } from '../auth/authService';
import type { Permission } from './permissionTypes';

export class PermissionServiceUnavailableError extends Error {
  constructor() {
    super('Permissions are not connected to the backend yet.');
    this.name = 'PermissionServiceUnavailableError';
  }
}

/**
 * Adapter boundary for the future backend permission response. Replace this
 * method with the documented auth/session permission contract when available.
 * In development only, a mock fixture supports layout and permission previews.
 */
export async function loadPermissions(_user: AuthUser): Promise<readonly Permission[]> {
  if (import.meta.env.DEV) {
    const adapter = await import('./mockPermissionAdapter');
    return adapter.getMockPermissions();
  }
  throw new PermissionServiceUnavailableError();
}
