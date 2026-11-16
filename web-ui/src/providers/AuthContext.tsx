'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User, UserRole } from '@/shared/types';
import { authApi, userApi, tokenStorage, ApiError } from '@/shared/api';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  middleName?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    setAuthError(null);
    try {
      const me = await userApi.getMe();
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        tokenStorage.clear();
        setToken(null);
        setUser(null);
      } else {
        setAuthError(
          err instanceof Error ? err.message : 'Не удалось проверить текущую сессию'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = tokenStorage.get();
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authApi.login(credentials);
      tokenStorage.set(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authApi.register(data);
      tokenStorage.set(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('chiron:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('chiron:unauthorized', handleUnauthorized);
  }, [logout]);

  const refreshUser = useCallback(async () => {
    if (tokenStorage.get()) {
      await fetchCurrentUser();
    }
  }, [fetchCurrentUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user?.role || null,
      token,
      isAuthenticated: !!user,
      isLoading,
      authError,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, authError, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
