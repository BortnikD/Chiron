'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import type { LoginFormProps } from './types';

const IS_DEMO_BACKEND = Boolean(process.env.NEXT_PUBLIC_API_PROXY_TARGET?.includes(':8081'));
const DEV_ADMIN_EMAIL = IS_DEMO_BACKEND ? 'admin@demo.chiron.local' : 'admin@chiron.local';
const DEV_ADMIN_PASSWORD = IS_DEMO_BACKEND ? 'demoAdmin123' : 'admin123';

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
  onSwitchToRegister,
  isDev,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <form onSubmit={onSubmit} className="col" style={{ gap: '18px' }}>
        <div className="field">
          <label className="field-label" htmlFor="l-email">
            Email
          </label>
          <input
            id="l-email"
            type="email"
            className="input"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.ru"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="l-pass">
            Пароль
          </label>
          <div className="pass-wrap">
            <input
              id="l-pass"
              type={showPassword ? 'text' : 'password'}
              className="input"
              required
              autoComplete="current-password"
              aria-describedby={isDev ? 'l-pass-hint' : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="pass-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? <EyeOff className="ic" /> : <Eye className="ic" />}
            </button>
          </div>
          {isDev && (
            <span id="l-pass-hint" className="field-hint">
              Пароль для тестовых аккаунтов: password123 ({DEV_ADMIN_PASSWORD} для админа)
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg btn-block"
        >
          {loading ? (
            <span>Выполняется вход...</span>
          ) : (
            <>
              <LogIn className="ic" />
              <span>Войти</span>
            </>
          )}
        </button>
      </form>

      {isDev && (
        <p className="small muted">
          Демо-аккаунты: client1@seed.chiron.local, vet2@seed.chiron.local, {DEV_ADMIN_EMAIL}.
        </p>
      )}

      <p className="small muted">
        Нет аккаунта?{' '}
        <button
          type="button"
          className="linkish"
          onClick={onSwitchToRegister}
        >
          Зарегистрироваться
        </button>{' '}
        · <Link href="/services">Смотреть услуги без входа</Link>
      </p>
    </>
  );
}
