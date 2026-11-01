'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ChironLogo } from '../../components/ui/ChironLogo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ApiError } from '../../api/client';
import {
  PawPrint,
  LogIn,
  UserPlus,
  AlertCircle,
  Phone,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, register, isAuthenticated, role } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Состояние формы входа
  const [loginEmail, setLoginEmail] = useState('anna.kozlova@mail.ru');
  const [loginPassword, setLoginPassword] = useState('chiron2026');

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

  // Если пользователь уже авторизован, перенаправляем в соответствующий кабинет
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'ADMIN') router.push('/admin/dashboard');
      else if (role === 'VETERINARIAN') router.push('/vet/dashboard');
      else router.push('/client/dashboard');
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

  // Быстрое переключение тестовых аккаунтов
  const fillDemo = (email: string, pass: string) => {
    setMode('login');
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full h-full min-h-screen p-2 gap-2 bg-[var(--background)]">
      {/* Левая колонка: визуальный баннер и выбор тестовых ролей */}
      <section className="island auth-side flex-1 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden">
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

          {/* Декоративные следы лапок */}
          <div className="paw" style={{ left: '68%', top: '50%', transform: 'rotate(55deg)', animationDelay: '0s' }}>
            <PawPrint className="w-6 h-6 text-emerald-500/80" />
          </div>
          <div className="paw" style={{ left: '73%', top: '45%', transform: 'rotate(40deg)', animationDelay: '0.6s' }}>
            <PawPrint className="w-6 h-6 text-emerald-500/80" />
          </div>
          <div className="paw" style={{ left: '78%', top: '48%', transform: 'rotate(60deg)', animationDelay: '1.2s' }}>
            <PawPrint className="w-6 h-6 text-emerald-500/80" />
          </div>
          <div className="paw" style={{ left: '83%', top: '42%', transform: 'rotate(45deg)', animationDelay: '1.8s' }}>
            <PawPrint className="w-6 h-6 text-emerald-500/80" />
          </div>
          <div className="paw" style={{ left: '88%', top: '45%', transform: 'rotate(62deg)', animationDelay: '2.4s' }}>
            <PawPrint className="w-6 h-6 text-emerald-500/80" />
          </div>
        </div>

        {/* Логотип клиники */}
        <div className="flex items-center gap-3 z-10">
          <div className="brand-mark bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl w-10 h-10 flex items-center justify-center shrink-0 shadow-md">
            <ChironLogo size={22} />
          </div>
          <div>
            <span className="brand-name font-extrabold text-xl tracking-tight block leading-tight">Chiron</span>
            <span className="brand-role text-xs text-[var(--muted-foreground)]">Ветеринарная клиника</span>
          </div>
        </div>

        {/* Заголовок и описание сервиса */}
        <div className="flex flex-col gap-4 max-w-xl my-8 z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[var(--foreground)]">
            Запись к ветеринару, история приёмов и прививки — в одном окне
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
            Выберите удобное время у нужного врача, следите за графиком ревакцинации питомцев и получайте прозрачную историю посещений.
          </p>
        </div>

        {/* Карточки быстрого выбора тестовой роли */}
        <div className="flex flex-col gap-3 z-10">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">
            <span>Быстрый вход для тестирования</span>
            <span className="text-[11px] font-normal lowercase">нажмите для автозаполнения</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('anna.kozlova@mail.ru', 'chiron2026')}
              className="card clickable p-3 text-left hover:border-[var(--primary)] transition-all bg-[var(--card)]/90 backdrop-blur-xs"
            >
              <div className="flex items-center gap-3">
                <span className="avatar w-9 h-9 text-xs font-bold shrink-0 bg-blue-500/15 text-blue-500">АК</span>
                <div className="flex flex-col min-w-0">
                  <span className="cell-main text-xs font-bold truncate">Клиент</span>
                  <span className="cell-sub text-[11px] text-[var(--muted-foreground)] truncate">
                    А. С. Козлова · 3 питомца
                  </span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('ivan.petrov@chiron.vet', 'chiron2026')}
              className="card clickable p-3 text-left hover:border-[var(--primary)] transition-all bg-[var(--card)]/90 backdrop-blur-xs"
            >
              <div className="flex items-center gap-3">
                <span className="avatar w-9 h-9 text-xs font-bold shrink-0 bg-emerald-500/15 text-emerald-500">ИП</span>
                <div className="flex flex-col min-w-0">
                  <span className="cell-main text-xs font-bold truncate">Ветеринар</span>
                  <span className="cell-sub text-[11px] text-[var(--muted-foreground)] truncate">
                    И. И. Петров · терапевт
                  </span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('admin@chiron.vet', 'chiron2026')}
              className="card clickable p-3 text-left hover:border-[var(--primary)] transition-all bg-[var(--card)]/90 backdrop-blur-xs"
            >
              <div className="flex items-center gap-3">
                <span className="avatar w-9 h-9 text-xs font-bold shrink-0 bg-purple-500/15 text-purple-500">АД</span>
                <div className="flex flex-col min-w-0">
                  <span className="cell-main text-xs font-bold truncate">Администратор</span>
                  <span className="cell-sub text-[11px] text-[var(--muted-foreground)] truncate">
                    Администрация клиники
                  </span>
                </div>
              </div>
            </button>

            <Link
              href="/services"
              className="card clickable p-3 text-left hover:border-[var(--primary)] transition-all bg-[var(--card)]/90 backdrop-blur-xs text-inherit no-underline"
            >
              <div className="flex items-center gap-3">
                <span className="avatar w-9 h-9 text-xs font-bold shrink-0 bg-amber-500/15 text-amber-500">
                  <ClipboardList className="w-4 h-4" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="cell-main text-xs font-bold truncate">Услуги и врачи</span>
                  <span className="cell-sub text-[11px] text-[var(--muted-foreground)] truncate">
                    Каталог клиники без входа
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              Приёмная: +7 863 200-10-00
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Сервер доступен
            </span>
          </div>
        </div>
      </section>

      {/* Правая колонка: форма входа / регистрации */}
      <section className="island w-full lg:w-[460px] p-6 sm:p-8 flex flex-col justify-between shrink-0">
        <div>
          {/* Верхняя панель с переключателем темы */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              {mode === 'login' ? 'Авторизация' : 'Создание аккаунта'}
            </div>
            <ThemeToggle />
          </div>

          {/* Переключатель: Войти / Регистрация */}
          <div className="seg my-5 w-full">
            <button
              type="button"
              className={`seg-item flex-1 ${mode === 'login' ? 'on font-semibold' : ''}`}
              onClick={() => {
                setMode('login');
                setError(null);
              }}
            >
              Войти
            </button>
            <button
              type="button"
              className={`seg-item flex-1 ${mode === 'register' ? 'on font-semibold' : ''}`}
              onClick={() => {
                setMode('register');
                setError(null);
              }}
            >
              Регистрация
            </button>
          </div>

          {error && (
            <div className="alert p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Форма авторизации */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="field">
                <label className="field-label text-xs">
                  Электронная почта <span className="req">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field-label text-xs flex items-center justify-between">
                  <span>Пароль <span className="req">*</span></span>
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full mt-2 h-10 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Выполняется вход...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Войти в систему</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Форма регистрации */
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="field">
                  <label className="field-label text-xs">
                    Имя <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.firstName}
                    onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                    placeholder="Анна"
                    className="input"
                  />
                </div>
                <div className="field">
                  <label className="field-label text-xs">
                    Фамилия <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.lastName}
                    onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                    placeholder="Козлова"
                    className="input"
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label text-xs">Отчество (необязательно)</label>
                <input
                  type="text"
                  value={regForm.middleName}
                  onChange={(e) => setRegForm({ ...regForm, middleName: e.target.value })}
                  placeholder="Сергеевна"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field-label text-xs">
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="anna@example.com"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field-label text-xs">
                  Телефон <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="+7 (900) 000-00-00"
                  className="input font-mono"
                />
              </div>

              <div className="field">
                <label className="field-label text-xs">
                  Пароль <span className="req">*</span>
                  <span className="field-hint text-[10px] ml-1">(от 8 символов)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="input font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full mt-3 h-10 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Регистрация...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Зарегистрироваться</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Подвал с контактами клиники */}
        <div className="pt-6 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
          <Link href="/services" className="linkish text-xs inline-flex items-center gap-1">
            <span>Перейти к просмотру услуг без входа</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка...</div>}>
      <LoginContent />
    </Suspense>
  );
}
