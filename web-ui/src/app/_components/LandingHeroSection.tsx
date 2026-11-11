'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarPlus, ChevronRight } from 'lucide-react';
import { HeroIllustration } from '@/components/home/HeroIllustration';
import { getHomeByRole } from '@/shared/lib';
import type { LandingHeroSectionProps } from './types';

export const LandingHeroSection: React.FC<LandingHeroSectionProps> = ({
  vetsCount,
  specsCount,
  servicesCount,
  speciesCount,
  loading = false,
  isAuthenticated = false,
  role = null,
}) => {
  const ctaHref =
    isAuthenticated && role
      ? role === 'CLIENT'
        ? '/client/book'
        : getHomeByRole(role)
      : `/login?next=${encodeURIComponent('/client/book')}`;

  const ctaLabel =
    isAuthenticated && role && role !== 'CLIENT' ? 'В кабинет' : 'Записаться на приём';

  return (
    <section className="island ab-hero" style={{ flex: 'none' }}>
      <div className="ab-hero-text">
        <span className="hm-date">Ветеринарная клиника · Ростов-на-Дону</span>
        <h1 className="ab-title">
          Забота о питомце —<br />
          <span>от первого осмотра до ревакцинации</span>
        </h1>
        <p className="ab-lead">
          Chiron — клиника и онлайн-кабинет в одном. Выбирайте врача и свободное время,
          храните историю приёмов и прививок, получайте напоминания о записях и ревакцинации.
        </p>

        <div className="row wrap" style={{ gap: '8px' }}>
          <Link href={ctaHref} className="btn btn-primary btn-lg">
            <CalendarPlus className="ic" />
            <span>{ctaLabel}</span>
          </Link>
          <Link href="/services" className="btn btn-outline btn-lg">
            <span>Услуги и цены</span>
            <ChevronRight className="ic" />
          </Link>
        </div>

        <div className="ab-facts">
          <div>
            <b>{loading ? '—' : vetsCount}</b>
            <span>врачей</span>
          </div>
          <div>
            <b>{loading ? '—' : specsCount}</b>
            <span>направлений</span>
          </div>
          <div>
            <b>{loading ? '—' : servicesCount}</b>
            <span>услуг</span>
          </div>
          <div>
            <b>{loading ? '—' : speciesCount || 4}</b>
            <span>вида животных</span>
          </div>
        </div>
      </div>

      <HeroIllustration />
    </section>
  );
};
