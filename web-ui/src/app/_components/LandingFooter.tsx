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

export const LandingFooter: React.FC<LandingFooterProps> = () => {
  return (
    <footer
      className="island"
      style={{
        flex: 'none',
        padding: '14px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '13px',
      }}
      aria-label="Подвал сайта"
    >
      <div
        className="row between wrap"
        style={{
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div className="row wrap" style={{ gap: '16px', color: 'var(--muted-foreground)' }}>
          <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
            <MapPin className="ic" style={{ width: '14px', height: '14px' }} aria-hidden="true" />
            <span>г. Ростов-на-Дону, ул. Пушкинская, 100</span>
          </div>
          <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
            <ChironLogo size={14} />
            <span>© 2026 Chiron Veterinary Clinic</span>
          </div>
        </div>

        <div className="row wrap" style={{ gap: '16px', fontSize: '13px', alignItems: 'center' }}>
          <a
            href="tel:+78632001000"
            className="row text-foreground hover:underline"
            style={{ gap: '6px', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}
            aria-label="Позвонить в клинику: +7 863 200-10-00"
          >
            <Phone
              className="ic"
              style={{ width: '15px', height: '15px', color: 'var(--primary-text)' }}
              aria-hidden="true"
            />
            <span>+7 863 200-10-00</span>
          </a>
          <div className="row" style={{ gap: '6px', color: 'var(--muted-foreground)', alignItems: 'center' }}>
            <Clock
              className="ic"
              style={{ width: '15px', height: '15px', color: 'var(--primary-text)' }}
              aria-hidden="true"
            />
            <span>Пн–Пт 9:00–18:00, Сб 10:00–15:00</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
