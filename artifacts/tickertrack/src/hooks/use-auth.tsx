import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { setAuthTokenGetter, setOnUnauthorized, customFetch, setBaseUrl } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface UserDto {
  token: string;
  refreshToken: string;
}

interface UserRegistrationRespondDto {
  id: string;
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

const TOKEN_KEY = "tt_token";
const REFRESH_TOKEN_KEY = "tt_refresh_token";
const USER_KEY = "tt_user";

// Configure API client
setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));

if (import.meta.env.PROD) {
  setBaseUrl(import.meta.env.VITE_API_URL || "https://core-production-bdad.up.railway.app");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<boolean> | null>(null);
  const [, setLocation] = useLocation();

  // Helper to save tokens and user
  const saveAuth = (tokens: UserDto, userData?: User) => {
    localStorage.setItem(TOKEN_KEY, tokens.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    if (isRefreshing.current) {
      return refreshPromise.current || false;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!token || !refreshTokenValue) {
      return false;
    }

    isRefreshing.current = true;
    refreshPromise.current = (async () => {
      try {
        const res = await customFetch<UserDto>("/api/v1/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ token, refreshToken: refreshTokenValue }), 
        });

        if (res) {
          saveAuth(res);
          return true;
        } else {
          clearAuth();
          return false;
        }
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

  // Register unauthorized handler
  useEffect(() => {
    setOnUnauthorized(refreshToken);
    return () => setOnUnauthorized(null);
  }, []);

  // Initial check and periodic refresh setup
  useEffect(() => {
    const interval = setInterval(() => {
      if (localStorage.getItem(TOKEN_KEY)) {
        refreshToken();
      }
    }, 10 * 60 * 1000); // every 10 mins

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const tokens = await customFetch<UserDto>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Since login only returns tokens, we might need another API to get user info 
      // or we can deduce user info from the JWT if needed. 
      // For now, let's create a minimal user object based on the email we have.
      const userData: User = {
        id: "temp-id", // Usually should come from backend
        email: email,
        fullName: email.split("@")[0], // Fallback since login response doesn't have it
      };
      
      saveAuth(tokens, userData);
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

      // Registration returns UserRegistrationRespondDto
      // The user still needs to login after registration based on the description "after which the user can log in and continue working"
      // Wait, usually it returns tokens too but here it says user receives UUID, email, fullName and then can login.
      // So no auto-login here.
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);

      await customFetch("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ token, refreshToken: refreshTokenValue }),
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
