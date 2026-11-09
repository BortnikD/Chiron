'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CalendarPlus, Phone } from 'lucide-react';
import { SpeciesIcon } from '../../components/ui/SpeciesIcon';

export const LandingCtaSection: React.FC = () => {
  return (
    <section className="island ab-cta" style={{ flex: 'none' }} aria-label="Запись на приём и контакты">
      <span className="t-ava lg tone-prev" style={{ flexShrink: 0 }}>
        <ShieldCheck className="ic" style={{ width: '26px', height: '26px' }} />
      </span>

      <span className="col grow" style={{ gap: '2px', minWidth: 0 }}>
        <b>Мы делаем животных здоровыми, а хозяев — спокойными</b>
        <span className="muted small">
          Лечим кошек, собак, кроликов и попугаев · приём Пн–Пт 9:00–21:00, Сб–Вс 10:00–18:00
        </span>
      </span>

      <div className="row wrap" style={{ gap: '6px', alignItems: 'center' }}>
        <span className="sp-chip tone-cat">
          <SpeciesIcon species="cat" size={16} />
          Кошки
        </span>
        <span className="sp-chip tone-dog">
          <SpeciesIcon species="dog" size={16} />
          Собаки
        </span>
        <span className="sp-chip tone-rab">
          <SpeciesIcon species="rab" size={16} />
          Кролики
        </span>
        <span className="sp-chip tone-par">
          <SpeciesIcon species="par" size={16} />
          Попугаи
        </span>
      </div>

      <div className="row wrap" style={{ gap: '8px', marginLeft: 'auto' }}>
        <Link href="/client/book" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
          <CalendarPlus className="ic" />
          <span>Записаться онлайн</span>
        </Link>
        <a href="tel:+78632001000" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
          <Phone className="ic" />
          <span>+7 863 200-10-00</span>
        </a>
      </div>
    </section>
  );
};
