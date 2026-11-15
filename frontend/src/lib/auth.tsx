'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { UserDto, AuthResponse } from '@/types';
import { getToken, getUser, setToken, setUser, removeToken, isAuthenticated, isAdmin } from '@/lib/api';

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: UserDto) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUserState(null);
      setIsLoading(false);
      return;
    }

    try {
      // Import api dynamically to avoid SSR issues
      const { authApi } = await import('@/lib/api');
      const response = await authApi.me();
      setUserState(response.data);
      setUser(response.data);
    } catch {
      removeToken();
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: UserDto) => {
    setToken(token);
    setUser(userData);
    setUserState(userData);
  };

  const logout = () => {
    removeToken();
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
  getToken,
  getUser,
  isAuthenticated,
  isAdmin,
  login: (token: string, user: UserDto) => {
    setToken(token);
    setUser(user);
  },
  logout: removeToken,
};