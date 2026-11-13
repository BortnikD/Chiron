'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/shared/api';
import type { UserRole } from '@/shared/types';
import { formatApiError, getHomeByRole } from '@/shared/lib';
import { isDevMode } from '@/utils/env';
import type {
  AuthMode,
  RegisterField,
  RegisterFieldErrors,
  RegisterPayload,
} from '../_components/types';

const KNOWN_REGISTER_FIELDS = new Set<RegisterField>([
  'email',
  'password',
  'firstName',
  'middleName',
  'lastName',
  'phone',
]);

function translateViolationMessage(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'must not be blank') return 'Обязательное поле';
  if (lower.includes('valid email')) return 'Некорректный email';
  if (lower.includes('international format')) return 'Формат +7…, от 10 до 15 цифр';
  if (lower.includes('at least 8')) return 'Пароль должен содержать не менее 8 символов';
  if (lower.includes('72 bytes')) return 'Пароль не должен превышать 72 байта';
  return trimmed;
}

export function resolvePostAuthTarget(role: UserRole, nextParam: string | null): string {
  const fallback = getHomeByRole(role);
  if (!nextParam) return fallback;
  const trimmed = nextParam.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed === '/login' ||
    trimmed.startsWith('/login?') ||
    trimmed === '/register' ||
    trimmed.startsWith('/register?')
  ) {
    return fallback;
  }
  if (trimmed.startsWith('/admin') && role !== 'ADMIN') return fallback;
  if (trimmed.startsWith('/vet') && role !== 'VETERINARIAN') return fallback;
  if (trimmed.startsWith('/client') && role !== 'CLIENT') return fallback;
  return trimmed;
}

export function useLoginForm(defaultMode: AuthMode = 'login') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { login, register, isAuthenticated, role } = useAuth();

  const urlMode = searchParams.get('mode');
  const nextParam = searchParams.get('next');
  const showExpired = searchParams.get('expired') === 'true';
  const showRegisteredBanner = searchParams.get('registered') === 'true';

  const resolvedInitialMode: AuthMode =
    defaultMode === 'register' || urlMode === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState<AuthMode>(resolvedInitialMode);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isDev, setIsDev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<RegisterFieldErrors>({});
  const [justRegistered, setJustRegistered] = useState(false);

  const registeredInSessionRef = useRef(false);

  useEffect(() => {
    const dev = isDevMode();
    setIsDev(dev);
    if (dev) {
      setLoginEmail('client1@seed.chiron.local');
      setLoginPassword('password123');
    }
  }, []);

  useEffect(() => {
    if (pathname === '/register') {
      setMode('register');
    } else {
      setMode(urlMode === 'register' ? 'register' : defaultMode);
    }
  }, [pathname, urlMode, defaultMode]);

  useEffect(() => {
    if (!isAuthenticated || !role) return;
    if (justRegistered || registeredInSessionRef.current) return;
    router.replace(resolvePostAuthTarget(role, nextParam));
  }, [isAuthenticated, role, justRegistered, nextParam, router]);

  const postLoginTarget = useMemo(
    () => (role ? resolvePostAuthTarget(role, nextParam) : '/client/dashboard'),
    [role, nextParam]
  );

  const performLogin = useCallback(
    async (email: string, pass: string) => {
      setError(null);
      setLoading(true);
      try {
        await login({ email, password: pass });
      } catch (err: unknown) {
        setError(formatApiError(err, 'Неверный email или пароль'));
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const handleLoginSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void performLogin(loginEmail.trim(), loginPassword);
    },
    [loginEmail, loginPassword, performLogin]
  );

  const clearServerFieldError = useCallback((field: RegisterField) => {
    setServerFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleRegister = useCallback(
    async (payload: RegisterPayload) => {
      setError(null);
      setServerFieldErrors({});
      setLoading(true);
      registeredInSessionRef.current = true;
      try {
        await register(payload);
        setJustRegistered(true);
      } catch (err: unknown) {
        registeredInSessionRef.current = false;
        if (err instanceof ApiError) {
          if (Array.isArray(err.violations) && err.violations.length > 0) {
            const mapped: RegisterFieldErrors = {};
            const unmapped: string[] = [];
            for (const v of err.violations) {
              const msg = translateViolationMessage(v.message || '');
              if (!msg) continue;
              if (KNOWN_REGISTER_FIELDS.has(v.field as RegisterField)) {
                mapped[v.field as RegisterField] = msg;
              } else {
                unmapped.push(msg);
              }
            }
            if (Object.keys(mapped).length > 0) {
              setServerFieldErrors(mapped);
            }
            if (unmapped.length > 0 || Object.keys(mapped).length === 0) {
              setError(unmapped.join('; ') || formatApiError(err, 'Ошибка при регистрации'));
            }
            return;
          }
          if (err.status === 409) {
            const lower = err.message.toLowerCase();
            if (lower.includes('email')) {
              setServerFieldErrors({ email: 'Пользователь с таким email уже существует' });
              return;
            }
            if (lower.includes('phone')) {
              setServerFieldErrors({ phone: 'Пользователь с таким телефоном уже существует' });
              return;
            }
          }
        }
        setError(formatApiError(err, 'Ошибка при регистрации'));
      } finally {
        setLoading(false);
      }
    },
    [register]
  );

  const switchMode = useCallback(
    (newMode: AuthMode) => {
      setMode(newMode);
      setError(null);
      setServerFieldErrors({});

      const params = new URLSearchParams(searchParams.toString());
      if (newMode === 'register') {
        params.delete('expired');
        params.delete('registered');
        if (pathname === '/register') return;
        params.set('mode', 'register');
        window.history.replaceState(null, '', `/login?${params.toString()}`);
        return;
      }

      params.delete('mode');
      const query = params.toString();
      const targetUrl = query ? `/login?${query}` : '/login';
      if (pathname === '/register') {
        router.replace(targetUrl);
      } else {
        window.history.replaceState(null, '', targetUrl);
      }
    },
    [pathname, router, searchParams]
  );

  const handleQuickLogin = useCallback(
    (email: string, pass: string) => {
      setLoginEmail(email);
      setLoginPassword(pass);
      switchMode('login');
      void performLogin(email, pass);
    },
    [performLogin, switchMode]
  );

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
    serverFieldErrors,
    clearServerFieldError,
    justRegistered,
    postLoginTarget,
    showExpired: showExpired && mode === 'login',
    showRegisteredBanner: showRegisteredBanner && mode === 'login' && !justRegistered,
    switchMode,
    handleLoginSubmit,
    handleRegister,
    handleQuickLogin,
  };
}
