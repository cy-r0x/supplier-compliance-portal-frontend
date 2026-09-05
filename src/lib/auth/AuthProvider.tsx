"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { loginRequest, logoutRequest } from "./auth-api";
import {
  notifySessionCleared,
  notifyTokensUpdated,
  registerAuthEventHandlers,
} from "./auth-events";
import type { AuthUser } from "./session";
import { decodeAccessToken, getUserFromStoredToken } from "./session";
import {
  clearTokens,
  getRefreshToken,
  setTokens,
} from "./tokens";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearTokens();
    setUser(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    registerAuthEventHandlers({
      onTokensUpdated: (_accessToken, nextUser) => {
        setUser(nextUser);
      },
      onSessionCleared: () => {
        setUser(null);
        router.replace("/login");
      },
    });
  }, [router]);

  useEffect(() => {
    setUser(getUserFromStoredToken());
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await loginRequest(email, password);
      setTokens(tokens.accessToken, tokens.refreshToken);

      const nextUser = decodeAccessToken(tokens.accessToken);
      if (!nextUser) {
        clearTokens();
        throw new Error("Invalid access token");
      }

      setUser(nextUser);
      notifyTokensUpdated(tokens.accessToken, nextUser);
      router.replace("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await logoutRequest(refreshToken);
    }
    clearTokens();
    setUser(null);
    notifySessionCleared();
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, clearSession }),
    [user, isLoading, login, logout, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
