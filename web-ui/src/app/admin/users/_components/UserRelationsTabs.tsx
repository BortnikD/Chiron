'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import type { Pet, Appointment } from '@/modules/client/types';
import type { Service, Species, Veterinarian } from '@/modules/clinic/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import {
  APPOINTMENT_STATUS_META,
  calculateAgeRu,
  formatDateTimeCompact,
  getSpeciesTone,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface UserRelationsTabsProps {
  activeTab: 'pets' | 'appointments';
  pets: Pet[];
  appointments: Appointment[];
  speciesList: Species[];
  services: Service[];
  veterinarians: Veterinarian[];
  loading: boolean;
  error: string | null;
}

export const UserRelationsTabs: React.FC<UserRelationsTabsProps> = ({
  activeTab,
  pets,
  appointments,
  speciesList,
  services,
  veterinarians,
  loading,
  error,
}) => {
  if (error) {
    return (
      <div className="alert alert-destructive" role="alert">
        <AlertCircle size={16} className="ic" />
        <div>{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="empty" style={{ padding: 24 }}>
        <span className="spinner" aria-hidden="true" />
        <span className="muted">Загрузка…</span>
      </div>
    );
  }

  if (activeTab === 'pets') {
    return (
      <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
        {pets.map((p) => {
          const speciesName =
            p.species?.name ||
            p.speciesName ||
            speciesList.find((s) => s.id === p.speciesId)?.name ||
            'Питомец';
          const tone = getSpeciesTone(speciesName || p.speciesId, speciesList);
          return (
            <Link key={p.id} href={`/admin/pets?sel=${p.id}`} className="lrow">
              <PetAvatar
                pet={p}
                tone={tone}
                species={tone}
                iconSize={16}
                variant="full"
                className="pet-ava"
                style={{ width: 36, height: 36, borderRadius: 10 }}
              />
              <span className="col" style={{ gap: 1 }}>
                <span className="cell-main">{p.name}</span>
                <span className="cell-sub">
                  {speciesName} · {calculateAgeRu(p.birthDate)}
                </span>
              </span>
              {p.isArchived && <span className="badge">Архив</span>}
            </Link>
          );
        })}

        {pets.length === 0 && (
          <div className="empty" style={{ padding: 24 }}>
            Питомцев нет
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
      {appointments.map((a) => {
        const dt = formatDateTimeCompact(a.startAt);
        const [dd, mon] = dt.date.split(' ');
        const stMeta = APPOINTMENT_STATUS_META[a.status];
        const petName = pets.find((p) => p.id === a.petId)?.name || a.petName;
        const svcName =
          a.service?.name ||
          a.serviceName ||
          services.find((s) => s.id === a.serviceId)?.name ||
          'Услуга';
        const vet = veterinarians.find((v) => v.id === a.veterinarianId);
        const vetName = vet ? getDoctorDisplay(vet).name : a.veterinarianName;

        return (
          <Link key={a.id} href={`/admin/appointments?sel=${a.id}`} className="lrow">
            <span className="datebox">
              <b>{dd}</b>
              <span>{mon}</span>
            </span>
            <span className="col" style={{ gap: 1 }}>
              <span className="cell-main">
                {petName ? `${petName} — ${svcName}` : svcName}
              </span>
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
  );
};
