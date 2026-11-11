'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  ChevronRight,
  Stethoscope,
  CalendarPlus,
  Clock,
} from 'lucide-react';
import { formatCurrency, getSpecTone, toIdNameMap } from '@/shared/lib';
import { SPECIALIZATION_NAMES_RU, getDoctorDisplay } from '@/utils/doctorHelpers';
import type { Service } from '@/modules/clinic/types';
import type { LandingServicesSectionProps, PopularOffer } from './types';

export const LandingServicesSection: React.FC<LandingServicesSectionProps> = ({
  services = [],
  vets = [],
  specializations = [],
  isAuthenticated = false,
}) => {
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

  const specDoctors = useMemo(() => {
    const activeVets = vets.filter((v) => v.isActive !== false);
    return specializations.map((sp) => {
      const matching = activeVets.filter((v) => v.specializationId === sp.id);
      const who =
        matching.length > 0
          ? matching.map((v) => getDoctorDisplay(v, specsMap).name).join(', ')
          : 'скоро';
      return {
        id: sp.id,
        tone: getSpecTone(sp.id),
        name: SPECIALIZATION_NAMES_RU[sp.name] || SPECIALIZATION_NAMES_RU[sp.id] || sp.name,
        who,
      };
    });
  }, [specializations, vets, specsMap]);

  const popularOffers: PopularOffer[] = useMemo(() => {
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
        SPECIALIZATION_NAMES_RU[specsMap[s.specializationId] || ''] ||
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
      {/* Блок «Приём ведут» */}
      <section className="island" style={{ flex: 'none' }} aria-label="Приём ведут">
        <div className="island-head">
          <span className="island-title">
            <Stethoscope className="ic" />
            Приём ведут
          </span>
          <Link href="/veterinarians" className="btn btn-ghost btn-sm">
            <span>Все врачи</span>
            <ChevronRight className="ic" />
          </Link>
        </div>
        <div className="island-body" style={{ paddingTop: 0 }}>
          {specDoctors.length > 0 ? (
            <div className="ab-specs">
              {specDoctors.map((sp) => (
                <Link
                  key={sp.id}
                  href={`/veterinarians?spec=${encodeURIComponent(sp.id)}`}
                  className={`ab-spec tone-${sp.tone}`}
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
          ) : (
            <span className="small muted">Загрузка направлений клиники...</span>
          )}
        </div>
      </section>

      {/* Двухколоночная сетка: Популярные услуги + Как записаться */}
      <div className="ab-grid">
        <section className="island" aria-label="Популярные услуги">
          <div className="island-head">
            <span className="island-title">
              <ClipboardList className="ic" />
              Популярные услуги
            </span>
            <Link href="/services" className="btn btn-ghost btn-sm">
              <span>Все услуги</span>
              <ChevronRight className="ic" />
            </Link>
          </div>
          <div className="island-body" style={{ paddingTop: 0 }}>
            {popularOffers.length > 0 ? (
              <div className="ab-offers">
                {popularOffers.map((offer) => (
                  <Link
                    key={offer.serviceId || offer.name}
                    href={offer.serviceId ? `/services?open=${offer.serviceId}` : '/services'}
                    className={`ab-offer tone-${offer.spec}`}
                  >
                    <span className="t-badge">{offer.specName}</span>
                    <b className="ab-offer-name">{offer.name}</b>
                    <span className="tcard-desc">{offer.desc}</span>
                    <span className="ab-offer-foot">
                      <span className="tcard-meta">
                        <Clock className="ic" />
                        {offer.dur} мин
                      </span>
                      <span className="tcard-price">от {offer.price}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <span className="small muted">Загрузка популярных услуг...</span>
            )}
          </div>
        </section>

        <section className="island" aria-label="Как записаться">
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
            {!isAuthenticated && (
              <Link
                href="/register"
                className="btn btn-primary btn-block"
                style={{ marginTop: '14px' }}
              >
                Создать аккаунт
              </Link>
            )}
          </div>
        </section>
      </div>
    </>
  );
};
