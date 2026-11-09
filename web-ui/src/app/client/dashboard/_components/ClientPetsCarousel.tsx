'use client';

import React from 'react';
import Link from 'next/link';
import { PawPrint, ChevronRight, Calendar, CalendarPlus, Plus, Syringe } from 'lucide-react';
import { SpeciesIcon } from '../../../../components/ui/SpeciesIcon';
import { ClientPetsCarouselProps } from './types';
import { SP_TONE } from './constants';
import { getPetAge, getSpeciesTone, getDueInfo } from './utils';

export function ClientPetsCarousel({
  pets,
  speciesMap,
  appointments = [],
  vaccinations = [],
}: ClientPetsCarouselProps) {
  return (
    <section className="island" style={{ flex: 'none' }}>
      <div className="island-head">
        <span className="island-title">
          <PawPrint className="ic" />
          Мои питомцы <span className="count">{pets.length}</span>
        </span>
        <Link href="/client/pets" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
          <span>Все питомцы</span>
          <ChevronRight className="ic" />
        </Link>
      </div>
      <div className="island-body" style={{ paddingTop: 0 }}>
        <div className="hm-pets">
          {pets.map((p) => {
            const tone = getSpeciesTone(p.speciesId, speciesMap);
            const toneColor = SP_TONE[tone] || 'var(--primary)';
            const spName = (speciesMap && speciesMap[p.speciesId]) || 'Питомец';
            const age = getPetAge(p.birthDate);
            const petAppt = appointments.find(
              (a) => a.petId === p.id && (a.status === 'PENDING' || a.status === 'CONFIRMED')
            );

            // Определение статуса вакцинации для бейджа
            const petVacs = vaccinations.filter((v) => v.petId === p.id);
            const dueVac = petVacs.find((v) => {
              if (!v.nextDueOn) return false;
              const diffDays = Math.ceil((new Date(v.nextDueOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return diffDays <= 7;
            });

            return (
              <div
                key={p.id}
                className="hm-pet"
                style={{ '--tone': toneColor } as React.CSSProperties}
              >
                <div className="hm-pet-top">
                  <span
                    className="hm-ava"
                    style={{ '--tone': toneColor } as React.CSSProperties}
                  >
                    <SpeciesIcon species={tone} size={20} />
                  </span>
                  <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                    <Link href="/client/pets" className="linkish hm-pet-name">
                      {p.name}
                    </Link>
                    <span className="cell-sub">
                      {spName} · {age}
                    </span>
                  </span>
                </div>

                <div className={`hm-pet-next ${petAppt ? 'has' : ''}`}>
                  <Calendar className="ic" />
                  <span>
                    {petAppt
                      ? `Приём ${new Date(petAppt.startAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} в ${new Date(petAppt.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })}`
                      : 'Нет активных записей'}
                  </span>
                </div>

                {dueVac && (
                  <div
                    className={`badge ${getDueInfo(dueVac.nextDueOn).cls}`}
                    style={{ alignSelf: 'flex-start', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Syringe className="ic" style={{ width: 12, height: 12 }} />
                    <span>Прививка {getDueInfo(dueVac.nextDueOn).text}</span>
                  </div>
                )}

                <Link
                  href={`/client/book?petId=${p.id}`}
                  className="btn btn-outline btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <CalendarPlus className="ic" />
                  <span>Записать</span>
                </Link>
              </div>
            );
          })}

          <Link
            href="/client/pets?action=create"
            className="hm-pet hm-pet-add"
            style={{ textDecoration: 'none' }}
          >
            <Plus className="ic ic-20" />
            <span>Добавить питомца</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
