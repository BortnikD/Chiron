'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Edit3, PawPrint, Syringe, X } from 'lucide-react';
import type { Pet, Vaccination } from '@/modules/client/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { formatIsoDateDisplay, getSpeciesTone } from '@/shared/lib';
import { getVetVaccinationDueInfo } from '../../dashboard/_components/vetHelpers';

export interface VetVaccinationDetailIslandProps {
  vaccination: Vaccination;
  pet?: Pet | null;
  speciesMap: Record<string, string>;
  onClose: () => void;
  onEdit: (vac: Vaccination) => void;
}

export const VetVaccinationDetailIsland: React.FC<VetVaccinationDetailIslandProps> = ({
  vaccination,
  pet,
  speciesMap,
  onClose,
  onEdit,
}) => {
  const petName = pet?.name || 'Пациент';
  const speciesName =
    pet?.species?.name ||
    pet?.speciesName ||
    (pet?.speciesId && speciesMap[pet.speciesId]) ||
    '—';
  const tone = getSpeciesTone(
    pet?.species?.name || pet?.speciesName || pet?.speciesId || 'cat',
    speciesMap
  );
  const due = getVetVaccinationDueInfo(vaccination.nextDueOn);

  return (
    <section className="island detail-island xl:w-[420px]" aria-label="Детали прививки">
      <div className="island-head">
        <div className="row" style={{ minWidth: 0 }}>
          <PetAvatar
            pet={pet}
            tone={tone}
            species={tone}
            iconSize={20}
            variant="full"
            className={`t-ava tone-${tone} detail-head-ava`}
          />
          <div className="col" style={{ gap: '2px', minWidth: 0 }}>
            <span className="h2" style={{ wordBreak: 'break-word' }}>
              {vaccination.name}
            </span>
            <span className="cell-sub">
              {petName} · {speciesName}
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

      <div className="island-body">
        <div className="col" style={{ gap: '16px' }}>
          <div className="row wrap">
            <span className={`badge ${due.cls}`}>
              <Syringe style={{ width: '12px', height: '12px' }} />
              {due.label === '—' ? 'Ревакцинация не задана' : `Срок: ${due.text}`}
            </span>
          </div>

          <dl className="kv" style={{ margin: 0 }}>
            <dt>Пациент</dt>
            <dd>
              <Link href={`/vet/patients?sel=${encodeURIComponent(vaccination.petId)}`}>
                {petName}
              </Link>{' '}
              <span className="muted">· {speciesName}</span>
            </dd>
            <dt>Введена</dt>
            <dd className="tnum">{formatIsoDateDisplay(vaccination.administeredOn)}</dd>
            <dt>Следующая доза</dt>
            <dd className="tnum">{due.label}</dd>
            <dt>Приём</dt>
            <dd>
              {vaccination.appointmentId ? (
                <Link
                  href={`/vet/appointments?sel=${encodeURIComponent(vaccination.appointmentId)}`}
                >
                  Открыть запись
                </Link>
              ) : (
                'Без привязки'
              )}
            </dd>
          </dl>

          <div className="sep" />

          <div className="col" style={{ gap: '6px' }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => onEdit(vaccination)}
            >
              <Edit3 className="ic" />
              <span>Изменить прививку</span>
            </button>

            <Link
              href={`/vet/patients?sel=${encodeURIComponent(vaccination.petId)}`}
              className="btn btn-outline btn-block"
            >
              <PawPrint className="ic" />
              <span>Карточка пациента</span>
            </Link>

            {vaccination.appointmentId && (
              <Link
                href={`/vet/appointments?sel=${encodeURIComponent(vaccination.appointmentId)}`}
                className="btn btn-ghost btn-block"
              >
                <Calendar className="ic" />
                <span>Перейти к приёму</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
