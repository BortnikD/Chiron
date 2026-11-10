'use client';

import React, { useMemo } from 'react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  calculateAgeRu,
  formatIsoDateDisplay,
  formatSlotTime,
  getMoscowDateKey,
  getMoscowTodayIso,
  getSpeciesTone,
  toIdNameMap,
} from '@/shared/lib';

export interface VetPatientsListProps {
  /** Список пациентов для отображения */
  patients: Pet[];
  /** Текущий выбранный пациент */
  selectedPatient: Pet | null;
  /** Обработчик выбора пациента */
  onSelectPatient: (patient: Pet) => void;
  /** Справочник видов животных */
  speciesList: Species[];
  /** Список всех записей на приём */
  appointments: Appointment[];
  /** Флаг загрузки данных */
  loading?: boolean;
  /** Режим отображения: таблица или сетка карточек */
  viewMode?: 'table' | 'cards';
}

function getLastAppointmentDate(appts: Appointment[]): string {
  const nowMs = Date.now();
  const past = appts
    .filter((a) => new Date(a.startAt).getTime() <= nowMs)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  if (past.length === 0) return '—';
  return formatIsoDateDisplay(getMoscowDateKey(past[0].startAt));
}

function getNextAppointmentDate(appts: Appointment[], todayMoscow: string): string {
  const nowMs = Date.now();
  const upcoming = appts
    .filter((a) => new Date(a.startAt).getTime() > nowMs && a.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  if (upcoming.length === 0) return '—';
  const dateKey = getMoscowDateKey(upcoming[0].startAt);
  if (dateKey === todayMoscow) {
    return `сегодня ${formatSlotTime(upcoming[0].startAt)}`;
  }
  return formatIsoDateDisplay(dateKey);
}

/**
 * Список пациентов врача:
 * отображает данные пациентов в виде интерактивной таблицы (.dtable) либо сетки карточек (.cards),
 * с аватарками видов, кличкой, статусом архива, возрастом, весом и историей приёмов.
 */
export function VetPatientsList({
  patients,
  selectedPatient,
  onSelectPatient,
  speciesList,
  appointments,
  loading = false,
  viewMode = 'table',
}: VetPatientsListProps) {
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);
  const todayMoscow = getMoscowTodayIso();

  const apptsByPet = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const appt of appointments) {
      if (!map[appt.petId]) map[appt.petId] = [];
      map[appt.petId].push(appt);
    }
    return map;
  }, [appointments]);

  if (viewMode === 'cards') {
    return (
      <div className="island-body">
        <div className="cards">
          {patients.map((p) => {
            const isSelected = selectedPatient?.id === p.id;
            const age = calculateAgeRu(p.birthDate);
            const petAppts = apptsByPet[p.id] || [];
            const last = getLastAppointmentDate(petAppts);
            const next = getNextAppointmentDate(petAppts, todayMoscow);
            const count = petAppts.length;
            const tone = getSpeciesTone(
              p.species?.name || p.speciesName || p.speciesId,
              speciesMap
            );
            const speciesName = p.species?.name || p.speciesName || speciesMap[p.speciesId] || '—';

            return (
              <button
                key={p.id}
                type="button"
                className={`tcard tone-${tone} ${isSelected ? 'sel' : ''}`}
                onClick={() => onSelectPatient(p)}
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="tcard-head">
                  <span className={`t-ava sm tone-${tone}`}>
                    <SpeciesIcon species={tone} size={16} />
                  </span>
                  <div className="col" style={{ gap: '2px', minWidth: 0 }}>
                    <span className="tcard-title">{p.name}</span>
                    <span className="cell-sub">
                      {speciesName} · {age}
                    </span>
                  </div>
                  {p.isArchived && (
                    <span className="badge" style={{ marginLeft: 'auto' }}>
                      Архив
                    </span>
                  )}
                </div>

                <div className="col" style={{ gap: '4px', fontSize: '12px' }}>
                  {p.weightKg != null && (
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="muted">Вес:</span>
                      <span className="tnum">
                        {String(p.weightKg).replace('.', ',')} кг
                      </span>
                    </div>
                  )}
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted">Последний приём:</span>
                    <span className="tnum">{last}</span>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted">Следующий приём:</span>
                    <span className="tnum">
                      {next.startsWith('сегодня') ? (
                        <span className="t-badge tone-prev">{next}</span>
                      ) : (
                        next
                      )}
                    </span>
                  </div>
                </div>

                <div className="tcard-foot">
                  <span className="tcard-meta">Приёмов: {count}</span>
                </div>
              </button>
            );
          })}
        </div>

        {patients.length === 0 && !loading && (
          <div className="empty" style={{ padding: 24 }}>
            <span className="empty-title">Пациент не найден</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <div
        className="dtable keep-table"
        style={
          {
            '--cols': '1.3fr 0.8fr 0.8fr 1.1fr 1.1fr 0.6fr',
            minWidth: '720px',
          } as React.CSSProperties
        }
      >
        <div className="thead">
          <span>Пациент</span>
          <span>Вид</span>
          <span>Возраст</span>
          <span>Последний приём</span>
          <span>Следующий</span>
          <span className="right">Приёмов</span>
        </div>

        {patients.map((p) => {
          const isSelected = selectedPatient?.id === p.id;
          const age = calculateAgeRu(p.birthDate);
          const petAppts = apptsByPet[p.id] || [];
          const last = getLastAppointmentDate(petAppts);
          const next = getNextAppointmentDate(petAppts, todayMoscow);
          const count = petAppts.length;
          const tone = getSpeciesTone(
            p.species?.name || p.speciesName || p.speciesId,
            speciesMap
          );
          const speciesName = p.species?.name || p.speciesName || speciesMap[p.speciesId] || '—';

          return (
            <button
              key={p.id}
              type="button"
              className={`trow ${isSelected ? 'sel' : ''}`}
              onClick={() => onSelectPatient(p)}
            >
              <span className="row" style={{ gap: 10 }}>
                <span className={`t-ava sm tone-${tone}`}>
                  <SpeciesIcon species={tone} size={16} />
                </span>
                <span className="cell-main">{p.name}</span>
                {p.isArchived && <span className="badge">Архив</span>}
              </span>
              <span>{speciesName}</span>
              <span className="tnum">{age}</span>
              <span className="tnum">{last}</span>
              <span className="tnum">
                {next.startsWith('сегодня') ? (
                  <span className="t-badge tone-prev">{next}</span>
                ) : (
                  next
                )}
              </span>
              <span className="right tnum">{count}</span>
            </button>
          );
        })}
      </div>

      {patients.length === 0 && !loading && (
        <div className="empty">
          <span className="empty-title">Пациент не найден</span>
        </div>
      )}
    </div>
  );
}
