import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthServiceUnavailableError, authService, type AuthUser } from './authService';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyError(error: unknown) {
  if (error instanceof AuthServiceUnavailableError) return error.message;
  return 'We couldn’t sign you in. Check your details and try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authService.getCurrentSession().then(session => {
      if (!active) return;
      setUser(session?.user ?? null);
      setStatus(session ? 'authenticated' : 'unauthenticated');
    }).catch(() => {
      if (!active) return;
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const session = await authService.login({ identifier, password });
      setUser(session.user);
      setStatus('authenticated');
      return true;
    } catch (reason) {
      setUser(null);
      setStatus('unauthenticated');
      setError(friendlyError(reason));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setError(null);
    setStatus('unauthenticated');
    try { await authService.logout(); } catch { /* Local sign-out still completes. */ }
  }, []);

  const value = useMemo(() => ({ status, user, loading, error, signIn, signOut }), [status, user, loading, error, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
