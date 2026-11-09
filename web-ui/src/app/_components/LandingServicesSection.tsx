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
} from 'lucide-react';
import { LandingServicesSectionProps, ClinicDirection, PopularOffer } from './types';

const DEFAULT_DIRECTIONS: ClinicDirection[] = [
  { id: 'ther', name: 'Терапия', who: 'И. И. Петров' },
  { id: 'surg', name: 'Хирургия', who: 'М. А. Соколова' },
  { id: 'dent', name: 'Стоматология', who: 'О. В. Ким' },
  { id: 'derm', name: 'Дерматология', who: 'Е. П. Морозова' },
  { id: 'opht', name: 'Офтальмология', who: 'А. С. Белов' },
  { id: 'prev', name: 'Профилактика', who: 'Н. И. Орлова' },
];

export const LandingServicesSection: React.FC<LandingServicesSectionProps> = ({ services = [] }) => {
  const popularOffers: PopularOffer[] = useMemo(() => {
    return [
      {
        spec: 'ther',
        specName: 'Терапия',
        name: 'Первичный осмотр',
        desc: 'Осмотр, сбор анамнеза, план обследования и лечения.',
        dur: 30,
        price: '1 500 ₽',
        serviceId: services.find(
          (s) => s.name.toLowerCase().includes('осмотр') || s.name.toLowerCase().includes('check-up')
        )?.id,
      },
      {
        spec: 'surg',
        specName: 'Хирургия',
        name: 'Стерилизация и кастрация',
        desc: 'Плановые операции под ингаляционным наркозом с мониторингом.',
        dur: 60,
        price: '4 500 ₽',
        serviceId: services.find(
          (s) => s.name.toLowerCase().includes('spaying') || s.name.toLowerCase().includes('стерил')
        )?.id,
      },
      {
        spec: 'dent',
        specName: 'Стоматология',
        name: 'Ультразвуковая чистка зубов',
        desc: 'Снятие зубного камня, полировка, санация ротовой полости.',
        dur: 40,
        price: '3 000 ₽',
        serviceId: services.find(
          (s) => s.name.toLowerCase().includes('teeth') || s.name.toLowerCase().includes('чистк')
        )?.id,
      },
    ];
  }, [services]);

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
            <div className="ab-offers">
              {popularOffers.map((offer) => (
                <Link
                  key={offer.name}
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
