'use client';

import React from 'react';
import { ChironLogo } from '@/components/ui/ChironLogo';
import { EcgPulseSvg, HeroPetsSvg } from '@/components/ui/HeroPetsSvg';
import { PawPrint } from 'lucide-react';

export const AuthHeroMobile: React.FC = () => {
  return (
    <div className="auth-hero-m" aria-hidden="true">
      <div className="hero-grid" />
      <div className="ahm-glow" />
      <EcgPulseSvg className="pulse-line ahm-pulse" />
      <div className="ahm-brand">
        <div className="ahm-logo">
          <span className="ahm-ring" />
          <span className="ahm-ring r2" />
          <ChironLogo size={26} />
        </div>
        <div className="col" style={{ gap: '2px' }}>
          <span className="ahm-name">Chiron</span>
          <span className="ahm-sub">Ветеринарная клиника</span>
        </div>
        <p className="ahm-tag">Запись, история приёмов и прививки — в одном окне</p>
      </div>
      <HeroPetsSvg
        idPrefix="am"
        className="ahm-ill"
        viewBox="40 40 520 400"
        preserveAspectRatio="xMidYMax meet"
        animated
      />
      <div className="ahm-chip">
        <span className="ahm-chip-ic">
          <PawPrint className="ic" />
        </span>
        Напомним о ревакцинации
      </div>
    </div>
  );
};
