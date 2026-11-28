'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import type { UserDto } from '@/types';
import { authApi, clearAuthToken } from '@/lib/api';

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: UserDto) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      if (mountedRef.current) {
        setUserState(response.data);
      }
    } catch {
      if (mountedRef.current) {
        setUserState(null);
        clearAuthToken();
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Check if token exists in localStorage before calling me()
    if (typeof window !== 'undefined' && localStorage.getItem('prettynails_token')) {
      refreshUser();
    } else {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
    return () => {
      mountedRef.current = false;
    };
  }, [refreshUser]);

  const login = useCallback((userData: UserDto) => {
    setUserState(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors, still clear local state
    }
    setUserState(null);
    clearAuthToken();
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    refreshUser,
  }), [user, isLoading, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// AdminError Context (shared across admin pages)
export interface AdminError {
  id: string;
  message: string;
  timestamp: number;
}

interface AdminErrorContextType {
  errors: AdminError[];
  addError: (message: string) => void;
  dismissError: (id: string) => void;
  dismissAllErrors: () => void;
  clearErrors: () => void;
}

const AdminErrorContext = createContext<AdminErrorContextType | undefined>(undefined);

const AUTO_DISMISS_DELAY = 10000; // 10 seconds

export function AdminErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AdminError[]>([]);

  const addError = useCallback((message: string) => {
    const newError: AdminError = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      message,
      timestamp: Date.now(),
    };
    setErrors((prev) => [...prev, newError]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const dismissAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const value: AdminErrorContextType = {
    errors,
    addError,
    dismissError,
    dismissAllErrors,
    clearErrors,
  };

  return <AdminErrorContext.Provider value={value}>{children}</AdminErrorContext.Provider>;
}

export function useAdminErrors() {
  const context = useContext(AdminErrorContext);
  if (context === undefined) {
    throw new Error('useAdminErrors must be used within an AdminErrorProvider');
  }
  return context;
}

// Re-export AdminErrorBanner for admin layout
export { AdminErrorBanner } from '@/components/admin/AdminErrorBanner';