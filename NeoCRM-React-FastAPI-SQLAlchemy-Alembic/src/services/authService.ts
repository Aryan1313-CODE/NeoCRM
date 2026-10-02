import { api } from "./api";
interface AuthResponse { access_token: string; user: { id: string; name: string; email: string; role: string; organization?: string } }
export const authService = { login: (email: string, password: string) => api.post<AuthResponse>("/auth/login", { email, password }), me: () => api.get<AuthResponse["user"] | null>("/auth/me"), logout: () => api.post<void>("/auth/logout", {}) };
