import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("chemora:session-expired", onExpired);
    return () => window.removeEventListener("chemora:session-expired", onExpired);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("chemora_access_token");
    const stored = localStorage.getItem("chemora_user");
    if (!token || !stored) { setLoading(false); return; }
    authService.me()
      .then(data => setUser(data || JSON.parse(stored)))
      .catch(() => { localStorage.removeItem("chemora_access_token"); localStorage.removeItem("chemora_user"); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await authService.login(email, password);
    localStorage.setItem("chemora_access_token", data.access_token);
    localStorage.setItem("chemora_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { if (localStorage.getItem("chemora_access_token")) await authService.logout(); } catch {}
    localStorage.removeItem("chemora_access_token");
    localStorage.removeItem("chemora_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, isAuthenticated: Boolean(user), login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
}
