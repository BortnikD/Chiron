'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { getSpeciesTone } from '@/shared/lib';
import type { PetVaccines } from '../_hooks/useClientVaccinations';

export interface VaccinationsPetFilterProps {
  petVaccines: PetVaccines[];
  speciesMap: Record<string, string>;
  selectedPetId: string;
  onSelectPet: (petId: string) => void;
}

/**
 * Верхняя панель фильтра по питомцам, легенда статусов вакцинации и CTA записи.
 */
export function VaccinationsPetFilter({
  petVaccines,
  speciesMap,
  selectedPetId,
  onSelectPet,
}: VaccinationsPetFilterProps) {
  const bookHref =
    selectedPetId !== 'all'
      ? `/client/book?petId=${encodeURIComponent(selectedPetId)}`
      : '/client/book';

  return (
    <section className="island" aria-label="Фильтр по питомцам">
      <div className="island-head">
        <div className="seg" role="tablist" aria-label="Питомец">
          <button
            type="button"
            className={`seg-item ${selectedPetId === 'all' ? 'on' : ''}`}
            onClick={() => onSelectPet('all')}
          >
            <span>Все питомцы</span>
            <span className="small muted tnum">({petVaccines.length})</span>
          </button>
          {petVaccines.map(({ pet, hasOverdue }) => {
            const tone = getSpeciesTone(
              pet.species?.name || pet.speciesName || pet.speciesId,
              speciesMap
            );
            return (
              <button
                key={pet.id}
                type="button"
                className={`seg-item ${selectedPetId === pet.id ? 'on' : ''}`}
                onClick={() => onSelectPet(pet.id)}
              >
                <SpeciesIcon species={tone} size={15} />
                <span>{pet.name}</span>
                {hasOverdue && (
                  <span
                    className="dot"
                    style={{ background: 'var(--st-noshow-fg)' }}
                    aria-label="Есть просроченные прививки"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="row wrap" style={{ gap: '12px' }}>
          <div className="legend">
            <span>
              <i style={{ background: 'var(--st-noshow-fg)' }} />
              просрочена
            </span>
            <span>
              <i style={{ background: 'var(--st-pending-fg)' }} />
              ≤ 7 дней
            </span>
            <span>
              <i style={{ background: 'var(--muted-foreground)' }} />
              позже
            </span>
          </div>

          <Link href={bookHref} className="btn btn-primary btn-sm">
            <CalendarPlus className="ic" />
            <span>Записаться на прививку</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
