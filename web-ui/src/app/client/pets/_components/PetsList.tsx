'use client';

import React from 'react';
import { PawPrint, Plus, Archive, Calendar, Syringe } from 'lucide-react';
import type { Pet, Appointment, Vaccination } from '@/modules/client/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  calculateAgeRu,
  formatDateRu,
  formatIsoDateDisplay,
  getMoscowDateKey,
  getSpeciesTone,
} from '@/shared/lib';

export interface PetsListProps {
  /** Список отображаемых питомцев */
  pets: Pet[];
  /** Выбранный питомец для детального просмотра */
  selectedPet: Pet | null;
  /** Функция выбора питомца */
  onSelectPet: (pet: Pet) => void;
  /** Словарь названий видов животных по их ID */
  speciesMap: Record<string, string>;
  /** Список записей на приём для подсчёта истории и предстоящих визитов */
  appointments: Appointment[];
  /** Список вакцинаций для плановых отметок */
  vaccinations: Vaccination[];
  /** Опциональный колбэк добавления питомца для кнопки в пустом состоянии */
  onAddPet?: () => void;
}

/**
 * Сетка карточек питомцев (.cards, .tcard, аватарки видов, возраст, вес, статус).
 */
export function PetsList({
  pets,
  selectedPet,
  onSelectPet,
  speciesMap,
  appointments,
  vaccinations,
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
        {pets.length === 0 ? (
          <div className="empty" style={{ padding: '40px' }}>
            <span className="empty-title">Питомцы не найдены</span>
            <span>Добавьте первого питомца или измените параметры фильтра</span>
            {onAddPet && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onAddPet}
                style={{ marginTop: '12px' }}
              >
                <Plus className="ic" />
                <span>Добавить питомца</span>
              </button>
            )}
          </div>
        ) : (
          <div className="cards">
            {pets.map((p) => {
              const isSel = selectedPet?.id === p.id;
              const tone = getSpeciesTone(p.speciesId, speciesMap);
              const spName = speciesMap[p.speciesId] || 'Питомец';
              const age = calculateAgeRu(p.birthDate, 'возраст не указан');
              const visitsCount =
                p.summary != null
                  ? p.summary.completedVisits
                  : appointments.filter((a) => a.petId === p.id && a.status === 'COMPLETED').length;
              const nextApptStartAt =
                p.summary != null
                  ? p.summary.nextAppointment?.startAt ?? null
                  : appointments.find(
                      (a) => a.petId === p.id && (a.status === 'PENDING' || a.status === 'CONFIRMED')
                    )?.startAt ?? null;
              const nextVacDate =
                p.summary != null
                  ? p.summary.nextVaccinationDueOn ?? null
                  : vaccinations.find((v) => v.petId === p.id && v.nextDueOn)?.nextDueOn ?? null;
              const hasOverdueVac = p.summary != null ? p.summary.hasOverdueVaccination : false;

              return (
                <button
                  key={p.id}
                  type="button"
                  className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                  onClick={() => onSelectPet(p)}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
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
                      <b>{p.weightKg ? `${p.weightKg} кг` : '—'}</b>
                    </div>
                    <div>
                      <span>Приёмов</span>
                      <b>{visitsCount}</b>
                    </div>
                  </div>

                  <div className="col" style={{ gap: '6px' }}>
                    <div className={`tcard-line ${nextApptStartAt ? 'ok' : 'muted'}`}>
                      <Calendar className="ic" />
                      <span>
                        {nextApptStartAt
                          ? `Приём ${formatDateRu(nextApptStartAt, { day: 'numeric', month: 'short' })}`
                          : 'Нет предстоящих приёмов'}
                      </span>
                    </div>
                    <div className={`tcard-line ${hasOverdueVac ? 'bad' : nextVacDate ? 'ok' : 'muted'}`}>
                      <Syringe className="ic" />
                      <span>
                        {nextVacDate
                          ? hasOverdueVac
                            ? `Прививка просрочена (${formatIsoDateDisplay(getMoscowDateKey(nextVacDate) || nextVacDate)})`
                            : `Прививка до ${formatIsoDateDisplay(getMoscowDateKey(nextVacDate) || nextVacDate)}`
                          : 'Прививки по плану'}
                      </span>
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
