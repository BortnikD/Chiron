'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Edit2, Archive, Trash2, Syringe, X, AlertCircle } from 'lucide-react';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { EntityPhotoControl } from '@/components/ui/EntityPhotoControl';
import {
  APPOINTMENT_STATUS_META,
  calculateAgeRu,
  formatDateTimeCompact,
  formatIsoDateDisplay,
  getMoscowTodayIso,
  getSpeciesTone,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import type { PetDetailIslandProps, PetDetailTab } from './types';

function getVaccinationBadgeClass(nextDueOn?: string | null): string {
  if (!nextDueOn) return 'due-none';
  const today = getMoscowTodayIso();
  const iso = nextDueOn.slice(0, 10);
  if (iso < today) return 'due-over';
  const soonIso = getMoscowTodayIso(30);
  if (iso <= soonIso) return 'due-soon';
  return 'badge-accent';
}

/**
 * Правая панель детального просмотра питомца:
 * вкладки «Обзор», «Записи», «Прививки», карточки истории, быстрые действия.
 */
export const PetDetailIsland: React.FC<PetDetailIslandProps> = ({
  pet,
  speciesList,
  users,
  services,
  veterinarians,
  appointments,
  vaccinations,
  loadingDetails,
  detailsError,
  onClose,
  onEdit,
  onToggleArchive,
  onDelete,
  onAddVaccination,
  onUploadPhoto,
  onDeletePhoto,
}) => {
  const [activeTab, setActiveTab] = useState<PetDetailTab>('overview');

  const speciesName = speciesList.find((s) => s.id === pet.speciesId)?.name || '—';
  const owner = users.find((u) => u.id === pet.ownerId);
  const ownerName = owner?.fullName || owner?.email || '—';
  const weightText = pet.weightKg != null ? `${String(pet.weightKg).replace('.', ',')} кг` : '—';
  const tone = getSpeciesTone(pet.species?.name || speciesName || pet.speciesId, speciesList);

  return (
    <section className="island detail-island" aria-label="Питомец">
      <div className="island-head">
        <div className="row">
          <PetAvatar
            pet={pet}
            tone={tone}
            species={tone}
            iconSize={20}
            className={`pet-ava tone-${tone} detail-head-ava`}
            variant="full"
          />
          <div className="col" style={{ gap: 0 }}>
            <span className="h2">{pet.name}</span>
            <span className="cell-sub">
              {speciesName} ·{' '}
              {pet.gender === 'MALE' ? 'Самец' : 'Самка'} ·{' '}
              {calculateAgeRu(pet.birthDate)}
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
        {detailsError && (
          <div className="alert alert-destructive" role="alert" style={{ marginBottom: 12 }}>
            <AlertCircle className="ic" size={16} />
            <span>{detailsError}</span>
          </div>
        )}
        {loadingDetails && (activeTab === 'appointments' || activeTab === 'vaccinations') && (
          <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <span className="spinner" aria-hidden="true" />
            <span className="small muted">Загружаем историю…</span>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="col" style={{ gap: 14 }}>
            <EntityPhotoControl
              photo={pet}
              previewClassName={`t-ava lg tone-${tone}`}
              previewAlt={pet.name}
              previewFallback={<SpeciesIcon species={tone} size={24} />}
              hidePreview
              onUpload={(file) => onUploadPhoto(pet.id, file)}
              onDelete={() => onDeletePhoto(pet.id)}
            />
            <dl className="kv" style={{ margin: 0 }}>
              <dt>Владелец</dt>
              <dd>
                <Link href={`/admin/users?sel=${pet.ownerId}`} className="linkish">
                  {ownerName}
                </Link>
              </dd>
              <dt>Вид</dt>
              <dd>{speciesName}</dd>
              <dt>Пол</dt>
              <dd>{pet.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
              <dt>Дата рождения</dt>
              <dd className="tnum">
                {pet.birthDate ? formatIsoDateDisplay(pet.birthDate.slice(0, 10)) : 'Не указана'}
              </dd>
              <dt>Вес</dt>
              <dd className="tnum">{weightText}</dd>
              <dt>Заметки</dt>
              <dd>{pet.notes || '—'}</dd>
              <dt>Статус</dt>
              <dd>{pet.isArchived ? 'В архиве' : 'Активен'}</dd>
            </dl>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
            {appointments.map((a) => {
              const dt = formatDateTimeCompact(a.startAt);
              const [day, month] = dt.date.split(' ');
              const stMeta = APPOINTMENT_STATUS_META[a.status];
              const svcName =
                a.service?.name ||
                a.serviceName ||
                services.find((s) => s.id === a.serviceId)?.name ||
                'Услуга клиники';
              const vet = veterinarians.find((v) => v.id === a.veterinarianId);
              const vetName = vet ? getDoctorDisplay(vet).name : a.veterinarianName;

              return (
                <Link key={a.id} href={`/admin/appointments?sel=${a.id}`} className="lrow">
                  <span className="datebox">
                    <b>{day}</b>
                    <span>{month}</span>
                  </span>
                  <span className="col" style={{ gap: 1 }}>
                    <span className="cell-main">{svcName}</span>
                    <span className="cell-sub">
                      {dt.time}
                      {vetName ? ` · ${vetName}` : ''}
                    </span>
                  </span>
                  <span className={`badge st ${stMeta?.cls || `badge-${a.status}`}`}>
                    {stMeta?.short || a.status}
                  </span>
                </Link>
              );
            })}

            {appointments.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                Записей нет
              </div>
            )}
          </div>
        )}

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
                <Link key={v.id} href={`/admin/vaccinations?sel=${v.id}`} className="lrow">
                  <span
                    className="pet-ava"
                    style={{ width: 36, height: 36, borderRadius: 10 }}
                  >
                    <Syringe size={16} />
                  </span>
                  <span className="col" style={{ gap: 1 }}>
                    <span className="cell-main">{v.name}</span>
                    <span className="cell-sub">
                      Введена {formatIsoDateDisplay(v.administeredOn.slice(0, 10))}
                    </span>
                  </span>
                  {v.nextDueOn && (
                    <span className={`badge ${getVaccinationBadgeClass(v.nextDueOn)}`}>
                      до {formatIsoDateDisplay(v.nextDueOn.slice(0, 10))}
                    </span>
                  )}
                </Link>
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
