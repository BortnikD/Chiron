'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Clock, MapPin } from 'lucide-react';
import { ChironLogo } from '@/components/ui/ChironLogo';
import { getHomeByRole } from '@/shared/lib';
import type { UserRole } from '@/shared/types';

interface LandingFooterProps {
  isAuthenticated?: boolean;
  role?: UserRole | null;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  isAuthenticated = false,
  role = null,
}) => {
  const bookHref =
    isAuthenticated && role
      ? role === 'CLIENT'
        ? '/client/book'
        : getHomeByRole(role)
      : `/login?next=${encodeURIComponent('/client/book')}`;

  const cabinetHref = isAuthenticated && role ? getHomeByRole(role) : '/login';

  return (
    <footer
      className="island"
      style={{
        flex: 'none',
        padding: '18px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontSize: '13.5px',
      }}
      aria-label="Подвал сайта"
    >
      <div
        className="row between wrap"
        style={{
          gap: '12px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
        }}
      >
        <nav
          className="row wrap"
          style={{ gap: '16px', fontSize: '13.5px', fontWeight: 500 }}
          aria-label="Навигация в подвале"
        >
          <Link href="/" className="muted" style={{ textDecoration: 'none' }}>
            О клинике
          </Link>
          <Link href="/services" className="muted" style={{ textDecoration: 'none' }}>
            Услуги и цены
          </Link>
          <Link href="/veterinarians" className="muted" style={{ textDecoration: 'none' }}>
            Специалисты
          </Link>
          <Link href={bookHref} className="muted" style={{ textDecoration: 'none' }}>
            Запись на приём
          </Link>
          <Link href={cabinetHref} className="muted" style={{ textDecoration: 'none' }}>
            Личный кабинет
          </Link>
        </nav>

        <div className="row wrap" style={{ gap: '16px', fontSize: '13px' }}>
          <div className="row" style={{ gap: '6px' }}>
            <Phone
              className="ic"
              style={{ width: '15px', height: '15px', color: 'var(--primary-text)' }}
              aria-hidden="true"
            />
            <span>+7 863 200-10-00</span>
          </div>
          <div className="row" style={{ gap: '6px' }}>
            <Clock
              className="ic"
              style={{ width: '15px', height: '15px', color: 'var(--primary-text)' }}
              aria-hidden="true"
            />
            <span>Пн–Пт 9:00–18:00, Сб 10:00–15:00</span>
          </div>
        </div>
      </div>

      <div
        className="row between wrap muted"
        style={{
          gap: '8px',
          fontSize: '12.5px',
        }}
      >
        <div className="row" style={{ gap: '6px' }}>
          <MapPin className="ic" style={{ width: '14px', height: '14px' }} aria-hidden="true" />
          <span>г. Ростов-на-Дону, ул. Пушкинская, 100</span>
        </div>
        <div className="row" style={{ gap: '6px' }}>
          <ChironLogo size={15} />
          <span>© 2026 Chiron Veterinary Clinic · Все права защищены</span>
        </div>
      </div>
    </footer>
  );
};
