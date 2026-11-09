'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { RegisterFormData, RegisterFormProps } from './types';

export function RegisterForm({
  loading,
  onSubmit,
  onSwitchToLogin,
  setError,
}: RegisterFormProps) {
  const [form, setForm] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Укажите имя и фамилию');
      return;
    }
    if (!form.email.trim() || !form.phone.trim()) {
      setError('Укажите email и номер телефона');
      return;
    }
    if (form.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    const { confirmPassword: _, ...payload } = form;
    onSubmit({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      ...(payload.middleName?.trim() ? { middleName: payload.middleName.trim() } : {}),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      password: payload.password,
    });
  };

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
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
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
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
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
              onChange={(e) => setForm({ ...form, middleName: e.target.value })}
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
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            <span className="field-hint">Не меньше 8 символов</span>
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
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
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
