'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Calendar, Syringe, X } from 'lucide-react';
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
  formatWeightRu,
  getSpeciesTone,
  toIdNameMap,
} from '@/shared/lib';
import { getVetVaccinationDueInfo } from '../../dashboard/_components/vetHelpers';

export interface VetPatientDetailIslandProps {
  patient: Pet;
  speciesList: Species[];
  servicesMap?: Record<string, string>;
  appointments: Appointment[];
  vaccinations: Vaccination[];
  vaccinationsError?: string | null;
  onClose: () => void;
  onAddVaccination: () => void;
  onEditVaccination: (vac: Vaccination) => void;
}

export function VetPatientDetailIsland({
  patient,
  speciesList,
  servicesMap,
  appointments,
  vaccinations,
  vaccinationsError,
  onClose,
  onAddVaccination,
  onEditVaccination,
}: VetPatientDetailIslandProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'vaccinations'>('overview');

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);
  const speciesName = patient.species?.name || patient.speciesName || speciesMap[patient.speciesId] || '—';
  const tone = getSpeciesTone(
    patient.species?.name || patient.speciesName || patient.speciesId,
    speciesMap
  );

  const patientAppts = useMemo(
    () =>
      appointments
        .filter((a) => a.petId === patient.id)
        .slice()
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [appointments, patient.id]
  );

  const runtimeOwner = patient as Pet & {
    ownerName?: string | null;
    ownerPhone?: string | null;
    ownerEmail?: string | null;
  };
  const hasOwnerContact = Boolean(
    runtimeOwner.ownerName || runtimeOwner.ownerPhone || runtimeOwner.ownerEmail
  );

  return (
    <section className="island detail-island xl:w-[440px]" aria-label="Карточка пациента">
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
          Приёмы у меня <span className="small muted">{patientAppts.length}</span>
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
              <dd className="tnum">{formatWeightRu(patient.weightKg)}</dd>
              <dt>Заметки</dt>
              <dd>{patient.notes || '—'}</dd>
              {hasOwnerContact && (
                <>
                  <dt>Владелец</dt>
                  <dd>
                    {[runtimeOwner.ownerName, runtimeOwner.ownerPhone, runtimeOwner.ownerEmail]
                      .filter(Boolean)
                      .join(' · ')}
                  </dd>
                </>
              )}
            </dl>

            {!hasOwnerContact && (
              <span className="small muted">Контакты владельца врачу недоступны.</span>
            )}

            <div className="col" style={{ gap: 6 }}>
              <button type="button" className="btn btn-outline btn-block" onClick={onAddVaccination}>
                <Syringe size={14} />
                Внести прививку
              </button>
              <Link
                href={`/vet/appointments?petId=${encodeURIComponent(patient.id)}`}
                className="btn btn-ghost btn-block"
              >
                <Calendar size={14} />
                Все приёмы
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="col" style={{ gap: 2, margin: '0 -10px' }}>
            {patientAppts.map((a) => {
              const dd = formatDateRu(a.startAt, { day: '2-digit' });
              const mon = formatDateRu(a.startAt, { month: 'short' }).replace('.', '');
              const time = formatSlotTime(a.startAt);
              const serviceName =
                a.serviceName || a.service?.name || servicesMap?.[a.serviceId] || 'Приём';

              return (
                <button
                  key={a.id}
                  type="button"
                  className="lrow"
                  onClick={() => router.push(`/vet/appointments?sel=${encodeURIComponent(a.id)}`)}
                >
                  <span className="datebox">
                    <b>{dd}</b>
                    <span>{mon}</span>
                  </span>
                  <span className="col" style={{ gap: 1 }}>
                    <span className="cell-main">{serviceName}</span>
                    <span className="cell-sub tnum">
                      {time} · {formatCurrency(a.priceSnapshot ?? a.price ?? 0)}
                    </span>
                  </span>
                  <span className={`badge st badge-${a.status}`}>
                    {APPOINTMENT_STATUS_META[a.status]?.short || a.status}
                  </span>
                </button>
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

            <div className="col" style={{ gap: 2, margin: '0 -10px' }}>
              {vaccinations.map((v) => {
                const due = getVetVaccinationDueInfo(v.nextDueOn);
                return (
                  <button
                    key={v.id}
                    type="button"
                    className="lrow"
                    onClick={() => onEditVaccination(v)}
                  >
                    <span
                      className="pet-ava"
                      style={{ width: 36, height: 36, borderRadius: 10 }}
                    >
                      <Syringe size={16} />
                    </span>
                    <span className="col" style={{ gap: 1 }}>
                      <span className="cell-main">{v.name}</span>
                      <span className="cell-sub tnum">
                        Введена {formatIsoDateDisplay(v.administeredOn)}
                      </span>
                    </span>
                    <span className={`badge ${due.cls} tnum`}>
                      {due.label === '—' ? due.text : `${due.label}`}
                    </span>
                  </button>
                );
              })}

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
