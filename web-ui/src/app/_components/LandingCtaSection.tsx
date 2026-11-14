'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';

export const LandingCtaSection: React.FC = () => {
  return (
    <section className="island ab-cta" style={{ flex: 'none' }} aria-label="Виды животных и часы приёма">
      <div className="ab-cta-lead">
        <span className="t-ava lg tone-prev">
          <ShieldCheck className="ic" style={{ width: '26px', height: '26px' }} />
        </span>

        <div className="ab-cta-text">
          <b>Мы делаем животных здоровыми, а хозяев — спокойными</b>
          <span className="muted small">
            Лечим кошек, собак, кроликов и попугаев · приём Пн–Пт 9:00–18:00, Сб 10:00–15:00
          </span>
        </div>
      </div>

      <div className="ab-cta-chips">
        <span className="sp-chip tone-cat">
          <SpeciesIcon species="cat" size={14} />
          Кошки
        </span>
        <span className="sp-chip tone-dog">
          <SpeciesIcon species="dog" size={14} />
          Собаки
        </span>
        <span className="sp-chip tone-rab">
          <SpeciesIcon species="rab" size={14} />
          Кролики
        </span>
        <span className="sp-chip tone-par">
          <SpeciesIcon species="par" size={14} />
          Попугаи
        </span>
      </div>
    </section>
  );
};
