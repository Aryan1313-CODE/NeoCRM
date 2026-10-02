const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const USE_MOCK_API = String(import.meta.env.VITE_USE_MOCK_API ?? "false") === "true";

type QueryValue = string | number | boolean | null | undefined;
type ApiRecord = Record<string, unknown>;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiBaseUrl() { return API_BASE_URL; }

export async function apiRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  if (USE_MOCK_API) return mockRequest(path, options) as Promise<T>;
  const token = localStorage.getItem("chemora_access_token");
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  let data: unknown = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const body = isRecord(data) ? data : {};
    const nestedError = isRecord(body.error) ? body.error : {};
    const message = [nestedError.message, body.message, body.detail].find((value): value is string => typeof value === "string") || "API request failed";
    if (response.status === 401) {
      localStorage.removeItem("chemora_access_token");
      localStorage.removeItem("chemora_user");
      window.dispatchEvent(new Event("chemora:session-expired"));
    }
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T = unknown>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

export function buildQuery(params: Record<string, QueryValue> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.toString();
}

export async function apiList<T = unknown>(path: string, params: Record<string, QueryValue> = {}) {
  const qs = buildQuery(params);
  return api.get<T>(qs ? `${path}?${qs}` : path);
}

export function normalizeApiError(error: unknown) {
  const status = error instanceof ApiError ? error.status : undefined;
  const message = error instanceof Error ? error.message : undefined;
  if (status === 401) return { code: "UNAUTHORIZED", message: "Your session has expired. Please sign in again." };
  if (status === 403) return { code: "FORBIDDEN", message: "You do not have permission to perform this action." };
  if (status === 404) return { code: "NOT_FOUND", message: "The requested resource was not found." };
  if (status === 409) return { code: "CONFLICT", message: "This operation conflicts with existing data." };
  if (status === 422) return { code: "VALIDATION", message: "Please check the submitted fields." };
  if (status !== undefined && status >= 500) return { code: "SERVER", message: "The server encountered an error." };
  return { code: "UNKNOWN", message: message || "Something went wrong." };
}

export function validateRequired(fields: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  Object.entries(fields).forEach(([name, value]) => {
    if ((typeof value === "string" && !value.trim()) || value === null || value === undefined) errors[name] = "Required";
  });
  return errors;
}

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return { online: response.ok, status: response.status };
  } catch {
    return { online: false, status: 0 };
  }
}

function mockRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  const method = options.method || "GET";
  if (path === "/auth/login" && method === "POST") {
    const body: unknown = JSON.parse(typeof options.body === "string" ? options.body : "{}");
    const loginBody = isRecord(body) ? body : {};
    const email = typeof loginBody.email === "string" ? loginBody.email : undefined;
    return Promise.resolve({ access_token: "demo-token", user: { id: "usr-001", name: email?.split("@")[0] || "Demo User", email: email || "admin@chemora.com", role: "admin", organization: "Chemora Chemicals" } });
  }
  if (path === "/auth/me") return Promise.resolve(JSON.parse(localStorage.getItem("chemora_user") || "null"));
  if (path === "/users") return Promise.resolve([
    { id: "u1", name: "Riddima Singh", email: "riddima@chemora.com", role: "sales_manager", status: "Active" },
    { id: "u2", name: "Amit Verma", email: "amit@chemora.com", role: "sales", status: "Active" },
    { id: "u3", name: "Neha Kapoor", email: "neha@chemora.com", role: "inventory", status: "Active" },
  ]);
  if (path.startsWith("/audit")) return Promise.resolve([]);
  if (path.startsWith("/customers")) return Promise.resolve([]);
  if (path === "/dashboard/summary") return Promise.resolve({ totalCustomers: 0, activeLeads: 0, pipelineValue: 0, quotesSent: 0, conversionRate: 0 });
  if (path === "/organization") return Promise.resolve({ name: "Chemora Chemicals", industry: "Chemical Manufacturing & Distribution", location: "Bengaluru, India", currency: "INR" });
  return Promise.resolve({});
}

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null;
}
