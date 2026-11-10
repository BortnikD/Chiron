'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isDevMode } from '@/utils/env';
import { formatApiError, getHomeByRole } from '@/shared/lib';
import type { AuthMode, RegisterPayload } from '../_components/types';

export function useLoginForm(initialMode: AuthMode = 'login') {
  const router = useRouter();
  const { login, register, isAuthenticated, role } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isDev, setIsDev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dev = isDevMode();
    setIsDev(dev);
    if (dev) {
      setLoginEmail('client1@seed.chiron.local');
      setLoginPassword('password123');
    }
  }, []);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!isAuthenticated || !role) return;
    router.replace(getHomeByRole(role));
  }, [isAuthenticated, role, router]);

  const handleAuthAction = async (action: () => Promise<void>, fallbackMsg: string) => {
    setError(null);
    setLoading(true);
    try {
      await action();
    } catch (err: unknown) {
      setError(formatApiError(err, fallbackMsg));
    } finally {
      setLoading(false);
    }
  };

  const performLogin = (email: string, pass: string) =>
    handleAuthAction(() => login({ email, password: pass }), 'Неверный адрес почты или пароль');

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    performLogin(loginEmail.trim(), loginPassword);
  };

  const handleRegister = (payload: RegisterPayload) =>
    handleAuthAction(async () => {
      await register(payload);
      router.push('/client/dashboard');
    }, 'Ошибка при регистрации');

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    switchMode('login');
    performLogin(email, pass);
  };

  return {
    mode,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    isDev,
    loading,
    error,
    setError,
    switchMode,
    handleLoginSubmit,
    handleRegister,
    handleQuickLogin,
  };
}
