'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRegisterForm } from '@/app/register/_hooks/useRegisterForm';
import type { RegisterFormProps } from './types';

export function RegisterForm({
  loading,
  onSubmit,
  onSwitchToLogin,
  setError,
}: RegisterFormProps) {
  const {
    form,
    setField,
    showPassword,
    toggleShowPassword,
    showConfirmPassword,
    toggleShowConfirmPassword,
    handleSubmit,
  } = useRegisterForm({ onSubmit, setError });

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-grid">
          <div className="field span-2">
            <label className="field-label" htmlFor="r-email">
              Email <span className="req">*</span>
            </label>
            <input
              id="r-email"
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="client@mail.ru"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="r-first">
              Имя <span className="req">*</span>
            </label>
            <input
              id="r-first"
              type="text"
              className="input"
              required
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              placeholder="Иван"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="r-last">
              Фамилия <span className="req">*</span>
            </label>
            <input
              id="r-last"
              type="text"
              className="input"
              required
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              placeholder="Иванов"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="r-middle">
              Отчество
            </label>
            <input
              id="r-middle"
              type="text"
              className="input"
              value={form.middleName}
              onChange={(e) => setField('middleName', e.target.value)}
              placeholder="Иванович"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="r-phone">
              Телефон <span className="req">*</span>
            </label>
            <input
              id="r-phone"
              type="tel"
              className="input"
              required
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+7 900 000-00-00"
            />
          </div>

          <div className="field span-2">
            <label className="field-label" htmlFor="r-pass">
              Пароль <span className="req">*</span>
            </label>
            <div className="relative">
              <input
                id="r-pass"
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                required
                minLength={8}
                aria-describedby="r-pass-hint"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
                onClick={toggleShowPassword}
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span id="r-pass-hint" className="field-hint">Не меньше 8 символов</span>
          </div>

          <div className="field span-2">
            <label className="field-label" htmlFor="r-confirm-pass">
              Подтверждение пароля <span className="req">*</span>
            </label>
            <div className="relative">
              <input
                id="r-confirm-pass"
                type={showConfirmPassword ? 'text' : 'password'}
                className="input pr-10"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
                onClick={toggleShowConfirmPassword}
                title={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg mt-2 w-full justify-center"
        >
          {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
        </button>
      </form>

      <p className="small muted">
        Уже есть аккаунт?{' '}
        <button
          type="button"
          className="linkish"
          onClick={onSwitchToLogin}
        >
          Войти
        </button>{' '}
        · <Link href="/services">Смотреть услуги без входа</Link>
      </p>
    </>
  );
}
