'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, Syringe, X } from 'lucide-react';
import type { Appointment, Pet, Vaccination } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  APPOINTMENT_STATUS_META,
  calculateAgeRu,
  formatCurrency,
  formatDateRu,
  formatIsoDateDisplay,
  formatSlotTime,
  getSpeciesTone,
  toIdNameMap,
} from '@/shared/lib';

export interface VetPatientDetailIslandProps {
  /** Выбранный пациент для детального просмотра */
  patient: Pet;
  /** Справочник видов животных */
  speciesList: Species[];
  /** Карта услуг (id -> название) */
  servicesMap?: Record<string, string>;
  /** Список всех записей на приём */
  appointments: Appointment[];
  /** Список вакцинаций выбранного пациента */
  vaccinations: Vaccination[];
  /** Ошибка загрузки вакцинаций */
  vaccinationsError?: string | null;
  /** Обработчик закрытия детального острова */
  onClose: () => void;
  /** Обработчик открытия модального окна добавления вакцинации */
  onAddVaccination: () => void;
}

/**
 * Правый master-detail остров с карточкой выбранного пациента:
 * отображает общую информацию о пациенте, историю приёмов у текущего врача
 * и список вакцинаций с возможностью добавления новой записи.
 */
export function VetPatientDetailIsland({
  patient,
  speciesList,
  servicesMap,
  appointments,
  vaccinations,
  vaccinationsError,
  onClose,
  onAddVaccination,
}: VetPatientDetailIslandProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'vaccinations'>('overview');

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);
  const speciesName = patient.species?.name || patient.speciesName || speciesMap[patient.speciesId] || '—';
  const tone = getSpeciesTone(
    patient.species?.name || patient.speciesName || patient.speciesId,
    speciesMap
  );

  const patientAppts = useMemo(
    () => appointments.filter((a) => a.petId === patient.id),
    [appointments, patient.id]
  );

  return (
    <section className="island detail-island" aria-label="Карточка пациента">
      <div className="island-head">
        <div className="row">
          <span className={`t-ava tone-${tone}`}>
            <SpeciesIcon species={tone} size={20} />
          </span>
          <div className="col" style={{ gap: 0 }}>
            <span className="h2">{patient.name}</span>
            <span className="cell-sub">
              {speciesName} · {patient.gender === 'MALE' ? 'Самец' : 'Самка'} ·{' '}
              {calculateAgeRu(patient.birthDate)}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="tabs-line" role="tablist">
        <button
          type="button"
          className={`tab-line ${activeTab === 'overview' ? 'on' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Обзор
        </button>
        <button
          type="button"
          className={`tab-line ${activeTab === 'appointments' ? 'on' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Приёмы у меня <span className="small muted">{patientAppts.length}</span>
        </button>
        <button
          type="button"
          className={`tab-line ${activeTab === 'vaccinations' ? 'on' : ''}`}
          onClick={() => setActiveTab('vaccinations')}
        >
          Прививки <span className="small muted">{vaccinations.length}</span>
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        {activeTab === 'overview' && (
          <div className="col" style={{ gap: 14 }}>
            <dl className="kv" style={{ margin: 0 }}>
              <dt>Вид</dt>
              <dd>{speciesName}</dd>
              <dt>Пол</dt>
              <dd>{patient.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
              <dt>Дата рождения</dt>
              <dd className="tnum">
                {patient.birthDate ? formatIsoDateDisplay(patient.birthDate) : 'Не указана'}
              </dd>
              <dt>Вес</dt>
              <dd className="tnum">
                {patient.weightKg != null
                  ? `${String(patient.weightKg).replace('.', ',')} кг`
                  : '—'}
              </dd>
              <dt>Заметки</dt>
              <dd>{patient.notes || '—'}</dd>
            </dl>

            <span className="small muted">Контакты владельца врачу недоступны.</span>

            <button type="button" className="btn btn-outline" onClick={onAddVaccination}>
              <Syringe size={14} />
              Внести прививку
            </button>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
            {patientAppts.map((a) => {
              const dd = formatDateRu(a.startAt, { day: 'numeric' });
              const mon = formatDateRu(a.startAt, { month: 'short' });
              const time = formatSlotTime(a.startAt);
              const serviceName =
                a.serviceName || a.service?.name || servicesMap?.[a.serviceId] || 'Приём';

              return (
                <div key={a.id} className="lrow">
                  <span className="datebox">
                    <b>{dd}</b>
                    <span>{mon}</span>
                  </span>
                  <span className="col" style={{ gap: 1 }}>
                    <span className="cell-main">{serviceName}</span>
                    <span className="cell-sub">
                      {time} · {formatCurrency(a.priceSnapshot ?? a.price ?? 0)}
                    </span>
                  </span>
                  <span className={`badge st badge-${a.status}`}>
                    {APPOINTMENT_STATUS_META[a.status]?.short || a.status}
                  </span>
                </div>
              );
            })}

            {patientAppts.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                Приёмов нет
              </div>
            )}
          </div>
        )}

        {activeTab === 'vaccinations' && (
          <div className="col" style={{ gap: 6 }}>
            {vaccinationsError && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" />
                <span>{vaccinationsError}</span>
              </div>
            )}

            <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
              {vaccinations.map((v) => (
                <div key={v.id} className="lrow">
                  <span className="t-ava tone-prev">
                    <Syringe size={16} />
                  </span>
                  <span className="col" style={{ gap: 1 }}>
                    <span className="cell-main">{v.name}</span>
                    <span className="cell-sub tnum">
                      Введена {formatIsoDateDisplay(v.administeredOn)}
                    </span>
                  </span>
                  {v.nextDueOn && (
                    <span className="badge badge-accent tnum">
                      до {formatIsoDateDisplay(v.nextDueOn)}
                    </span>
                  )}
                </div>
              ))}

              {vaccinations.length === 0 && !vaccinationsError && (
                <div className="empty" style={{ padding: 24 }}>
                  Прививок нет
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
