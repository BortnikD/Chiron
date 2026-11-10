'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  ChevronRight,
  Stethoscope,
  Sparkles,
  CalendarPlus,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, getSpecTone, toIdNameMap } from '@/shared/lib';
import { SPECIALIZATION_NAMES_RU } from '@/utils/doctorHelpers';
import type { Service } from '@/modules/clinic/types';
import type { LandingServicesSectionProps, ClinicDirection, PopularOffer } from './types';

const DEFAULT_DIRECTIONS: ClinicDirection[] = [
  { id: 'ther', name: 'Терапия', who: 'Первичный осмотр и диагностика' },
  { id: 'surg', name: 'Хирургия', who: 'Плановые и срочные операции' },
  { id: 'dent', name: 'Стоматология', who: 'УЗ-чистка и санация полости' },
  { id: 'derm', name: 'Дерматология', who: 'Диагностика кожи и шерсти' },
  { id: 'opht', name: 'Офтальмология', who: 'Осмотр глаз и тонометрия' },
  { id: 'prev', name: 'Профилактика', who: 'Вакцинация и паспорт прививок' },
];

const FEATURED_SERVICES: PopularOffer[] = [
  {
    spec: 'ther',
    specName: 'Терапия',
    name: 'Первичный осмотр',
    desc: 'Осмотр, сбор анамнеза, план обследования и лечения.',
    dur: 30,
    price: formatCurrency(1500),
  },
  {
    spec: 'surg',
    specName: 'Хирургия',
    name: 'Стерилизация и кастрация',
    desc: 'Плановые операции под ингаляционным наркозом с мониторингом.',
    dur: 60,
    price: formatCurrency(4500),
  },
  {
    spec: 'dent',
    specName: 'Стоматология',
    name: 'Ультразвуковая чистка зубов',
    desc: 'Снятие зубного камня, полировка, санация ротовой полости.',
    dur: 40,
    price: formatCurrency(3000),
  },
];

export const LandingServicesSection: React.FC<LandingServicesSectionProps> = ({
  services = [],
  specializations = [],
  error = null,
}) => {
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

  const popularOffers: PopularOffer[] = useMemo(() => {
    if (services.length === 0) {
      return FEATURED_SERVICES;
    }

    const active = services.filter((s) => s.isActive !== false);
    const pool = active.length > 0 ? active : services;
    const picked: Service[] = [];
    const usedSpecs = new Set<string>();

    for (const s of pool) {
      if (!usedSpecs.has(s.specializationId)) {
        picked.push(s);
        usedSpecs.add(s.specializationId);
        if (picked.length === 3) break;
      }
    }
    for (const s of pool) {
      if (picked.length >= 3) break;
      if (!picked.some((item) => item.id === s.id)) {
        picked.push(s);
      }
    }

    return picked.map((s) => ({
      spec: getSpecTone(s.specializationId),
      specName:
        specsMap[s.specializationId] ||
        SPECIALIZATION_NAMES_RU[s.specializationId] ||
        'Услуга',
      name: s.name,
      desc: s.description || 'Консультация специалиста и проведение процедуры по показаниям.',
      dur: s.baseDurationMin || s.durationMin || 30,
      price: formatCurrency(s.basePrice ?? s.price ?? 0),
      serviceId: s.id,
    }));
  }, [services, specsMap]);

  return (
    <>
      {/* Блок «Ключевые направления» */}
      <section className="island" style={{ flex: 'none' }} aria-label="Ключевые направления клиники">
        <div className="island-head">
          <span className="island-title">
            <ClipboardList className="ic" />
            Ключевые направления
          </span>
          <Link href="/services" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
            <span>Каталог услуг</span>
            <ChevronRight className="ic" />
          </Link>
        </div>
        <div className="island-body" style={{ paddingTop: 0 }}>
          <div className="ab-specs">
            {DEFAULT_DIRECTIONS.map((sp) => (
              <Link
                key={sp.id}
                href={`/services?spec=${sp.id}`}
                className={`ab-spec tone-${sp.id}`}
                style={{ textDecoration: 'none' }}
              >
                <span className="t-ava">
                  <Stethoscope className="ic ic-20" />
                </span>
                <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                  <b>{sp.name}</b>
                  <span>{sp.who}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Двухколоночная сетка: Популярные услуги + Как записаться */}
      <div className="ab-grid">
        {/* Левая колонка: Популярные услуги */}
        <section className="island" aria-label="Популярные услуги">
          <div className="island-head">
            <span className="island-title">
              <Sparkles className="ic" />
              Популярные услуги
            </span>
            <Link href="/services" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              <span>Все услуги</span>
              <ChevronRight className="ic" />
            </Link>
          </div>
          <div className="island-body" style={{ paddingTop: 0 }}>
            {error && (
              <div className="alert alert-info mb-3" role="status">
                <AlertCircle className="ic" />
                <div className="small">
                  Не удалось обновить каталог с сервера — показаны базовые услуги клиники.
                </div>
              </div>
            )}
            <div className="ab-offers">
              {popularOffers.map((offer) => (
                <Link
                  key={offer.serviceId || offer.name}
                  href={offer.serviceId ? `/services?open=${offer.serviceId}` : '/services'}
                  className={`ab-offer tone-${offer.spec}`}
                  style={{ textDecoration: 'none' }}
                >
                  <span className="t-badge">{offer.specName}</span>
                  <b className="ab-offer-name">{offer.name}</b>
                  <span className="tcard-desc">{offer.desc}</span>
                  <span className="ab-offer-foot">
                    <span className="tcard-meta">
                      <Clock className="ic" style={{ width: '14px', height: '14px' }} />
                      {offer.dur} мин
                    </span>
                    <span className="tcard-price">от {offer.price}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Правая колонка: Как записаться */}
        <section className="island" aria-label="Как записаться на приём">
          <div className="island-head">
            <span className="island-title">
              <CalendarPlus className="ic" />
              Как записаться
            </span>
          </div>
          <div className="island-body" style={{ paddingTop: 0 }}>
            <ol className="ab-steps">
              <li>
                <span className="ab-step-n">1</span>
                <span className="col" style={{ gap: '2px' }}>
                  <b>Создайте аккаунт</b>
                  <span>Добавьте питомцев — вид, возраст, особенности</span>
                </span>
              </li>
              <li>
                <span className="ab-step-n">2</span>
                <span className="col" style={{ gap: '2px' }}>
                  <b>Выберите услугу и время</b>
                  <span>Видны только свободные окна врачей, которые лечат ваш вид</span>
                </span>
              </li>
              <li>
                <span className="ab-step-n">3</span>
                <span className="col" style={{ gap: '2px' }}>
                  <b>Приходите на приём</b>
                  <span>Напомним заранее, а история и прививки сохранятся в кабинете</span>
                </span>
              </li>
            </ol>
            <Link
              href="/register"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '14px', textDecoration: 'none' }}
            >
              Создать аккаунт
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};
