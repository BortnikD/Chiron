'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarPlus,
  ChevronRight,
  Sparkles,
  Clock,
  Activity,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { HeroIllustration } from '../../components/home/HeroIllustration';
import { LandingHeroSectionProps, AdvantageChip } from './types';

const ADVANTAGES: AdvantageChip[] = [
  {
    id: 'online-booking',
    label: 'Онлайн-запись 24/7',
    desc: 'Удобный выбор врача и свободного времени приёма с любого устройства',
  },
  {
    id: 'lab',
    label: 'Собственная лаборатория',
    desc: 'Точные экспресс-анализы и результаты обследования в день обращения',
  },
  {
    id: 'care',
    label: 'Бережный подход',
    desc: 'Внимательные специалисты, приём без очередей и лишнего стресса для питомца',
  },
  {
    id: 'medcard',
    label: 'Электронная медкарта',
    desc: 'История приёмов, назначений и график прививок всегда под рукой в кабинете',
  },
];

export const LandingHeroSection: React.FC<LandingHeroSectionProps> = ({
  vetsCount,
  specsCount,
  servicesCount,
}) => {
  const [selectedAdvantage, setSelectedAdvantage] = useState<string | null>(null);

  const activeAdvantage = ADVANTAGES.find((adv) => adv.id === selectedAdvantage);

  return (
    <section className="island ab-hero" style={{ flex: 'none' }}>
      <div className="ab-hero-text">
        <span className="hm-date">
          ВЕТЕРИНАРНАЯ КЛИНИКА · РОСТОВ-НА-ДОНУ · +7 863 200-10-00
        </span>
        <h1 className="ab-title">
          Забота о питомце —<br />
          <span>от первого осмотра до ревакцинации</span>
        </h1>
        <p className="ab-lead">
          Chiron — клиника и онлайн-кабинет в одном. Выбирайте врача и свободное время,
          храните историю приёмов и прививок, получайте напоминания о записях и ревакцинации.
        </p>

        {/* Интерактивные чипы преимуществ клиники */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="chips" aria-label="Преимущества клиники">
            {ADVANTAGES.map((adv) => {
              const isSelected = selectedAdvantage === adv.id;
              return (
                <button
                  key={adv.id}
                  type="button"
                  className={`chip ${isSelected ? 'sel' : ''}`}
                  onClick={() => setSelectedAdvantage(isSelected ? null : adv.id)}
                  title={adv.desc}
                  style={{ transition: 'all 0.15s ease' }}
                >
                  {adv.id === 'online-booking' && <Clock className="ic" style={{ width: '13px', height: '13px' }} />}
                  {adv.id === 'lab' && <Activity className="ic" style={{ width: '13px', height: '13px' }} />}
                  {adv.id === 'care' && <ShieldCheck className="ic" style={{ width: '13px', height: '13px' }} />}
                  {adv.id === 'medcard' && <FileText className="ic" style={{ width: '13px', height: '13px' }} />}
                  <span>{adv.label}</span>
                </button>
              );
            })}
          </div>

          {activeAdvantage && (
            <div
              className="card"
              style={{
                padding: '8px 12px',
                fontSize: '12.5px',
                lineHeight: '1.4',
                color: 'var(--muted-foreground)',
                background: 'color-mix(in srgb, var(--primary) 6%, var(--card))',
                borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--border))',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles className="ic" style={{ width: '14px', height: '14px', color: 'var(--primary)', flexShrink: 0 }} />
              <span>{activeAdvantage.desc}</span>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="row wrap" style={{ gap: '8px' }}>
          <Link href="/client/book" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
            <CalendarPlus className="ic" />
            <span>Записаться на приём</span>
          </Link>
          <Link href="/services" className="btn btn-outline btn-lg" style={{ textDecoration: 'none' }}>
            <span>Услуги и цены</span>
            <ChevronRight className="ic" />
          </Link>
        </div>

        {/* Ключевые показатели клиники */}
        <div className="ab-facts">
          <div>
            <b>{vetsCount || 6}</b>
            <span>врачей</span>
          </div>
          <div>
            <b>{specsCount || 6}</b>
            <span>направлений</span>
          </div>
          <div>
            <b>{servicesCount || 12}</b>
            <span>услуг</span>
          </div>
          <div>
            <b>4</b>
            <span>вида животных</span>
          </div>
        </div>
      </div>

      {/* Иллюстрация кошки и собаки с анимированными бейджами */}
      <HeroIllustration />
    </section>
  );
};
