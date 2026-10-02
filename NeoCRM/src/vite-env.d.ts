interface ImportMetaEnv {
 readonly DEV: boolean;
 readonly VITE_API_BASE_URL?: string;
 readonly VITE_MOCK_PERMISSION_SCENARIO?: 'customer-sales' | 'analytics-only' | 'management-admin' | 'users-reader';
}
interface ImportMeta { readonly env: ImportMetaEnv; }
