'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChironLogo } from '../../components/ui/ChironLogo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { AuthHeroMobile } from '../../components/auth/AuthHeroMobile';
import { ApiError } from '../../api/client';
import {
  PawPrint,
  LogIn,
  AlertCircle,
  Phone,
  ClipboardList,
} from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, register, isAuthenticated, role } = useAuth();
  const { resolvedTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Состояние формы входа
  const [loginEmail, setLoginEmail] = useState('anna.kozlova@mail.ru');
  const [loginPassword, setLoginPassword] = useState('chiron2026');

  // Состояние формы регистрации
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'ADMIN') router.replace('/admin/dashboard');
      else if (role === 'VETERINARIAN') router.replace('/vet/dashboard');
      else router.replace('/client/dashboard');
    }
  }, [isAuthenticated, role, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email: loginEmail.trim(), password: loginPassword });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Неверный адрес почты или пароль');
      } else {
        setError(err?.message || 'Не удалось войти в систему');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regForm.firstName.trim() || !regForm.lastName.trim()) {
      setError('Укажите имя и фамилию');
      return;
    }
    if (!regForm.email.trim() || !regForm.phone.trim()) {
      setError('Укажите email и номер телефона');
      return;
    }
    if (regForm.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: regForm.firstName.trim(),
        lastName: regForm.lastName.trim(),
        middleName: regForm.middleName.trim() || undefined,
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        password: regForm.password,
      });
      router.push('/client/dashboard');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Ошибка при регистрации');
      } else {
        setError(err?.message || 'Не удалось зарегистрироваться');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setMode('login');
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
  };

  return (
    <div className="app" data-theme={resolvedTheme}>
      <div className="auth-wrap">
        {/* Левая колонка: визуальный баннер и выбор тестовых ролей */}
        <section className="island auth-side" aria-label="О клинике и демо-режим">
          {/* Фоновые графические эффекты */}
          <div className="hero-fx" aria-hidden="true">
            <div className="hero-grid" />
            <div className="hero-glow" />

            {/* Линия кардиограммы */}
            <svg className="pulse-line" viewBox="0 0 900 110" preserveAspectRatio="none">
              <path
                className="ghost"
                vectorEffect="non-scaling-stroke"
                d="M0 70 H330 L350 70 L364 44 L378 96 L398 12 L420 104 L438 70 H560 L574 56 L588 70 H900"
              />
              <path
                vectorEffect="non-scaling-stroke"
                d="M0 70 H330 L350 70 L364 44 L378 96 L398 12 L420 104 L438 70 H560 L574 56 L588 70 H900"
              />
            </svg>

            {/* Декоративные следы лапок с CSS переменной --r для вращения */}
            <div className="paw" style={{ left: '68%', top: '50%', ['--r' as any]: 'rotate(55deg)', animationDelay: '0s' }}>
              <PawPrint className="w-6 h-6 text-emerald-500/80" />
            </div>
            <div className="paw" style={{ left: '73%', top: '45%', ['--r' as any]: 'rotate(40deg)', animationDelay: '0.6s' }}>
              <PawPrint className="w-6 h-6 text-emerald-500/80" />
            </div>
            <div className="paw" style={{ left: '78%', top: '48%', ['--r' as any]: 'rotate(60deg)', animationDelay: '1.2s' }}>
              <PawPrint className="w-6 h-6 text-emerald-500/80" />
            </div>
            <div className="paw" style={{ left: '83%', top: '42%', ['--r' as any]: 'rotate(45deg)', animationDelay: '1.8s' }}>
              <PawPrint className="w-6 h-6 text-emerald-500/80" />
            </div>
            <div className="paw" style={{ left: '88%', top: '45%', ['--r' as any]: 'rotate(62deg)', animationDelay: '2.4s' }}>
              <PawPrint className="w-6 h-6 text-emerald-500/80" />
            </div>
          </div>

          {/* Логотип Chiron согласно прототипу Main.html */}
          <div className="brand">
            <div className="brand-mark">
              <ChironLogo size={20} />
            </div>
            <div className="col" style={{ gap: 0 }}>
              <span className="brand-name">Chiron</span>
              <span className="brand-role">Ветеринарная клиника</span>
            </div>
          </div>

          {/* Заголовок и описание */}
          <div className="col" style={{ gap: '14px', maxWidth: '520px' }}>
            <h1 style={{ fontSize: '34px', lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.025em' }}>
              Запись к ветеринару, история приёмов и прививки — в одном окне
            </h1>
            <p className="muted" style={{ fontSize: '15px' }}>
              Выберите удобное время у нужного врача, следите за ревакцинацией и получайте уведомления о каждом изменении записи.
            </p>
          </div>

          {/* Быстрый вход для тестирования согласно прототипу */}
          <div className="col" style={{ gap: '10px' }}>
            <div className="row between wrap">
              <span className="section-title">Демо-режим — войти как</span>
              <span className="dev-note">только в прототипе</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fillDemo('anna.kozlova@mail.ru', 'chiron2026')}
                className="card clickable"
                style={{ textAlign: 'left', textDecoration: 'none', color: 'inherit' }}
              >
                <div className="row">
                  <span className="avatar">АК</span>
                  <div className="col" style={{ gap: 0 }}>
                    <span className="cell-main">Клиент</span>
                    <span className="cell-sub">А. С. Козлова · 3 питомца</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('doctor.petrov@chiron.ru', 'chiron2026')}
                className="card clickable"
                style={{ textAlign: 'left', textDecoration: 'none', color: 'inherit' }}
              >
                <div className="row">
                  <span className="avatar">ИП</span>
                  <div className="col" style={{ gap: 0 }}>
                    <span className="cell-main">Ветеринар</span>
                    <span className="cell-sub">И. И. Петров · терапевт</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('admin.volkov@chiron.ru', 'chiron2026')}
                className="card clickable"
                style={{ textAlign: 'left', textDecoration: 'none', color: 'inherit' }}
              >
                <div className="row">
                  <span className="avatar">СВ</span>
                  <div className="col" style={{ gap: 0 }}>
                    <span className="cell-main">Администратор</span>
                    <span className="cell-sub">С. В. Волков</span>
                  </div>
                </div>
              </button>

              <Link
                href="/services"
                className="card clickable"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="row">
                  <span className="avatar">
                    <ClipboardList className="ic" />
                  </span>
                  <div className="col" style={{ gap: 0 }}>
                    <span className="cell-main">Гость</span>
                    <span className="cell-sub">Каталог без входа</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Правая колонка: форма входа / регистрации */}
        <main className="island auth-main" aria-label="Вход и регистрация">
          <AuthHeroMobile />
          <div className="col auth-form" style={{ gap: '22px', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            {/* Режим и тема на одной строке согласно прототипу Main.html */}
            <div className="row between" style={{ alignItems: 'center' }}>
            <div className="seg" role="tablist" aria-label="Режим">
              <button
                type="button"
                className={`seg-item ${mode === 'login' ? 'on font-semibold' : ''}`}
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
              >
                Вход
              </button>
              <button
                type="button"
                className={`seg-item ${mode === 'register' ? 'on font-semibold' : ''}`}
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
              >
                Регистрация
              </button>
            </div>

            <ThemeToggle />
          </div>

          {/* Заголовки экрана */}
          {mode === 'login' ? (
            <div className="col" style={{ gap: '4px', marginTop: '24px', marginBottom: '20px' }}>
              <h2 className="h1" style={{ fontSize: '24px', fontWeight: 700 }}>
                Вход в Chiron
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                Клиенты, врачи и администраторы входят по email.
              </p>
            </div>
          ) : (
            <div className="col" style={{ gap: '4px', marginTop: '24px', marginBottom: '20px' }}>
              <h2 className="h1" style={{ fontSize: '24px', fontWeight: 700 }}>
                Регистрация клиента
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                Врачей и администраторов добавляет администратор клиники.
              </p>
            </div>
          )}

          {error && (
            <div className="alert alert-destructive mb-4" role="alert">
              <AlertCircle className="ic" />
              <div>{error}</div>
            </div>
          )}

          {/* ФОРМА ВХОДА */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className="field">
                <div className="flex items-center justify-between">
                  <label className="field-label" htmlFor="l-pass">
                    Пароль
                  </label>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    пароль по умолчанию: chiron2026
                  </span>
                </div>
                <input
                  id="l-pass"
                  type="password"
                  className="input"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                />
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
          )}

          {/* ФОРМА РЕГИСТРАЦИИ */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="client@mail.ru"
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="r-pass">
                    Пароль <span className="req">*</span>
                  </label>
                  <input
                    id="r-pass"
                    type="password"
                    className="input"
                    required
                    minLength={8}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <span className="field-hint">Не меньше 8 символов</span>
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
                    value={regForm.firstName}
                    onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                    placeholder="Иван"
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
                    value={regForm.middleName}
                    onChange={(e) => setRegForm({ ...regForm, middleName: e.target.value })}
                    placeholder="Иванович"
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
                    value={regForm.lastName}
                    onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                    placeholder="Иванов"
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
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+7 900 000-00-00"
                  />
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
          )}

            <p className="small muted" style={{ marginTop: '14px' }}>
              Демо-аккаунты: anna.kozlova@mail.ru, doctor.petrov@chiron.ru, admin.volkov@chiron.ru — пароль любой от 8 символов.
            </p>
            <p className="small muted">
              {mode === 'login' ? (
                <>
                  Нет аккаунта?{' '}
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                  >
                    Зарегистрироваться
                  </button>{' '}
                  · <Link href="/services">Смотреть услуги без входа</Link>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                  >
                    Войти
                  </button>{' '}
                  · <Link href="/services">Смотреть услуги без входа</Link>
                </>
              )}
            </p>
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
