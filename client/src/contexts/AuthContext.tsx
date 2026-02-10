"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { User, UserRole } from "@/types/user";
import * as authService from "@/services/authService";

interface AuthState {
  user: User | null;
  isReady: boolean;
  login: (payload: {
    email: string;
    password: string;
    role?: UserRole;
  }) => Promise<void>;
  loginGuest: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const guestInitInFlight = useRef(false);
  const guestSuppressKey = "suppress_guest_autologin";
  const isPublicGuestRoute = pathname.startsWith("/product");

  useEffect(() => {
    const loadUser = async () => {
      try {
        // First, try to get authenticated user
        const me = await authService.getMe();
        setUser(me);
      } catch {
        // No authenticated user; defer guest init to route-aware effect
        setUser(null);
      } finally {
        setIsReady(true);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!isReady || user) return;

    if (typeof window !== "undefined") {
      const suppressGuest = sessionStorage.getItem(guestSuppressKey) === "1";
      if (suppressGuest) {
        sessionStorage.removeItem(guestSuppressKey);
        return;
      }
    }

    if (!isPublicGuestRoute || guestInitInFlight.current) return;

    guestInitInFlight.current = true;
    authService
      .initGuestToken()
      .then(({ user: guestUser, guestToken }) => {
        setUser(guestUser);
        authService.storeGuestToken(guestToken);
      })
      .catch((guestError) => {
        console.error("Failed to initialize guest token:", guestError);
        setUser(null);
      })
      .finally(() => {
        guestInitInFlight.current = false;
      });
  }, [isReady, user, isPublicGuestRoute]);

  const refreshUser = async () => {
    const me = await authService.getMe();
    setUser(me);
  };

  const login = async (payload: {
    email: string;
    password: string;
    role?: UserRole;
  }) => {
    const nameFromEmail = payload.email.split("@")[0] || "User";
    const nextUser = await authService.login({
      email: payload.email,
      password: payload.password,
      role: payload.role,
      name: nameFromEmail,
    });
    setUser(nextUser);
  };

  const loginGuest = async () => {
    const nextUser = await authService.loginGuest();
    setUser(nextUser);
  };

  const logout = async () => {
    await authService.logout();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(guestSuppressKey, "1");
    }
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isReady, login, loginGuest, logout, refreshUser }),
    [user, isReady, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
