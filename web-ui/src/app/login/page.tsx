'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthHeroMobile } from '@/components/auth/AuthHeroMobile';
import { useLoginForm } from './_hooks/useLoginForm';
import { AuthBrandSide } from './_components/AuthBrandSide';
import { QuickDevLoginPanel } from './_components/QuickDevLoginPanel';
import { LoginForm } from './_components/LoginForm';
import { RegisterForm } from './_components/RegisterForm';

function LoginContent() {
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const {
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
  } = useLoginForm(initialMode);

  return (
    <div className="app" data-theme={resolvedTheme}>
      <div className="auth-wrap">
        <AuthBrandSide>
          {isDev && <QuickDevLoginPanel disabled={loading} onQuickLogin={handleQuickLogin} />}
        </AuthBrandSide>

        <main className="island auth-main" aria-label="Вход и регистрация">
          <AuthHeroMobile />
          <div className="col auth-form">
            <div className="auth-form-top">
              <div className="seg" role="tablist" aria-label="Режим">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`seg-item ${mode === 'login' ? 'on font-semibold' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Вход
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={`seg-item ${mode === 'register' ? 'on font-semibold' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Регистрация
                </button>
              </div>
              <ThemeToggle />
            </div>

            <div className="col auth-form-head">
              <h2 className="h1 auth-form-title">
                {mode === 'login' ? 'Вход в Chiron' : 'Регистрация клиента'}
              </h2>
              <p className="muted auth-form-sub">
                {mode === 'login'
                  ? 'Клиенты, врачи и администраторы входят по email.'
                  : 'Врачей и администраторов добавляет администратор клиники.'}
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
                email={loginEmail}
                setEmail={setLoginEmail}
                password={loginPassword}
                setPassword={setLoginPassword}
                loading={loading}
                isDev={isDev}
                onSwitchToRegister={() => switchMode('register')}
                onSubmit={handleLoginSubmit}
              />
            ) : (
              <RegisterForm
                loading={loading}
                onSubmit={handleRegister}
                onSwitchToLogin={() => switchMode('login')}
                setError={setError}
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
