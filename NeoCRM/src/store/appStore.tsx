import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
type AppState = { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void; loading: boolean; notifications: number; preferences: { compactMode: boolean } };
const AppStore = createContext<AppState | null>(null);
export function AppStoreProvider({ children }: { children: ReactNode }) {
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const value = useMemo(() => ({ sidebarOpen, setSidebarOpen, loading: false, notifications: 3, preferences: { compactMode: false } }), [sidebarOpen]);
 return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}
export function useAppStore() { const value = useContext(AppStore); if (!value) throw new Error('useAppStore must be used inside AppStoreProvider'); return value; }
