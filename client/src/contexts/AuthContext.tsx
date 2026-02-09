"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await authService.getMe();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setIsReady(true);
      }
    };

    loadUser();
  }, []);

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
