import { api } from "./api";
export interface Organization { name: string; industry: string; location: string; currency: string }
export const organizationService = { get: () => api.get<Organization>("/organization"), update: (payload: Organization) => api.put<Organization>("/organization", payload) };
