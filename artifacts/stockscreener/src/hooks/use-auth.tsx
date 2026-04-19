import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { setOnUnauthorized, customFetch } from "@/lib/api-client";

interface User {
  email: string;
  fullName: string;
}

interface UserDto {
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, repeatPassword: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "tt_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse saved user:", e);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<boolean> | null>(null);
  const [, setLocation] = useLocation();

  const saveAuth = (userData: User) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error("Failed to save auth data:", e);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    if (isRefreshing.current) {
      return refreshPromise.current || false;
    }

    isRefreshing.current = true;
    refreshPromise.current = (async () => {
      try {
        await customFetch("/api/v1/auth/refresh", {
          method: "POST",
        });
        return true;
      } catch (err) {
        console.error("Token refresh failed:", err);
        clearAuth();
        return false;
      } finally {
        isRefreshing.current = false;
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  };

  useEffect(() => {
    setOnUnauthorized(refreshToken);
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshToken();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await customFetch<UserDto>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveAuth(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, repeatPassword: string, fullName: string) => {
    setIsLoading(true);
    try {
      await customFetch("/api/v1/auth/registration", {
        method: "POST",
        body: JSON.stringify({ email, password, repeatPassword, fullName }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await customFetch("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    clearAuth();
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
