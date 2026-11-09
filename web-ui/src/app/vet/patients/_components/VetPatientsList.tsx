'use client';

import React from 'react';
import { PawPrint } from 'lucide-react';
import { Pet, Species, Appointment } from '../../../../types';
import { getSpeciesTone } from '../../../../components/ui/SpeciesIcon';
import {
  calculateAge,
  getSpeciesName,
  getPatientAppointments,
  getLastAppointment,
  getNextAppointment,
} from './utils';

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
  if (viewMode === 'cards') {
    return (
      <div style={{ padding: '0 16px 16px' }}>
        <div className="cards">
          {patients.map((p) => {
            const isSelected = selectedPatient?.id === p.id;
            const age = calculateAge(p.birthDate);
            const last = getLastAppointment(appointments, p.id);
            const next = getNextAppointment(appointments, p.id);
            const count = getPatientAppointments(appointments, p.id).length;
            const tone = getSpeciesTone(p.speciesId);

            return (
              <button
                key={p.id}
                type="button"
                className={`tcard tone-${tone} ${isSelected ? 'sel' : ''}`}
                onClick={() => onSelectPatient(p)}
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="tcard-head">
                  <span className={`t-ava sm ${tone}`}>
                    <PawPrint size={14} className="ic" />
                  </span>
                  <div className="col" style={{ gap: '2px', minWidth: 0 }}>
                    <span className="tcard-title">{p.name}</span>
                    <span className="cell-sub">
                      {getSpeciesName(speciesList, p.speciesId)} · {age}
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
          const age = calculateAge(p.birthDate);
          const last = getLastAppointment(appointments, p.id);
          const next = getNextAppointment(appointments, p.id);
          const count = getPatientAppointments(appointments, p.id).length;

          return (
            <button
              key={p.id}
              className={`trow ${isSelected ? 'sel' : ''}`}
              onClick={() => onSelectPatient(p)}
            >
              <span className="row" style={{ gap: 10 }}>
                <span className={`t-ava sm ${getSpeciesTone(p.speciesId)}`}>
                  <PawPrint size={14} className="ic" />
                </span>
                <span className="cell-main">{p.name}</span>
                {p.isArchived && <span className="badge">Архив</span>}
              </span>
              <span>{getSpeciesName(speciesList, p.speciesId)}</span>
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
