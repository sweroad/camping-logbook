import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as loginRequest } from "../api/auth";
import { AUTH_EXPIRED_EVENT, getToken, setToken as persistToken } from "../api/client";
import type { UserOut } from "../types/auth";

const USER_KEY = "camping_logbook_user";

interface AuthContextValue {
  user: UserOut | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): UserOut | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserOut;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(() => (getToken() ? loadStoredUser() : null));

  useEffect(() => {
    function handleAuthExpired() {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      async login(username: string, password: string) {
        const response = await loginRequest(username, password);
        persistToken(response.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setUser(response.user);
      },
      logout() {
        persistToken(null);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
