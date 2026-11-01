'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ChironLogo } from '../ui/ChironLogo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Phone, LogIn, User } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const pathname = usePathname();
  const { user, role, isAuthenticated } = useAuth();

  const cabinetHref =
    role === 'ADMIN'
      ? '/admin/dashboard'
      : role === 'VETERINARIAN'
      ? '/vet/dashboard'
      : '/client/dashboard';

  const navLinks = [
    { href: '/', label: 'О клинике' },
    { href: '/services', label: 'Услуги и цены' },
    { href: '/veterinarians', label: 'Наши врачи' },
  ];

  return (
    <header className="island topbar flex items-center justify-between px-4 py-2.5 z-30 mb-2">
      <div className="flex items-center gap-6">
        {/* Логотип и название клиники */}
        <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline">
          <div className="brand-mark bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
            <ChironLogo size={18} />
          </div>
          <div className="flex flex-col">
            <span className="brand-name font-bold text-sm tracking-tight leading-tight">Chiron</span>
            <span className="brand-role text-[10px] text-[var(--muted-foreground)] leading-none">Ветеринарная клиника</span>
          </div>
        </Link>

        {/* Публичные ссылки навигации */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`tab-line px-3 py-1.5 text-xs font-medium rounded-lg text-inherit no-underline transition-colors ${
                  isActive ? 'on font-semibold text-[var(--foreground)] border-b-2 border-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Индикатор доступности сервера */}
        <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mr-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>Сервер доступен</span>
        </span>

        {/* Телефон приёмной */}
        <a
          href="tel:+78632001000"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--primary-text)] font-mono transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-500" />
          <span>+7 863 200-10-00</span>
        </a>

        {/* Переключатель темы */}
        <ThemeToggle />

        {/* Кнопки авторизации */}
        {isAuthenticated ? (
          <Link
            href={cabinetHref}
            className="btn btn-primary text-xs h-8 px-3.5 flex items-center gap-1.5 font-semibold"
          >
            <User className="w-3.5 h-3.5" />
            <span>Личный кабинет</span>
          </Link>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link
              href="/register"
              className="btn btn-ghost text-xs h-8 px-3 hidden sm:inline-flex text-inherit"
            >
              Регистрация
            </Link>
            <Link
              href="/login"
              className="btn btn-primary text-xs h-8 px-3.5 flex items-center gap-1.5 font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Войти</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
