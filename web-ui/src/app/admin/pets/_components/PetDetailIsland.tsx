'use client';

import React, { useState } from 'react';
import { PawPrint, Edit2, Archive, Trash2, Syringe, X } from 'lucide-react';
import { PetDetailIslandProps, PetDetailTab } from './types';
import { calculateAge, formatPetWeight, formatAppointmentDate, getOwnerName, getSpeciesName } from './utils';

/**
 * Правая панель детального просмотра питомца:
 * вкладки «Обзор», «Приёмы», «Вакцинация», карточки истории, быстрые действия.
 */
export const PetDetailIsland: React.FC<PetDetailIslandProps> = ({
  pet,
  speciesList,
  users,
  appointments,
  vaccinations,
  onClose,
  onEdit,
  onToggleArchive,
  onDelete,
  onAddVaccination,
}) => {
  const [activeTab, setActiveTab] = useState<PetDetailTab>('overview');

  return (
    <section className="island detail-island" style={{ width: 460 }} aria-label="Питомец">
      <div className="island-head">
        <div className="row">
          <span className="pet-ava">
            <PawPrint size={20} />
          </span>
          <div className="col" style={{ gap: 0 }}>
            <span className="h2">{pet.name}</span>
            <span className="cell-sub">
              {getSpeciesName(speciesList, pet.speciesId)} ·{' '}
              {pet.gender === 'MALE' ? 'Самец' : 'Самка'} ·{' '}
              {calculateAge(pet.birthDate)}
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

      {/* Actions Row */}
      <div className="row wrap" style={{ gap: 6, padding: '0 16px 12px' }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={onEdit}>
          <Edit2 size={14} />
          Изменить
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onToggleArchive}>
          <Archive size={14} />
          {pet.isArchived ? 'Вернуть из архива' : 'В архив'}
        </button>
        <button
          type="button"
          className="btn btn-destructive-outline btn-sm"
          onClick={onDelete}
        >
          <Trash2 size={14} />
          Удалить
        </button>
      </div>

      {/* Tabs Header */}
      <div className="tabs-line">
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
          Записи <span className="small muted">{appointments.length}</span>
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
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="col" style={{ gap: 14 }}>
            <dl className="kv" style={{ margin: 0 }}>
              <dt>Владелец</dt>
              <dd>{getOwnerName(users, pet.ownerId)}</dd>
              <dt>Вид</dt>
              <dd>{getSpeciesName(speciesList, pet.speciesId)}</dd>
              <dt>Пол</dt>
              <dd>{pet.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
              <dt>Дата рождения</dt>
              <dd className="tnum">{pet.birthDate || 'Не указана'}</dd>
              <dt>Вес</dt>
              <dd className="tnum">{formatPetWeight(pet.weightKg)}</dd>
              <dt>Заметки</dt>
              <dd>{pet.notes || '—'}</dd>
              <dt>Статус</dt>
              <dd>{pet.isArchived ? 'В архиве' : 'Активен'}</dd>
            </dl>
          </div>
        )}

        {/* Tab 2: Appointments */}
        {activeTab === 'appointments' && (
          <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
            {appointments.map((a) => {
              const { day, month, time } = formatAppointmentDate(a.startAt);

              return (
                <div key={a.id} className="lrow">
                  <span className="datebox">
                    <b>{day}</b>
                    <span>{month}</span>
                  </span>
                  <span className="col" style={{ gap: 1 }}>
                    <span className="cell-main">{a.service?.name || 'Услуга'}</span>
                    <span className="cell-sub">{time}</span>
                  </span>
                  <span className={`badge st badge-${a.status}`}>{a.status}</span>
                </div>
              );
            })}

            {appointments.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                Записей нет
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Vaccinations */}
        {activeTab === 'vaccinations' && (
          <div className="col" style={{ gap: 6 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ alignSelf: 'flex-start', marginBottom: 8 }}
              onClick={onAddVaccination}
            >
              <Syringe size={14} />
              Внести прививку
            </button>

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
          </div>
        )}
      </div>
    </section>
  );
};
