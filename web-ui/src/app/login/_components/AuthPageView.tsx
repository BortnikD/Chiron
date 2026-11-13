'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthHeroMobile } from '@/components/auth/AuthHeroMobile';
import { useLoginForm } from '../_hooks/useLoginForm';
import { AuthBrandSide } from './AuthBrandSide';
import { QuickDevLoginPanel } from './QuickDevLoginPanel';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import type { AuthMode } from './types';

function AuthPageContent({ defaultMode }: { defaultMode: AuthMode }) {
  const { resolvedTheme } = useTheme();
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
    serverFieldErrors,
    clearServerFieldError,
    justRegistered,
    postLoginTarget,
    showExpired,
    showRegisteredBanner,
    switchMode,
    handleLoginSubmit,
    handleRegister,
    handleQuickLogin,
  } = useLoginForm(defaultMode);

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
                  className={`seg-item${mode === 'login' ? ' on' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Вход
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={`seg-item${mode === 'register' ? ' on' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Регистрация
                </button>
              </div>
              <ThemeToggle />
            </div>

            {showExpired && (
              <div className="alert alert-info" role="status">
                <AlertCircle className="ic" />
                <div>
                  <b>Сессия истекла.</b> Войдите снова — токен действует 30 дней.
                </div>
              </div>
            )}

            {showRegisteredBanner && (
              <div className="alert alert-success" role="status">
                <CheckCircle2 className="ic" />
                <div>
                  <b>Аккаунт создан.</b> Войдите с указанным email и паролем.
                </div>
              </div>
            )}

            {mode === 'login' ? (
              <div className="col" style={{ gap: '18px' }}>
                <div className="col auth-form-head">
                  <h2 className="h1 auth-form-title">Вход в Chiron</h2>
                  <p className="muted auth-form-sub">
                    Клиенты, врачи и администраторы входят по email.
                  </p>
                </div>

                {error && (
                  <div className="alert" role="alert">
                    <AlertCircle className="ic" />
                    <div>{error}</div>
                  </div>
                )}

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
              </div>
            ) : justRegistered ? (
              <div className="col" style={{ gap: '14px', alignItems: 'flex-start' }}>
                <div
                  className="empty-art"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}
                >
                  <Check className="ic ic-40" />
                </div>
                <h2 className="h1">Аккаунт создан</h2>
                <p className="muted">
                  Вы вошли как клиент. Добавьте первого питомца, чтобы записаться на приём.
                </p>
                <Link className="btn btn-primary btn-lg" href={postLoginTarget}>
                  Перейти в кабинет
                  <ArrowRight className="ic" />
                </Link>
              </div>
            ) : (
              <div className="col" style={{ gap: '16px' }}>
                <div className="col auth-form-head">
                  <h2 className="h1 auth-form-title">Регистрация клиента</h2>
                  <p className="muted auth-form-sub">
                    Врачей и администраторов добавляет администратор клиники.
                  </p>
                </div>

                {error && (
                  <div className="alert" role="alert">
                    <AlertCircle className="ic" />
                    <div>{error}</div>
                  </div>
                )}

                <RegisterForm
                  loading={loading}
                  onSubmit={handleRegister}
                  onSwitchToLogin={() => switchMode('login')}
                  setError={setError}
                  serverFieldErrors={serverFieldErrors}
                  clearServerFieldError={clearServerFieldError}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthPageView({ defaultMode = 'login' }: { defaultMode?: AuthMode }) {
  return (
    <Suspense
      fallback={
        <div className="app">
          <div className="island grow">
            <div className="empty">
              <span className="spinner" />
              <div className="small muted">Загрузка...</div>
            </div>
          </div>
        </div>
      }
    >
      <AuthPageContent defaultMode={defaultMode} />
    </Suspense>
  );
}
