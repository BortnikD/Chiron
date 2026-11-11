'use client';

import React, { useEffect, useState } from 'react';
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
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import {
  APPOINTMENT_STATUS_META,
  calculateAgeRu,
  formatDateRu,
  formatIsoDateDisplay,
  formatSlotTime,
  formatWeightRu,
  getMoscowDateKey,
  getSpeciesTone,
} from '@/shared/lib';
import { DetailTab, getPetVacDueInfo } from './types';

export interface PetDetailIslandProps {
  pet: Pet;
  speciesMap: Record<string, string>;
  servicesMap?: Record<string, Service>;
  veterinariansMap?: Record<string, Veterinarian>;
  appointments: Appointment[];
  vaccinations: Vaccination[];
  loadingAppts?: boolean;
  initialTab?: DetailTab;
  onClose: () => void;
  onEdit: (pet: Pet) => void;
  onToggleArchive: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
}

export function PetDetailIsland({
  pet,
  speciesMap,
  servicesMap = {},
  veterinariansMap = {},
  appointments,
  vaccinations,
  loadingAppts = false,
  initialTab = 'OVERVIEW',
  onClose,
  onEdit,
  onToggleArchive,
  onDelete,
}: PetDetailIslandProps) {
  const [detailTab, setDetailTab] = useState<DetailTab>(initialTab);

  useEffect(() => {
    setDetailTab(initialTab);
  }, [pet.id, initialTab]);

  const petAppts = appointments.filter((a) => a.petId === pet.id);
  const petVaccs = vaccinations.filter((v) => v.petId === pet.id);
  const apptsCount = pet.summary?.appointmentsCount ?? petAppts.length;
  const vaccsCount = pet.summary?.vaccinationsCount ?? petVaccs.length;

  const tone = getSpeciesTone(pet.species?.name || pet.speciesId, speciesMap);
  const spName = pet.species?.name || pet.speciesName || speciesMap[pet.speciesId] || 'Питомец';
  const age = calculateAgeRu(pet.birthDate, 'возраст не указан');
  const birthIso = pet.birthDate ? getMoscowDateKey(pet.birthDate) || pet.birthDate.slice(0, 10) : '';

  return (
    <section
      className="island detail-island"
      style={{ flex: 'none' }}
      aria-label="Карточка питомца"
    >
      <div className="island-head">
        <div className="row">
          <span className={`pet-ava tone-${tone}`} style={{ color: 'var(--tone)', background: 'color-mix(in srgb, var(--tone, var(--muted-foreground)) 16%, transparent)' }}>
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

      <div className="row wrap" style={{ gap: '6px', padding: '0 16px 12px' }}>
        {!pet.isArchived && (
          <Link
            href={`/client/book?petId=${encodeURIComponent(pet.id)}`}
            className="btn btn-primary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <CalendarPlus className="ic" />
            <span>Записать</span>
          </Link>
        )}
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
          <span>{pet.isArchived ? 'Вернуть из архива' : 'В архив'}</span>
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

      <div className="tabs-line" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={detailTab === 'OVERVIEW'}
          className={`tab-line ${detailTab === 'OVERVIEW' ? 'on' : ''}`}
          onClick={() => setDetailTab('OVERVIEW')}
        >
          Обзор
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={detailTab === 'APPTS'}
          className={`tab-line ${detailTab === 'APPTS' ? 'on' : ''}`}
          onClick={() => setDetailTab('APPTS')}
        >
          Записи <span className="small muted">{apptsCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={detailTab === 'VACC'}
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
                <div>Питомец в архиве: история сохранена, новые записи недоступны.</div>
              </div>
            )}

            <dl className="kv" style={{ margin: 0 }}>
              <dt>Вид</dt>
              <dd>{spName}</dd>
              <dt>Пол</dt>
              <dd>{pet.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
              <dt>Дата рождения</dt>
              <dd className="tnum">
                {birthIso ? (
                  <>
                    {formatIsoDateDisplay(birthIso)} <span className="muted">({age})</span>
                  </>
                ) : (
                  '—'
                )}
              </dd>
              <dt>Вес</dt>
              <dd className="tnum">{formatWeightRu(pet.weightKg)}</dd>
              <dt>Заметки</dt>
              <dd>{pet.notes || '—'}</dd>
            </dl>
          </div>
        )}

        {detailTab === 'APPTS' && (
          <div className="col" style={{ gap: '2px', margin: '0 -10px' }}>
            {loadingAppts && petAppts.length === 0 ? (
              <div className="empty" style={{ padding: '24px' }}>
                <div className="spinner" />
                <span className="small muted">Загрузка истории записей…</span>
              </div>
            ) : petAppts.length === 0 ? (
              <div className="empty" style={{ padding: '24px' }}>
                Записей пока нет
              </div>
            ) : (
              petAppts.map((a) => {
                const svc = servicesMap[a.serviceId] || a.service;
                const vet = veterinariansMap[a.veterinarianId] || a.veterinarian;
                const vetName = vet
                  ? getDoctorDisplay(vet).name
                  : a.veterinarianName || 'Врач клиники';
                const statusShort = APPOINTMENT_STATUS_META[a.status]?.short || a.status;

                return (
                  <Link
                    key={a.id}
                    href={`/client/appointments?sel=${encodeURIComponent(a.id)}`}
                    className="lrow"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="datebox">
                      <b>{formatDateRu(a.startAt, { day: '2-digit' })}</b>
                      <span>{formatDateRu(a.startAt, { month: 'short' }).replace(/\.$/, '')}</span>
                    </span>
                    <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                      <span className="cell-main">{svc?.name || a.serviceName || 'Приём'}</span>
                      <span className="cell-sub tnum">
                        {formatSlotTime(a.startAt)} · {vetName}
                      </span>
                    </span>
                    <span className={`badge st badge-${a.status}`}>{statusShort}</span>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {detailTab === 'VACC' && (
          <div className="col" style={{ gap: '2px', margin: '0 -10px' }}>
            {petVaccs.length === 0 ? (
              <div className="empty" style={{ padding: '24px' }}>
                Прививок пока нет
              </div>
            ) : (
              petVaccs.map((v) => {
                const adminIso = getMoscowDateKey(v.administeredOn || v.administeredAt) || v.administeredOn;
                const dueInfo = getPetVacDueInfo(v.nextDueOn || v.validUntil);
                const vacName = v.name || v.vaccineName || 'Вакцинация';

                return (
                  <Link
                    key={v.id}
                    href={`/client/vaccinations?petId=${encodeURIComponent(pet.id)}&sel=${encodeURIComponent(v.id)}`}
                    className="lrow"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="pet-ava" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                      <Syringe className="ic" />
                    </span>
                    <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                      <span className="cell-main">{vacName}</span>
                      <span className="cell-sub tnum">Введена {formatIsoDateDisplay(adminIso)}</span>
                    </span>
                    <span className={`badge ${dueInfo.cls}`}>
                      {dueInfo.cls === 'due-none' ? dueInfo.text : dueInfo.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
