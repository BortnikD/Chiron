'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ChironLogo } from '../ui/ChironLogo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { isDevMode } from '../../utils/env';
import { Info, ClipboardList, Stethoscope, LogIn, ChevronLeft } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const pathname = usePathname();
  const { role, isAuthenticated } = useAuth();
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(isDevMode());
  }, []);

  const cabinetHref =
    role === 'ADMIN'
      ? '/admin/dashboard'
      : role === 'VETERINARIAN'
      ? '/vet/dashboard'
      : '/client/dashboard';

  const isAbout = pathname === '/';
  const isSvc = pathname === '/services';
  const isVets = pathname === '/veterinarians';

  return (
    <header className="island topbar" style={{ flex: 'none' }}>
      {/* Логотип Chiron */}
      <Link href="/" className="brand" style={{ padding: 0, textDecoration: 'none' }}>
        <div className="brand-mark">
          <ChironLogo size={20} />
        </div>
        <span className="brand-name">Chiron</span>
      </Link>

      {/* Сегментированная навигация каталога */}
      <nav className="seg" aria-label="Разделы каталога" style={{ marginLeft: '12px' }}>
        <Link
          href="/"
          className={`seg-item ${isAbout ? 'on' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <Info className="ic" style={{ width: '15px', height: '15px' }} />
          <span>О клинике</span>
        </Link>
        <Link
          href="/services"
          className={`seg-item ${isSvc ? 'on' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <ClipboardList className="ic" style={{ width: '15px', height: '15px' }} />
          <span>Услуги</span>
        </Link>
        <Link
          href="/veterinarians"
          className={`seg-item ${isVets ? 'on' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <Stethoscope className="ic" style={{ width: '15px', height: '15px' }} />
          <span>Врачи</span>
        </Link>
      </nav>

      <div className="spacer" />

      {/* Индикатор доступности сервера (только в Development режиме) */}
      {isDev && (
        <span
          className="row small muted"
          style={{ gap: '6px' }}
          title="GET /actuator/health → UP"
        >
          <span className="dot" />
          <span>Сервер доступен</span>
        </span>
      )}

      {/* Переключатель темы (сегментный) */}
      <ThemeToggle />

      {/* Кнопки входа / возврата в личный кабинет */}
      {isAuthenticated ? (
        <Link href={cabinetHref} className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <ChevronLeft className="ic" style={{ width: '15px', height: '15px' }} />
          <span>Вернуться в кабинет</span>
        </Link>
      ) : (
        <>
          <Link href="/register" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            <span>Регистрация</span>
          </Link>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <LogIn className="ic" style={{ width: '15px', height: '15px' }} />
            <span>Войти</span>
          </Link>
        </>
      )}
    </header>
  );
};
