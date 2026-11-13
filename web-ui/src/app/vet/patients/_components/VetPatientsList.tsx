'use client';

import React, { useMemo } from 'react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { PaginationFooter } from '@/shared/components';
import {
  calculateAgeRu,
  formatIsoDateDisplay,
  formatSlotTime,
  formatWeightRu,
  getMoscowDateKey,
  getMoscowTodayIso,
  getSpeciesTone,
  toIdNameMap,
} from '@/shared/lib';

export interface VetPatientsListProps {
  patients: Pet[];
  selectedPatient: Pet | null;
  onSelectPatient: (patient: Pet) => void;
  speciesList: Species[];
  appointments: Appointment[];
  loading?: boolean;
  viewMode?: 'table' | 'cards';
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function getLastAppointmentDate(appts: Appointment[]): string {
  const nowMs = Date.now();
  const past = appts
    .filter((a) => new Date(a.startAt).getTime() <= nowMs && a.status !== 'CANCELLED')
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  if (past.length === 0) return '—';
  return formatIsoDateDisplay(getMoscowDateKey(past[0].startAt));
}

function getNextAppointmentDate(appts: Appointment[], todayMoscow: string): string {
  const nowMs = Date.now();
  const upcoming = appts
    .filter(
      (a) =>
        new Date(a.startAt).getTime() > nowMs &&
        (a.status === 'PENDING' || a.status === 'CONFIRMED')
    )
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  if (upcoming.length === 0) return '—';
  const dateKey = getMoscowDateKey(upcoming[0].startAt);
  if (dateKey === todayMoscow) {
    return `сегодня ${formatSlotTime(upcoming[0].startAt)}`;
  }
  return `${formatIsoDateDisplay(dateKey)} ${formatSlotTime(upcoming[0].startAt)}`;
}

export function VetPatientsList({
  patients,
  selectedPatient,
  onSelectPatient,
  speciesList,
  appointments,
  loading = false,
  viewMode = 'table',
  page,
  pageSize,
  totalElements,
  totalPages,
  onPageChange,
  onPageSizeChange,
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

  return (
    <>
      {viewMode === 'cards' ? (
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
                  <PetAvatar
                    pet={p}
                    tone={tone}
                    species={tone}
                    iconSize={16}
                    variant="thumb"
                    className={`t-ava sm tone-${tone}`}
                  />
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
                      <span className="tnum">{formatWeightRu(p.weightKg)}</span>
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

          {loading && patients.length === 0 && (
            <div className="empty" style={{ padding: 24 }}>
              <span className="spinner" aria-hidden="true" />
              <span className="small muted">Загрузка пациентов…</span>
            </div>
          )}
        </div>
      ) : (
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
              const speciesName =
                p.species?.name || p.speciesName || speciesMap[p.speciesId] || '—';

              return (
                <button
                  key={p.id}
                  type="button"
                  className={`trow ${isSelected ? 'sel' : ''}`}
                  onClick={() => onSelectPatient(p)}
                >
                  <span className="row" style={{ gap: 10 }}>
                    <PetAvatar
                      pet={p}
                      tone={tone}
                      species={tone}
                      iconSize={16}
                      variant="thumb"
                      className={`t-ava sm tone-${tone}`}
                    />
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

          {loading && patients.length === 0 && (
            <div className="empty">
              <span className="spinner" aria-hidden="true" />
              <span className="small muted">Загрузка пациентов…</span>
            </div>
          )}

          {patients.length === 0 && !loading && (
            <div className="empty">
              <span className="empty-title">Пациент не найден</span>
            </div>
          )}
        </div>
      )}

      <PaginationFooter
        page={page}
        pageSize={pageSize}
        totalElements={totalElements}
        totalPages={totalPages}
        loading={loading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  );
}
