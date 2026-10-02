import { apiList, api } from "./api";
export interface Customer { id: string; name: string; company: string; type: string; industry: string; location: string; last?: string; status: string }
type ListResponse<T> = T[] | { data: T[] };
export const customerService = { list: (params: Record<string, string>) => apiList<ListResponse<Customer>>("/customers", params), create: (payload: Record<string, string>) => api.post<Customer>("/customers", payload) };
