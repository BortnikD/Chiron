'use client';

import React from 'react';
import { PawPrint } from 'lucide-react';
import { ChironLogo } from '../../../components/ui/ChironLogo';
import { AuthBrandSideProps } from './types';

export function AuthBrandSide({ children }: AuthBrandSideProps) {
  return (
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

      {children}
    </section>
  );
}
