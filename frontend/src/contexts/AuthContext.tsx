import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { session, unauthorizedEvent } from "../api/session";
import type { User } from "../types/api";

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<User>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const logout = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      navigate("/login", { replace: true, state: { sessionExpired: true } });
    };
    window.addEventListener(unauthorizedEvent, onUnauthorized);
    return () => window.removeEventListener(unauthorizedEvent, onUnauthorized);
  }, [logout, navigate]);

  const value = useMemo<AuthValue>(() => ({
    user,
    isAuthenticated: Boolean(session.token && user),
    async login(email, password) {
      const token = await api.login({ email, password });
      session.setToken(token.access_token);
      try {
        const currentUser = await api.me();
        setUser(currentUser);
        return currentUser;
      } catch (error) {
        session.clear();
        throw error;
      }
    },
    async register(name, email, password) {
      await api.register({ name, email, password });
    },
    logout,
  }), [logout, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used under AuthProvider");
  return context;
}
