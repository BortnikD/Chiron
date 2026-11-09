'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { LoginFormProps } from './types';

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
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            placeholder="name@example.com"
          />
        </div>

        <div className="field">
          <div className="flex items-center justify-between">
            <label className="field-label" htmlFor="l-pass">
              Пароль
            </label>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              пароль: password123 (admin123 для админа)
            </span>
          </div>
          <div className="relative">
            <input
              id="l-pass"
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg mt-2 w-full justify-center"
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
        <p className="small muted" style={{ marginTop: '14px' }}>
          Демо-аккаунты: client1@seed.chiron.local (клиент), vet2@seed.chiron.local (врач), admin@chiron.local (админ) — пароль password123 (admin123 для админа).
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
