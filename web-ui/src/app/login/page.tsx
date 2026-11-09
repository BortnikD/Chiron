'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { AuthHeroMobile } from '../../components/auth/AuthHeroMobile';
import { ApiError } from '../../api/client';
import { isDevMode } from '../../utils/env';
import { LoginForm, RegisterForm, QuickDevLoginPanel, AuthBrandSide, AuthMode, RegisterPayload } from './_components';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, register, isAuthenticated, role } = useAuth();
  const { resolvedTheme } = useTheme();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isDev, setIsDev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dev = isDevMode();
    setIsDev(dev);
    if (dev) { setLoginEmail('client1@seed.chiron.local'); setLoginPassword('password123'); }
  }, []);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') setMode('register');
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !role) return;
    const routes: Record<string, string> = { ADMIN: '/admin/dashboard', VETERINARIAN: '/vet/dashboard' };
    router.replace(routes[role] || '/client/dashboard');
  }, [isAuthenticated, role, router]);

  const handleAuthAction = async (action: () => Promise<void>, fallbackMsg: string) => {
    setError(null);
    setLoading(true);
    try {
      await action();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message || fallbackMsg : err?.message || fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  const performLogin = (email: string, pass: string) =>
    handleAuthAction(() => login({ email, password: pass }), 'Неверный адрес почты или пароль');
  const handleRegister = (payload: RegisterPayload) =>
    handleAuthAction(async () => { await register(payload); router.push('/client/dashboard'); }, 'Ошибка при регистрации');
  const switchMode = (newMode: AuthMode) => { setMode(newMode); setError(null); };
  const handleQuickLogin = (email: string, pass: string) => {
    setLoginEmail(email); setLoginPassword(pass); switchMode('login'); performLogin(email, pass);
  };

  return (
    <div className="app" data-theme={resolvedTheme}>
      <div className="auth-wrap">
        <AuthBrandSide>
          {isDev && <QuickDevLoginPanel disabled={loading} onQuickLogin={handleQuickLogin} />}
        </AuthBrandSide>

        <main className="island auth-main" aria-label="Вход и регистрация">
          <AuthHeroMobile />
          <div className="col auth-form" style={{ gap: '22px', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <div className="row between" style={{ alignItems: 'center' }}>
              <div className="seg" role="tablist" aria-label="Режим">
                <button type="button" className={`seg-item ${mode === 'login' ? 'on font-semibold' : ''}`} onClick={() => switchMode('login')}>Вход</button>
                <button type="button" className={`seg-item ${mode === 'register' ? 'on font-semibold' : ''}`} onClick={() => switchMode('register')}>Регистрация</button>
              </div>
              <ThemeToggle />
            </div>

            <div className="col" style={{ gap: '4px', marginTop: '24px', marginBottom: '20px' }}>
              <h2 className="h1" style={{ fontSize: '24px', fontWeight: 700 }}>{mode === 'login' ? 'Вход в Chiron' : 'Регистрация клиента'}</h2>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                {mode === 'login' ? 'Клиенты, врачи и администраторы входят по email.' : 'Врачей и администраторов добавляет администратор клиники.'}
              </p>
            </div>

            {error && (
              <div className="alert alert-destructive mb-4" role="alert">
                <AlertCircle className="ic" />
                <div>{error}</div>
              </div>
            )}

            {mode === 'login' ? (
              <LoginForm
                email={loginEmail} setEmail={setLoginEmail} password={loginPassword} setPassword={setLoginPassword}
                loading={loading} isDev={isDev} onSwitchToRegister={() => switchMode('register')}
                onSubmit={(e) => { e.preventDefault(); performLogin(loginEmail.trim(), loginPassword); }}
              />
            ) : (
              <RegisterForm
                loading={loading} onSubmit={handleRegister} onSwitchToLogin={() => switchMode('login')} setError={setError}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Загрузка...</div>}>
      <LoginContent />
    </Suspense>
  );
}
