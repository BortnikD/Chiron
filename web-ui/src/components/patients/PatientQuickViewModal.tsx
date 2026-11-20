'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { X, AlertCircle, Syringe, Calendar, PawPrint } from 'lucide-react';
import type { Pet, Appointment, Vaccination } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import {
  APPOINTMENT_STATUS_META,
  calculateAgeRu,
  formatCurrency,
  formatDateShort,
  formatIsoDateDisplay,
  formatSlotTime,
  getSpeciesTone,
  toIdNameMap,
} from '@/shared/lib';
import { vetApi } from '@/modules/vet/api';

export interface PatientQuickViewModalProps {
  isOpen: boolean;
  pet: Pet | null;
  speciesList?: Species[];
  speciesMap?: Record<string, string>;
  servicesMap?: Record<string, string>;
  appointments?: Appointment[];
  onClose: () => void;
  onOpenAppointment?: (appointment: Appointment) => void;
}

export function PatientQuickViewModal({
  isOpen,
  pet,
  speciesList = [],
  speciesMap: externalSpeciesMap,
  servicesMap = {},
  appointments = [],
  onClose,
  onOpenAppointment,
}: PatientQuickViewModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'vaccinations'>('overview');
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loadingVac, setLoadingVac] = useState(false);
  const [vacError, setVacError] = useState<string | null>(null);

  const resolvedSpeciesMap = useMemo(() => {
    if (externalSpeciesMap) return externalSpeciesMap;
    return toIdNameMap(speciesList);
  }, [externalSpeciesMap, speciesList]);

  const petSpeciesName =
    pet?.species?.name ||
    pet?.speciesName ||
    (pet?.speciesId ? resolvedSpeciesMap[pet.speciesId] : '') ||
    '—';

  const tone = getSpeciesTone(
    pet?.species?.name || pet?.speciesName || pet?.speciesId || 'cat',
    resolvedSpeciesMap
  );

  const petAppts = useMemo(() => {
    if (!pet?.id) return [];
    return appointments
      .filter((a) => a.petId === pet.id)
      .slice()
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [appointments, pet?.id]);

  useEffect(() => {
    if (!isOpen || !pet?.id) {
      setVaccinations([]);
      setVacError(null);
      setLoadingVac(false);
      return;
    }
    let cancelled = false;
    setLoadingVac(true);
    setVacError(null);
    vetApi
      .getVaccinations({ page: 0, size: 50, petId: pet.id })
      .then((res) => {
        if (!cancelled) {
          setVaccinations(res?.items || []);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setVacError('Не удалось загрузить данные о прививках');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingVac(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, pet?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !pet) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Карточка пациента" onClick={onClose}>
      <div className="dialog dialog-lg max-w-640" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <div className="row between items-start gap-md">
            <div className="row gap-md min-w-0 items-center">
              <PetAvatar
                pet={pet}
                tone={tone}
                species={tone}
                iconSize={24}
                className={`pet-ava tone-${tone}`}
              />
              <div className="col gap-2xs min-w-0">
                <span className="dialog-title break-words">
                  {pet.name}
                </span>
                <span className="dialog-desc">
                  {petSpeciesName} · {pet.gender === 'MALE' ? 'Самец' : 'Самка'} · {calculateAgeRu(pet.birthDate)}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="tabs-line px-md" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`tab-line ${activeTab === 'overview' ? 'on' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Обзор
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'appointments'}
            className={`tab-line ${activeTab === 'appointments' ? 'on' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Приёмы <span className="small muted">{petAppts.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vaccinations'}
            className={`tab-line ${activeTab === 'vaccinations' ? 'on' : ''}`}
            onClick={() => setActiveTab('vaccinations')}
          >
            Прививки <span className="small muted">{vaccinations.length}</span>
          </button>
        </div>

        <div className="dialog-body modal-body-scroll">
          {activeTab === 'overview' && (
            <div className="col gap-md">
              <dl className="kv m-0">
                <dt>Вид</dt>
                <dd>{petSpeciesName}</dd>
                <dt>Пол</dt>
                <dd>{pet.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
                <dt>Возраст</dt>
                <dd>{calculateAgeRu(pet.birthDate)}</dd>
                <dt>Дата рождения</dt>
                <dd>{formatIsoDateDisplay(pet.birthDate) || '—'}</dd>
                <dt>Вес</dt>
                <dd>{pet.weightKg != null ? `${String(pet.weightKg).replace('.', ',')} кг` : '—'}</dd>
                <dt>Чип</dt>
                <dd>{pet.chipNumber || '—'}</dd>
                <dt>Статус</dt>
                <dd>
                  <span className={`badge ${pet.isArchived ? 'badge-muted' : 'badge-accent'}`}>
                    {pet.isArchived ? 'В архиве' : 'Активен'}
                  </span>
                </dd>
              </dl>

              {pet.notes && (
                <div className="col gap-xs">
                  <span className="field-label text-xs">Особые отметки / заметки:</span>
                  <div className="card p-sm bg-muted text-sm">
                    {pet.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="col gap-sm">
              {petAppts.length === 0 ? (
                <div className="empty empty-p">
                  <PawPrint className="empty-art" size={32} />
                  <span className="empty-title">Приёмов не найдено</span>
                  <span className="small muted">История визитов пуста</span>
                </div>
              ) : (
                petAppts.map((appt) => {
                  const meta = APPOINTMENT_STATUS_META[appt.status];
                  return (
                    <div
                      key={appt.id}
                      className="card row between p-sm items-center"
                    >
                      <div className="col gap-2xs">
                        <span className="cell-main">
                          {servicesMap[appt.serviceId] || appt.serviceName || 'Приём'}
                        </span>
                        <span className="cell-sub tnum">
                          {formatDateShort(appt.startAt)}, {formatSlotTime(appt.startAt)}–{formatSlotTime(appt.endAt)}
                        </span>
                      </div>
                      <div className="row gap-sm items-center">
                        <span className={`badge st badge-${appt.status}`}>
                          {meta?.label || appt.status}
                        </span>
                        <span className="tnum font-medium text-sm">
                          {formatCurrency(appt.priceSnapshot ?? appt.price ?? 0)}
                        </span>
                        {onOpenAppointment && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              onOpenAppointment(appt);
                              onClose();
                            }}
                          >
                            Открыть
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'vaccinations' && (
            <div className="col gap-sm">
              {vacError && (
                <div className="alert alert-destructive" role="alert">
                  <AlertCircle className="ic" size={16} />
                  <span>{vacError}</span>
                </div>
              )}

              {loadingVac ? (
                <div className="empty empty-p">
                  <span className="spinner" aria-hidden="true" />
                  <span className="small muted">Загрузка прививок…</span>
                </div>
              ) : vaccinations.length === 0 ? (
                <div className="empty empty-p">
                  <Syringe className="empty-art" size={32} />
                  <span className="empty-title">Прививок не найдено</span>
                  <span className="small muted">Вакцинация ещё не вносилась</span>
                </div>
              ) : (
                vaccinations.map((vac) => {
                  const adminDate = formatIsoDateDisplay(
                    vac.administeredOn ? vac.administeredOn.slice(0, 10) : null
                  );
                  const nextDueDate = formatIsoDateDisplay(
                    vac.nextDueOn ? vac.nextDueOn.slice(0, 10) : null
                  );
                  return (
                    <div
                      key={vac.id}
                      className="card col p-sm gap-xs"
                    >
                      <div className="row between items-start">
                        <span className="cell-main font-semibold">
                          {vac.name || vac.vaccineName || 'Вакцинация'}
                        </span>
                        {vac.batchNumber && (
                          <span className="badge badge-outline text-xs">
                            Серия: {vac.batchNumber}
                          </span>
                        )}
                      </div>
                      <div className="row wrap small muted gap-md">
                        <span>Введено: <strong className="tnum text-foreground">{adminDate || '—'}</strong></span>
                        {nextDueDate && (
                          <span>Ревакцинация: <strong className="tnum text-foreground">{nextDueDate}</strong></span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="dialog-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
