'use client';

import React, { useState } from 'react';
import { PawPrint, Syringe, X } from 'lucide-react';
import { Pet, Species, Appointment, Vaccination } from '../../../../types';
import { calculateAge, getSpeciesName, getPatientAppointments } from './utils';

export interface VetPatientDetailIslandProps {
  /** Выбранный пациент для детального просмотра */
  patient: Pet;
  /** Справочник видов животных */
  speciesList: Species[];
  /** Список всех записей на приём */
  appointments: Appointment[];
  /** Список вакцинаций выбранного пациента */
  vaccinations: Vaccination[];
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
  appointments,
  vaccinations,
  onClose,
  onAddVaccination,
}: VetPatientDetailIslandProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'vaccinations'>('overview');

  const patientAppts = getPatientAppointments(appointments, patient.id);

  return (
    <section className="island detail-island" style={{ width: 460 }} aria-label="Карточка пациента">
      <div className="island-head">
        <div className="row">
          <span className="pet-ava">
            <PawPrint size={20} />
          </span>
          <div className="col" style={{ gap: 0 }}>
            <span className="h2">{patient.name}</span>
            <span className="cell-sub">
              {getSpeciesName(speciesList, patient.speciesId)} ·{' '}
              {patient.gender === 'MALE' ? 'Самец' : 'Самка'} ·{' '}
              {calculateAge(patient.birthDate)}
            </span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="tabs-line" role="tablist">
        <button
          className={`tab-line ${activeTab === 'overview' ? 'on' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Обзор
        </button>
        <button
          className={`tab-line ${activeTab === 'appointments' ? 'on' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Приёмы у меня{' '}
          <span className="small muted">
            {patientAppts.length}
          </span>
        </button>
        <button
          className={`tab-line ${activeTab === 'vaccinations' ? 'on' : ''}`}
          onClick={() => setActiveTab('vaccinations')}
        >
          Прививки <span className="small muted">{vaccinations.length}</span>
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="col" style={{ gap: 14 }}>
            <dl className="kv" style={{ margin: 0 }}>
              <dt>Вид</dt>
              <dd>{getSpeciesName(speciesList, patient.speciesId)}</dd>
              <dt>Пол</dt>
              <dd>{patient.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
              <dt>Дата рождения</dt>
              <dd className="tnum">{patient.birthDate || 'Не указана'}</dd>
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

            <button
              className="btn btn-outline"
              onClick={onAddVaccination}
            >
              <Syringe size={14} />
              Внести прививку
            </button>
          </div>
        )}

        {/* Tab 2: My Appointments */}
        {activeTab === 'appointments' && (
          <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
            {patientAppts.map((a) => {
              const d = new Date(a.startAt);
              const dd = d.getDate();
              const mon = d.toLocaleDateString('ru-RU', { month: 'short' });
              const time = d.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={a.id} className="lrow">
                  <span className="datebox">
                    <b>{dd}</b>
                    <span>{mon}</span>
                  </span>
                  <span className="col" style={{ gap: 1 }}>
                    <span className="cell-main">{a.service?.name || 'Приём'}</span>
                    <span className="cell-sub">
                      {time} · {a.priceSnapshot || a.price || 0} ₽
                    </span>
                  </span>
                  <span className={`badge st badge-${a.status}`}>{a.status}</span>
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

        {/* Tab 3: Vaccinations */}
        {activeTab === 'vaccinations' && (
          <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
            {vaccinations.map((v) => (
              <div key={v.id} className="lrow">
                <span
                  className="pet-ava"
                  style={{ width: 36, height: 36, borderRadius: 10 }}
                >
                  <Syringe size={16} />
                </span>
                <span className="col" style={{ gap: 1 }}>
                  <span className="cell-main">{v.name}</span>
                  <span className="cell-sub">Введена {v.administeredOn}</span>
                </span>
                {v.nextDueOn && (
                  <span className="badge badge-accent">до {v.nextDueOn}</span>
                )}
              </div>
            ))}

            {vaccinations.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                Прививок нет
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
