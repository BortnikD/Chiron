'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  CalendarPlus,
  Pencil,
  Archive,
  Trash2,
  Syringe,
} from 'lucide-react';
import type { Pet, Appointment, Vaccination } from '@/modules/client/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  APPOINTMENT_STATUS_META,
  calculateAgeRu,
  formatCurrency,
  formatDateRu,
  formatDateShort,
  formatIsoDateDisplay,
  formatSlotTime,
  getMoscowDateKey,
  getSpeciesTone,
} from '@/shared/lib';
import type { DetailTab } from './types';

export interface PetDetailIslandProps {
  /** Выбранный питомец */
  pet: Pet;
  /** Словарь названий видов животных по их ID */
  speciesMap: Record<string, string>;
  /** Список записей на приём для фильтрации истории */
  appointments: Appointment[];
  /** Список вакцинаций для фильтрации истории */
  vaccinations: Vaccination[];
  /** Флаг загрузки истории приёмов выбранного питомца */
  loadingAppts?: boolean;
  /** Функция закрытия острова */
  onClose: () => void;
  /** Функция вызова модального окна редактирования питомца */
  onEdit: (pet: Pet) => void;
  /** Функция переключения статуса архива */
  onToggleArchive: (pet: Pet) => void;
  /** Функция удаления питомца */
  onDelete: (pet: Pet) => void;
}

/**
 * Правый master-detail остров с полной информацией о питомце, историей визитов и вакцинаций.
 */
export function PetDetailIsland({
  pet,
  speciesMap,
  appointments,
  vaccinations,
  loadingAppts = false,
  onClose,
  onEdit,
  onToggleArchive,
  onDelete,
}: PetDetailIslandProps) {
  const [detailTab, setDetailTab] = useState<DetailTab>('OVERVIEW');

  const petAppts = appointments.filter((a) => a.petId === pet.id);
  const petVaccs = vaccinations.filter((v) => v.petId === pet.id);
  const apptsCount = pet.summary?.appointmentsCount ?? petAppts.length;
  const vaccsCount = pet.summary?.vaccinationsCount ?? petVaccs.length;

  const tone = getSpeciesTone(pet.speciesId, speciesMap);
  const spName = speciesMap[pet.speciesId] || 'Питомец';
  const age = calculateAgeRu(pet.birthDate, 'возраст не указан');

  return (
    <section
      className="island detail-island"
      style={{ flex: 'none' }}
      aria-label="Карточка питомца"
    >
      <div className="island-head">
        <div className="row" style={{ gap: '10px' }}>
          <span className={`t-ava ${tone}`}>
            <SpeciesIcon species={tone} size={20} />
          </span>
          <div className="col" style={{ gap: 0, minWidth: 0 }}>
            <span className="h2">{pet.name}</span>
            <span className="cell-sub">
              {spName} · {age}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X className="ic" />
        </button>
      </div>

      {/* Панель быстрых действий */}
      <div className="row wrap" style={{ gap: '6px', padding: '0 16px 12px' }}>
        <Link
          href={`/client/book?petId=${pet.id}`}
          className="btn btn-primary btn-sm"
          style={{ textDecoration: 'none' }}
        >
          <CalendarPlus className="ic" />
          <span>Записать</span>
        </Link>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onEdit(pet)}
        >
          <Pencil className="ic" />
          <span>Изменить</span>
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onToggleArchive(pet)}
        >
          <Archive className="ic" />
          <span>{pet.isArchived ? 'Из архива' : 'В архив'}</span>
        </button>
        <button
          type="button"
          className="btn btn-destructive-outline btn-sm"
          onClick={() => onDelete(pet)}
        >
          <Trash2 className="ic" />
          <span>Удалить</span>
        </button>
      </div>

      {/* Вкладки: Обзор / Записи / Прививки */}
      <div className="tabs-line" role="tablist">
        <button
          type="button"
          className={`tab-line ${detailTab === 'OVERVIEW' ? 'on' : ''}`}
          onClick={() => setDetailTab('OVERVIEW')}
        >
          Обзор
        </button>
        <button
          type="button"
          className={`tab-line ${detailTab === 'APPTS' ? 'on' : ''}`}
          onClick={() => setDetailTab('APPTS')}
        >
          Записи <span className="small muted">{apptsCount}</span>
        </button>
        <button
          type="button"
          className={`tab-line ${detailTab === 'VACC' ? 'on' : ''}`}
          onClick={() => setDetailTab('VACC')}
        >
          Прививки <span className="small muted">{vaccsCount}</span>
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: '14px' }}>
        {detailTab === 'OVERVIEW' && (
          <div className="col" style={{ gap: '14px' }}>
            {pet.isArchived && (
              <div className="alert alert-info">
                <Archive className="ic" />
                <div>Питомец находится в архиве. Новые записи заблокированы.</div>
              </div>
            )}

            <dl className="kv" style={{ margin: 0 }}>
              <dt>Вид</dt>
              <dd>{speciesMap[pet.speciesId] || '—'}</dd>
              <dt>Пол</dt>
              <dd>{pet.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
              <dt>Дата рождения</dt>
              <dd className="tnum">
                {pet.birthDate ? `${formatDateShort(pet.birthDate)} (${age})` : '—'}
              </dd>
              <dt>Вес</dt>
              <dd className="tnum">
                {pet.weightKg ? `${pet.weightKg} кг` : 'не указан'}
              </dd>
              <dt>Особенности</dt>
              <dd>{pet.notes || 'Особых отметок нет'}</dd>
            </dl>
          </div>
        )}

        {detailTab === 'APPTS' && (
          <div className="col" style={{ gap: '8px' }}>
            {loadingAppts && petAppts.length === 0 ? (
              <span className="small muted">Загрузка истории записей...</span>
            ) : petAppts.length === 0 ? (
              <span className="small muted">Записей на приём пока нет</span>
            ) : (
              petAppts.map((a) => (
                <div
                  key={a.id}
                  className="lrow"
                  style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <span className="datebox">
                    <b>{formatDateRu(a.startAt, { day: 'numeric' })}</b>
                    <span>{formatDateRu(a.startAt, { month: 'short' })}</span>
                  </span>
                  <span className="col" style={{ gap: 0, minWidth: 0, flex: 1 }}>
                    <span className="cell-main tnum">{formatSlotTime(a.startAt)}</span>
                    <span className="cell-sub">
                      {a.priceSnapshot != null ? formatCurrency(a.priceSnapshot) : 'Приём'}
                    </span>
                  </span>
                  <span className={`badge st badge-${a.status}`}>
                    {APPOINTMENT_STATUS_META[a.status]?.short || a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {detailTab === 'VACC' && (
          <div className="col" style={{ gap: '8px' }}>
            {petVaccs.length === 0 ? (
              <span className="small muted">Вакцинаций не зарегистрировано</span>
            ) : (
              petVaccs.map((v) => (
                <div
                  key={v.id}
                  className="lrow"
                  style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <span className="t-ava sm tone-prev">
                    <Syringe className="ic" />
                  </span>
                  <span className="col" style={{ gap: 0, minWidth: 0, flex: 1 }}>
                    <span className="cell-main">{v.name}</span>
                    <span className="cell-sub tnum">
                      Сделана: {formatIsoDateDisplay(getMoscowDateKey(v.administeredOn) || v.administeredOn)}
                      {v.nextDueOn
                        ? ` · След.: ${formatIsoDateDisplay(getMoscowDateKey(v.nextDueOn) || v.nextDueOn)}`
                        : ''}
                    </span>
                  </span>
                  <span className="badge badge-outline">
                    {v.nextDueOn ? 'По плану' : 'Выполнена'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
