import { api } from "./api";
export interface User { id: string; name: string; email: string; role: string; status: string }
export const userService = { list: () => api.get<User[]>("/users"), create: (payload: Record<string, string>) => api.post<User>("/users", payload), update: (id: string, payload: Record<string, string>) => api.put<User>(`/users/${id}`, payload), deactivate: (id: string) => api.delete<void>(`/users/${id}`) };
