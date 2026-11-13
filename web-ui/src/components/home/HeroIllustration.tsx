'use client';

import React from 'react';
import { Check, Syringe } from 'lucide-react';
import { HeroPetsSvg } from '@/components/ui/HeroPetsSvg';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="ab-art">
      <HeroPetsSvg
        idPrefix="ab"
        className="ab-ill"
        viewBox="0 0 560 460"
        role="img"
        ariaLabel="Кошка и собака — пациенты клиники"
        animated
        showEcg
      />

      {/* Плавающие карточки уведомлений */}
      <div className="ab-float ab-f1">
        <span className="t-ava sm tone-prev">
          <Check className="ic" style={{ width: '14px', height: '14px' }} />
        </span>
        <span className="col" style={{ gap: 0 }}>
          <b>Запись подтверждена</b>
          <span>Сегодня, 11:30 · терапевт</span>
        </span>
      </div>

      <div className="ab-float ab-f2">
        <span className="t-ava sm tone-cat">
          <Syringe className="ic" style={{ width: '14px', height: '14px' }} />
        </span>
        <span className="col" style={{ gap: 0 }}>
          <b>Ревакцинация</b>
          <span>через 5 дней · напомним</span>
        </span>
      </div>
    </div>
  );
};
