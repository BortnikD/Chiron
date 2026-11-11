'use client';

import React from 'react';
import { PawPrint, Plus, Archive, Calendar, Syringe } from 'lucide-react';
import type { Pet, Appointment, Vaccination } from '@/modules/client/types';
import type { Service } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  calculateAgeRu,
  formatDateRu,
  formatSlotTime,
  formatWeightRu,
  getMoscowDateKey,
  getMoscowTodayIso,
  getSpeciesTone,
} from '@/shared/lib';
import { ArchiveFilter, getPetVacDueInfo } from './types';

export interface PetsListProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
  speciesMap: Record<string, string>;
  servicesMap?: Record<string, Service>;
  appointments: Appointment[];
  vaccinations: Vaccination[];
  archiveFilter?: ArchiveFilter;
  loading?: boolean;
  onAddPet?: () => void;
}

function formatPetApptDay(isoStr: string): string {
  const key = getMoscowDateKey(isoStr);
  if (key === getMoscowTodayIso(0)) return 'сегодня';
  if (key === getMoscowTodayIso(1)) return 'завтра';
  return formatDateRu(isoStr, { day: 'numeric', month: 'short' }).replace(/\.$/, '');
}

export function PetsList({
  pets,
  selectedPet,
  onSelectPet,
  speciesMap,
  servicesMap = {},
  appointments,
  vaccinations,
  archiveFilter = 'ACTIVE',
  loading = false,
  onAddPet,
}: PetsListProps) {
  return (
    <section className="island grow" aria-label="Список питомцев">
      <div className="island-head">
        <span className="island-title">
          <PawPrint className="ic" />
          Питомцы <span className="count">{pets.length}</span>
        </span>
      </div>

      <div className="island-body">
        {loading && pets.length === 0 ? (
          <div className="empty">
            <div className="spinner" />
            <span className="small muted">Загрузка питомцев…</span>
          </div>
        ) : pets.length === 0 ? (
          archiveFilter === 'ARCHIVED' ? (
            <div className="empty">
              <div className="empty-art">
                <Archive className="ic ic-40" />
              </div>
              <span className="empty-title">В архиве никого нет</span>
              <span>Архивные питомцы сохраняют историю, но записать их нельзя</span>
            </div>
          ) : (
            <div className="empty">
              <div className="empty-art">
                <PawPrint className="ic ic-40" />
              </div>
              <span className="empty-title">Питомцы не найдены</span>
              <span>Добавьте первого питомца или измените параметры фильтра</span>
              {onAddPet && (
                <button type="button" className="btn btn-primary" onClick={onAddPet}>
                  <Plus className="ic" />
                  <span>Добавить питомца</span>
                </button>
              )}
            </div>
          )
        ) : (
          <div className="cards">
            {pets.map((p) => {
              const isSel = selectedPet?.id === p.id;
              const tone = getSpeciesTone(p.species?.name || p.speciesId, speciesMap);
              const spName = p.species?.name || p.speciesName || speciesMap[p.speciesId] || 'Питомец';
              const age = calculateAgeRu(p.birthDate, 'возраст не указан');
              const visitsCount =
                p.summary != null
                  ? p.summary.completedVisits
                  : appointments.filter((a) => a.petId === p.id && a.status === 'COMPLETED').length;

              const summaryNext = p.summary?.nextAppointment ?? null;
              const fallbackNext = appointments.find(
                (a) => a.petId === p.id && (a.status === 'PENDING' || a.status === 'CONFIRMED')
              );
              const nextApptStartAt = summaryNext?.startAt ?? fallbackNext?.startAt ?? null;
              const nextServiceId = summaryNext?.serviceId ?? fallbackNext?.serviceId;
              const nextServiceName =
                (nextServiceId && servicesMap[nextServiceId]?.name) ||
                fallbackNext?.service?.name ||
                fallbackNext?.serviceName;

              const petDueVacs = vaccinations
                .filter((v) => v.petId === p.id && (v.nextDueOn || v.validUntil))
                .sort((a, b) => {
                  const ka = getMoscowDateKey(a.nextDueOn || a.validUntil) || '';
                  const kb = getMoscowDateKey(b.nextDueOn || b.validUntil) || '';
                  return ka.localeCompare(kb);
                });
              const nearestVac = petDueVacs[0];
              const nextVacDate =
                p.summary?.nextVaccinationDueOn ?? nearestVac?.nextDueOn ?? nearestVac?.validUntil ?? null;
              const dueInfo = nextVacDate ? getPetVacDueInfo(nextVacDate) : null;

              const vacCls = !dueInfo
                ? ''
                : dueInfo.cls === 'due-over' || p.summary?.hasOverdueVaccination
                ? 'bad'
                : dueInfo.cls === 'due-soon'
                ? 'warn'
                : 'ok';
              const vacText = !dueInfo
                ? 'Прививок с повторной дозой нет'
                : vacCls === 'bad'
                ? `Просрочена${nearestVac ? `: ${nearestVac.name}` : ` (${dueInfo.label})`}`
                : vacCls === 'warn'
                ? `${nearestVac ? `${nearestVac.name} — ` : 'Прививка '}${dueInfo.text}`
                : `Прививки в порядке · след. ${dueInfo.label}`;

              return (
                <button
                  key={p.id}
                  type="button"
                  className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                  onClick={() => onSelectPet(p)}
                >
                  <div className="tcard-head">
                    <span className="t-ava lg">
                      <SpeciesIcon species={tone} size={26} />
                    </span>
                    <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
                      <span className="tcard-title">{p.name}</span>
                      <span className="cell-sub">
                        {spName} · {p.gender === 'MALE' ? 'Самец' : 'Самка'}
                      </span>
                    </span>
                    {p.isArchived && (
                      <span className="badge">
                        <Archive className="ic" style={{ width: '12px', height: '12px' }} />
                        Архив
                      </span>
                    )}
                  </div>

                  <div className="tcard-stats">
                    <div>
                      <span>Возраст</span>
                      <b>{age}</b>
                    </div>
                    <div>
                      <span>Вес</span>
                      <b>{formatWeightRu(p.weightKg)}</b>
                    </div>
                    <div>
                      <span>Приёмов</span>
                      <b>{visitsCount}</b>
                    </div>
                  </div>

                  <div className="col" style={{ gap: '6px' }}>
                    <div className={`tcard-line ${nextApptStartAt && !p.isArchived ? 'has' : ''}`}>
                      <Calendar className="ic" />
                      <span>
                        {p.isArchived
                          ? 'В архиве — запись недоступна'
                          : nextApptStartAt
                          ? `Приём ${formatPetApptDay(nextApptStartAt)} в ${formatSlotTime(nextApptStartAt)}${nextServiceName ? ` · ${nextServiceName}` : ''}`
                          : 'Нет предстоящих записей'}
                      </span>
                    </div>
                    <div className={`tcard-line ${vacCls}`}>
                      <Syringe className="ic" />
                      <span>{vacText}</span>
                    </div>
                  </div>

                  {p.notes && <div className="note small">{p.notes}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
