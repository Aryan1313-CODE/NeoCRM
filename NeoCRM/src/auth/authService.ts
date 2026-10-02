export type AuthUser = { name: string; title?: string; email?: string };
export type AuthSession = { user: AuthUser };
export type LoginCredentials = { identifier: string; password: string };

/**
 * Frontend boundary for the backend authentication contract.
 * TODO: Connect these methods when the backend team documents its session,
 * login, and logout contract. No endpoint, token type, or storage strategy
 * is assumed here.
 */
export interface AuthService {
  getCurrentSession(): Promise<AuthSession | null>;
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
}

export class AuthServiceUnavailableError extends Error {
  constructor() {
    super('Authentication is not connected yet. Please try again later.');
    this.name = 'AuthServiceUnavailableError';
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

/** Isolated adapter. API base URL is configurable, but endpoints await the backend contract. */
export const authService: AuthService = {
  async getCurrentSession() {
    // No session check can be made without a documented backend contract.
    return null;
  },
  async login(_credentials) {
    void apiBaseUrl;
    throw new AuthServiceUnavailableError();
  },
  async logout() {
    // Local state is cleared by AuthProvider. Add a remote operation only
    // after the backend team provides its logout endpoint and session rules.
  },
};
