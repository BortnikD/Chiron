'use client';

import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRegisterForm } from '@/app/register/_hooks/useRegisterForm';
import type { RegisterFormProps } from './types';

export function RegisterForm({
  loading,
  onSubmit,
  onSwitchToLogin,
  setError,
  serverFieldErrors,
  clearServerFieldError,
}: RegisterFormProps) {
  const {
    form,
    errors,
    setField,
    showPassword,
    toggleShowPassword,
    showConfirmPassword,
    toggleShowConfirmPassword,
    handleSubmit,
  } = useRegisterForm({
    onSubmit,
    setError,
    serverFieldErrors,
    clearServerFieldError,
  });

  return (
    <>
      <form onSubmit={handleSubmit} className="col" style={{ gap: '16px' }} noValidate>
        <div className="form-grid">
          <div className="field span-2">
            <label className="field-label" htmlFor="r-email">
              Email <span className="req">*</span>
            </label>
            <input
              id="r-email"
              type="email"
              className={`input${errors.email ? ' invalid' : ''}`}
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="name@example.ru"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field span-2">
            <label className="field-label" htmlFor="r-pass">
              Пароль <span className="req">*</span>
            </label>
            <div className="pass-wrap">
              <input
                id="r-pass"
                type={showPassword ? 'text' : 'password'}
                className={`input${errors.password ? ' invalid' : ''}`}
                autoComplete="new-password"
                aria-describedby="r-pass-hint"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={toggleShowPassword}
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="ic" /> : <Eye className="ic" />}
              </button>
            </div>
            {errors.password ? (
              <span className="field-error">{errors.password}</span>
            ) : (
              <span id="r-pass-hint" className="field-hint">
                Не меньше 8 символов
              </span>
            )}
          </div>

          <div className="field span-2">
            <label className="field-label" htmlFor="r-confirm-pass">
              Подтверждение пароля <span className="req">*</span>
            </label>
            <div className="pass-wrap">
              <input
                id="r-confirm-pass"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`input${errors.confirmPassword ? ' invalid' : ''}`}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={toggleShowConfirmPassword}
                title={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showConfirmPassword ? <EyeOff className="ic" /> : <Eye className="ic" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="r-first">
              Имя <span className="req">*</span>
            </label>
            <input
              id="r-first"
              type="text"
              className={`input${errors.firstName ? ' invalid' : ''}`}
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              placeholder="Иван"
            />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="r-middle">
              Отчество
            </label>
            <input
              id="r-middle"
              type="text"
              className={`input${errors.middleName ? ' invalid' : ''}`}
              autoComplete="additional-name"
              value={form.middleName}
              onChange={(e) => setField('middleName', e.target.value)}
              placeholder="Иванович"
            />
            {errors.middleName && <span className="field-error">{errors.middleName}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="r-last">
              Фамилия <span className="req">*</span>
            </label>
            <input
              id="r-last"
              type="text"
              className={`input${errors.lastName ? ' invalid' : ''}`}
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              placeholder="Иванов"
            />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="r-phone">
              Телефон <span className="req">*</span>
            </label>
            <input
              id="r-phone"
              type="tel"
              className={`input${errors.phone ? ' invalid' : ''}`}
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+7 900 000-00-00"
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg btn-block"
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
