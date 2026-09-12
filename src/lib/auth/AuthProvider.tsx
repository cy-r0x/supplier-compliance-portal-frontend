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
import { getCurrentUser, type ApiUser } from "../api/users-api";
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
  updateUser: (patch: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mergeProfile(user: AuthUser, profile: ApiUser): AuthUser {
  return {
    ...user,
    name: profile.name,
    email: profile.email,
    photo: profile.photo,
    role: profile.role,
    organization: profile.organization,
  };
}

async function hydrateUserProfile(user: AuthUser): Promise<AuthUser> {
  try {
    const profile = await getCurrentUser();
    return mergeProfile(user, profile);
  } catch {
    return user;
  }
}

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
    const initial = getUserFromStoredToken();
    if (!initial) {
      setIsLoading(false);
      return;
    }

    setUser(initial);

    void hydrateUserProfile(initial)
      .then(setUser)
      .finally(() => {
        setIsLoading(false);
      });
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

      const hydratedUser = await hydrateUserProfile(nextUser);
      setUser(hydratedUser);
      notifyTokensUpdated(tokens.accessToken, hydratedUser);
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

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, clearSession, updateUser }),
    [user, isLoading, login, logout, clearSession, updateUser],
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
