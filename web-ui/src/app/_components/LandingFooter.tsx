'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Clock, MapPin } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer
      className="island shrink-0"
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
        className="row wrap"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
        }}
      >
        {/* Навигационные ссылки */}
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
          <Link href="/client/book" className="muted" style={{ textDecoration: 'none' }}>
            Запись на приём
          </Link>
          <Link href="/login" className="muted" style={{ textDecoration: 'none' }}>
            Личный кабинет
          </Link>
        </nav>

        {/* Контакты и режим работы */}
        <div className="row wrap" style={{ gap: '16px', fontSize: '13px' }}>
          <div className="row" style={{ gap: '6px' }}>
            <Phone className="ic" style={{ width: '15px', height: '15px', color: 'var(--primary-text)' }} />
            <span>+7 863 200-10-00 (08:00–21:00)</span>
          </div>
          <div className="row" style={{ gap: '6px' }}>
            <Clock className="ic" style={{ width: '15px', height: '15px', color: 'var(--primary-text)' }} />
            <span>Пн–Пт 9:00–21:00, Сб–Вс 10:00–18:00</span>
          </div>
        </div>
      </div>

      {/* Копирайт и локация */}
      <div
        className="row wrap"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--muted-foreground)',
          fontSize: '12.5px',
        }}
      >
        <div className="row" style={{ gap: '6px' }}>
          <MapPin className="ic" style={{ width: '14px', height: '14px' }} />
          <span>г. Ростов-на-Дону, ул. Пушкинская, 100</span>
        </div>
        <div>
          © {new Date().getFullYear()} Chiron Veterinary Clinic · Все права защищены
        </div>
      </div>
    </footer>
  );
};
