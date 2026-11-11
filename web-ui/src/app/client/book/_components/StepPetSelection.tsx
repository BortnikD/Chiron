import React from 'react';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { calculateAgeRu, getSpeciesTone } from '@/shared/lib';

export interface StepPetSelectionProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
  speciesMap: Record<string, string>;
  loading?: boolean;
}

/**
 * Шаг 1: выбор питомца («Кого записываем?»).
 */
export const StepPetSelection: React.FC<StepPetSelectionProps> = ({
  pets,
  selectedPet,
  onSelectPet,
  speciesMap,
  loading = false,
}) => {
  return (
    <div className="col" style={{ gap: '12px' }}>
      <div className="row between wrap" style={{ alignItems: 'center' }}>
        <span className="h2">Кого записываем?</span>
        <Link href="/client/pets?action=create" className="btn btn-sm btn-outline">
          <Plus className="ic" />
          <span>Добавить питомца</span>
        </Link>
      </div>

      {loading ? (
        <div className="empty">
          <div className="spinner" />
          <span className="small muted">Загрузка списка питомцев...</span>
        </div>
      ) : pets.length === 0 ? (
        <div className="empty">
          <span className="empty-title">У вас пока нет питомцев</span>
          <span className="muted">Добавьте питомца в разделе «Питомцы», чтобы оформить запись на приём</span>
          <Link href="/client/pets?action=create" className="btn btn-primary">
            <Plus className="ic" />
            <span>Добавить питомца</span>
          </Link>
        </div>
      ) : (
        <div className="cards">
          {pets.map((p) => {
            const isSel = selectedPet?.id === p.id;
            const spName = p.species?.name || p.speciesName || speciesMap[p.speciesId] || 'Питомец';
            const spTone = getSpeciesTone(p.species?.name || p.speciesId, speciesMap);
            const ageLabel = calculateAgeRu(p.birthDate);

            return (
              <button
                key={p.id}
                type="button"
                disabled={p.isArchived}
                aria-disabled={p.isArchived}
                title={p.isArchived ? 'Архивный питомец — запись недоступна' : undefined}
                className={`tcard tone-${spTone} ${isSel ? 'sel' : ''} ${p.isArchived ? 'disabled' : ''}`}
                onClick={() => onSelectPet(p)}
                style={p.isArchived ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
              >
                <div className="tcard-head">
                  <span className="t-ava lg">
                    <SpeciesIcon species={spTone} size={26} />
                  </span>
                  <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
                    <span className="tcard-title">{p.name}</span>
                    <span className="cell-sub">
                      {spName}
                      {ageLabel !== '—' ? ` · ${ageLabel}` : ''}
                    </span>
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
