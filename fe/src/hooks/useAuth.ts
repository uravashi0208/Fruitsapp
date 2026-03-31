/**
 * src/hooks/useAuth.ts
 *
 * Central auth state for storefront.
 * - Reads JWT from sessionStorage on load
 * - Exposes: user, isLoggedIn, login, logout, openAuthModal
 * - Used in Navbar, CheckoutPage, AccountPage, etc.
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { getAccessToken, clearTokens } from '../api/client';
import type { AuthUser, AuthMode } from '../components/ui/AuthModal';
import api from '../api/client';

// ─── Context type ─────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  /** Open login/register modal from anywhere in the app */
  openAuthModal: (mode?: AuthMode) => void;
  authModalOpen: boolean;
  authModalMode: AuthMode;
  closeAuthModal: () => void;
}

// ─── Context (default = logged-out state) ─────────────────────
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  loading: true,
  login: () => {},
  logout: () => {},
  openAuthModal: () => {},
  authModalOpen: false,
  authModalMode: 'login',
  closeAuthModal: () => {},
});

// ─── Provider state hook (used in App.tsx StorefrontShell) ────
export function useAuthState(): AuthContextValue {
  const [user, setUser]          = useState<AuthUser | null>(null);
  const [loading, setLoading]    = useState(true);
  const [authModalOpen, setOpen] = useState(false);
  const [authModalMode, setMode] = useState<AuthMode>('login');

  // Restore session from existing JWT on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    api.get<{ success: boolean; data: AuthUser }>('/api/auth/me')
      .then(res => { if (res.success) setUser(res.data); })
      .catch(() => { clearTokens(); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const openAuthModal = useCallback((mode: AuthMode = 'login') => {
    setMode(mode);
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setOpen(false), []);

  return {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
    openAuthModal,
    authModalOpen,
    authModalMode,
    closeAuthModal,
  };
}

// ─── Consumer hook — use this anywhere in the storefront ──────
export const useAuth = () => useContext(AuthContext);