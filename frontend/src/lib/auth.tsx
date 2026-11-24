'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { UserDto, AuthResponse } from '@/types';
import { authApi } from '@/lib/api';

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

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      setUserState(response.data);
    } catch {
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (userData: UserDto) => {
    setUserState(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors, still clear local state
    }
    setUserState(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Client-side only helpers
export const clientAuth = {
  login: (user: UserDto) => {
    // Token is stored in httpOnly cookie by backend
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors
    }
    // User state will be cleared by AuthProvider
  },
};