'use client';

import type { CSSProperties } from 'react';
import { PawPrint } from 'lucide-react';
import { ChironLogo } from '@/components/ui/ChironLogo';
import { EcgPulseSvg, HeroPetsSvg } from '@/components/ui/HeroPetsSvg';
import type { AuthBrandSideProps } from './types';

type PawStyle = CSSProperties & { '--r': string };

const PAW_PRINTS: ReadonlyArray<PawStyle> = [
  { left: '54%', top: '16%', '--r': 'rotate(48deg)', animationDelay: '0s' },
  { left: '61%', top: '12%', '--r': 'rotate(36deg)', animationDelay: '0.6s' },
  { left: '68%', top: '15%', '--r': 'rotate(54deg)', animationDelay: '1.2s' },
  { left: '75%', top: '11%', '--r': 'rotate(40deg)', animationDelay: '1.8s' },
  { left: '82%', top: '14%', '--r': 'rotate(58deg)', animationDelay: '2.4s' },
];

export function AuthBrandSide({ children }: AuthBrandSideProps) {
  return (
    <section className="island auth-side" aria-label="О клинике и демо-режим">
      <div className="hero-fx" aria-hidden="true">
        <div className="hero-grid" />
        <div className="hero-glow" />

        {PAW_PRINTS.map((pawStyle, index) => (
          <div key={index} className="paw" style={pawStyle}>
            <PawPrint aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="brand">
        <div className="brand-mark">
          <ChironLogo size={20} />
        </div>
        <div className="col" style={{ gap: 0 }}>
          <span className="brand-name">Chiron</span>
          <span className="brand-role">Ветеринарная клиника</span>
        </div>
      </div>

      <div className="auth-side-hero">
        <EcgPulseSvg className="pulse-line auth-side-pulse" />

        <div className="col auth-side-copy">
          <h1 className="auth-side-title">
            Запись к ветеринару, история приёмов и прививки — в одном окне
          </h1>
          <p className="muted auth-side-lead">
            Выберите удобное время у нужного врача, следите за ревакцинацией и получайте уведомления о каждом изменении записи.
          </p>
        </div>

        <div className="auth-side-ill">
          <HeroPetsSvg
            idPrefix="as"
            className="auth-side-svg"
            viewBox="40 35 520 400"
            role="img"
            ariaLabel="Кошка и собака — пациенты клиники"
            animated
          />
        </div>
      </div>

      {children}
    </section>
  );
}
