'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Syringe } from 'lucide-react';
import type { Pet, Vaccination } from '@/modules/client/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { formatIsoDateDisplay, getMoscowDateKey, getSpeciesTone } from '@/shared/lib';
import { getVaccinationStatus } from '../_hooks/useClientVaccinations';

export interface PetVaccinationPassportProps {
  pet: Pet;
  vaccines: Vaccination[];
  speciesMap: Record<string, string>;
  selectedVacId?: string | null;
  onSelectVac: (vac: Vaccination) => void;
}

/**
 * Электронный паспорт вакцинации конкретного питомца со строками, открывающими детали.
 */
export function PetVaccinationPassport({
  pet,
  vaccines,
  speciesMap,
  selectedVacId,
  onSelectVac,
}: PetVaccinationPassportProps) {
  const speciesLabel =
    pet.species?.name || pet.speciesName || speciesMap[pet.speciesId] || 'Питомец';
  const tone = getSpeciesTone(speciesLabel, speciesMap);

  return (
    <section className="island" aria-label={`Прививки: ${pet.name}`}>
      <div className="island-head">
        <div className="row" style={{ gap: '12px' }}>
          <span className={`t-ava tone-${tone}`}>
            <SpeciesIcon species={tone} size={20} />
          </span>
          <div className="col" style={{ gap: '1px' }}>
            <span className="island-title">{pet.name}</span>
            <span className="small muted">
              {speciesLabel}
              {pet.breed ? ` · ${pet.breed}` : ''}
              {pet.isArchived ? ' · в архиве' : ''}
            </span>
          </div>
        </div>

        {!pet.isArchived && (
          <Link
            href={`/client/book?petId=${encodeURIComponent(pet.id)}`}
            className="btn btn-outline btn-sm"
          >
            <Plus className="ic" />
            <span>Записать на вакцинацию</span>
          </Link>
        )}
      </div>

      {vaccines.length === 0 ? (
        <div className="island-body">
          <div className="empty">
            <div className="empty-art">
              <Syringe className="ic ic-40" />
            </div>
            <span className="empty-title">У питомца {pet.name} пока нет прививок</span>
            <span>Прививки вносит врач после приёма</span>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <div
            className="dtable"
            style={{ '--cols': '1.8fr 1.1fr 1.2fr 1.2fr', minWidth: '550px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Вакцина</span>
              <span>Введена</span>
              <span>Следующая доза</span>
              <span>Статус</span>
            </div>
            {vaccines.map((v) => {
              const name = v.name || v.vaccineName || 'Вакцинация';
              const rawAdmin = v.administeredOn || v.administeredAt;
              const adminDate = rawAdmin
                ? formatIsoDateDisplay(getMoscowDateKey(rawAdmin) || rawAdmin)
                : '—';
              const rawNextDue = v.nextDueOn || v.validUntil;
              const nextDueDisplay = rawNextDue
                ? formatIsoDateDisplay(getMoscowDateKey(rawNextDue) || rawNextDue)
                : 'По показаниям';
              const status = getVaccinationStatus(rawNextDue);
              const isSelected = selectedVacId === v.id;

              return (
                <button
                  key={v.id}
                  type="button"
                  className={`trow ${isSelected ? 'sel' : ''}`}
                  onClick={() => onSelectVac(v)}
                >
                  <span className="row" style={{ gap: '8px' }}>
                    <Syringe className="ic muted" />
                    <span className="cell-main">{name}</span>
                  </span>
                  <span className="tnum">{adminDate}</span>
                  <span className="tnum">{nextDueDisplay}</span>
                  <span>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
