import React from 'react';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { getSpeciesTone } from '@/shared/lib';

export interface StepPetSelectionProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
  speciesMap: Record<string, string>;
}

/**
 * Шаг 1: выбор питомца.
 * Карточки питомцев с индикацией выбранного, иконками видов и возможностью перехода к добавлению.
 */
export const StepPetSelection: React.FC<StepPetSelectionProps> = ({
  pets,
  selectedPet,
  onSelectPet,
  speciesMap,
}) => {
  return (
    <div className="col" style={{ gap: '12px' }}>
      <div className="row between wrap" style={{ alignItems: 'center' }}>
        <span className="h2">Кого записываем?</span>
        <Link
          href="/client/pets"
          className="btn btn-sm btn-outline"
          style={{ textDecoration: 'none', gap: '6px' }}
        >
          <Plus className="ic" />
          <span>Добавить питомца</span>
        </Link>
      </div>

      {pets.length === 0 ? (
        <div className="empty" style={{ padding: '32px 16px' }}>
          <span className="empty-title">У вас пока нет добавленных питомцев</span>
          <span className="muted">Добавьте питомца в профиль, чтобы оформить запись на приём</span>
          <div style={{ marginTop: '12px' }}>
            <Link
              href="/client/pets"
              className="btn btn-primary"
              style={{ textDecoration: 'none', gap: '6px' }}
            >
              <Plus className="ic" />
              <span>Добавить питомца</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="cards">
          {pets.map((p) => {
            const isSel = selectedPet?.id === p.id;
            const spName = speciesMap[p.speciesId] || 'Питомец';
            const spTone = getSpeciesTone(p.speciesId, speciesMap);

            return (
              <button
                key={p.id}
                type="button"
                disabled={p.isArchived}
                className={`tcard tone-${spTone} ${isSel ? 'sel' : ''}`}
                onClick={() => onSelectPet(p)}
                style={{
                  textAlign: 'left',
                  cursor: p.isArchived ? 'not-allowed' : 'pointer',
                  opacity: p.isArchived ? 0.6 : 1,
                }}
              >
                <div className="tcard-head">
                  <span className="t-ava lg">
                    <SpeciesIcon species={spTone} size={24} />
                  </span>
                  <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
                    <span className="tcard-title">{p.name}</span>
                    <span className="cell-sub">{spName}</span>
                  </span>
                  {p.isArchived && <span className="badge">Архив</span>}
                  {isSel && (
                    <span className="tcard-check">
                      <Check className="ic" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
