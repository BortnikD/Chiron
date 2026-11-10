'use client';

import React from 'react';
import Link from 'next/link';
import { PawPrint, ChevronRight, Calendar, CalendarPlus, Plus, Syringe } from 'lucide-react';
import type { Pet, Appointment, Vaccination } from '@/modules/client/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { calculateAgeRu, formatDateRu, formatSlotTime, getSpeciesTone } from '@/shared/lib';
import { getDueInfo, isVaccinationDueSoonOrOverdue } from './utils';

export interface ClientPetsCarouselProps {
  pets: Pet[];
  speciesMap?: Record<string, string>;
  appointments?: Appointment[];
  vaccinations?: Vaccination[];
}

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
            const spName = (speciesMap && speciesMap[p.speciesId]) || 'Питомец';
            const age = calculateAgeRu(p.birthDate, 'возраст не указан');
            const petApptStartAt =
              p.summary != null
                ? p.summary.nextAppointment?.startAt ?? null
                : appointments.find(
                    (a) => a.petId === p.id && (a.status === 'PENDING' || a.status === 'CONFIRMED')
                  )?.startAt ?? null;

            const petVacs = vaccinations.filter((v) => v.petId === p.id);
            const fallbackDueVac = petVacs.find((v) =>
              isVaccinationDueSoonOrOverdue(v.nextDueOn || v.validUntil)
            );
            const dueDateStr =
              p.summary != null
                ? p.summary.nextVaccinationDueOn ?? null
                : fallbackDueVac?.nextDueOn || fallbackDueVac?.validUntil || null;
            const dueInfo =
              dueDateStr &&
              (p.summary?.hasOverdueVaccination || isVaccinationDueSoonOrOverdue(dueDateStr))
                ? getDueInfo(dueDateStr)
                : null;

            return (
              <div key={p.id} className={`hm-pet tone-${tone}`}>
                <div className="hm-pet-top">
                  <span className={`hm-ava tone-${tone}`}>
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

                <div className={`hm-pet-next ${petApptStartAt ? 'has' : ''}`}>
                  <Calendar className="ic" />
                  <span>
                    {petApptStartAt
                      ? `Приём ${formatDateRu(petApptStartAt, { day: 'numeric', month: 'short' })} в ${formatSlotTime(petApptStartAt)}`
                      : 'Нет активных записей'}
                  </span>
                </div>

                {dueInfo && (
                  <div
                    className={`badge ${dueInfo.cls}`}
                    style={{ alignSelf: 'flex-start', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Syringe className="ic" style={{ width: 12, height: 12 }} />
                    <span>Прививка {dueInfo.text}</span>
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
