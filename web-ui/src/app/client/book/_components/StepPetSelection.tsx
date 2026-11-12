import React from 'react';
import Link from 'next/link';
import { Check, Plus, AlertCircle } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { calculateAgeRu, getSpeciesTone } from '@/shared/lib';

export interface StepPetSelectionProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
  speciesMap: Record<string, string>;
  loading?: boolean;
  allowedSpeciesIds?: string[];
  doctorLabel?: string;
  onResetDoctorFilter?: () => void;
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
  allowedSpeciesIds,
  doctorLabel,
  onResetDoctorFilter,
}) => {
  const allowedSet =
    Array.isArray(allowedSpeciesIds) && allowedSpeciesIds.length > 0
      ? new Set(allowedSpeciesIds)
      : null;
  const activePets = pets.filter((p) => !p.isArchived);
  const hasCompatibleActivePet =
    !allowedSet || activePets.some((p) => allowedSet.has(p.speciesId));
  const allowedSpeciesLabels = allowedSpeciesIds
    ? allowedSpeciesIds.map((id) => speciesMap[id]).filter(Boolean)
    : [];

  return (
    <div className="col" style={{ gap: '12px' }}>
      <div className="row between wrap" style={{ alignItems: 'center' }}>
        <div className="col" style={{ gap: '2px' }}>
          <span className="h2">Кого записываем?</span>
          {allowedSet && doctorLabel && (
            <span className="small muted">
              Доступны виды животных, с которыми работает {doctorLabel}
            </span>
          )}
        </div>
        <Link href="/client/pets?action=create" className="btn btn-sm btn-outline">
          <Plus className="ic" />
          <span>Добавить питомца</span>
        </Link>
      </div>

      {!loading && allowedSet && activePets.length > 0 && !hasCompatibleActivePet && (
        <div className="alert" role="status">
          <AlertCircle className="ic" />
          <div className="row between wrap grow" style={{ gap: '10px', alignItems: 'center' }}>
            <span className="small">
              {doctorLabel ? (
                <>
                  Врач <b>{doctorLabel}</b> принимает только следующие виды:{' '}
                </>
              ) : (
                <>Выбранный врач принимает только следующие виды: </>
              )}
              <b>{allowedSpeciesLabels.join(', ') || 'по профилю врача'}</b>. Среди ваших
              питомцев нет подходящего вида для записи к этому специалисту.
            </span>
            <div className="row wrap" style={{ gap: '8px' }}>
              {onResetDoctorFilter && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onResetDoctorFilter}
                >
                  Записаться к другому врачу
                </button>
              )}
              <Link href="/veterinarians" className="btn btn-outline btn-sm">
                Выбрать врача
              </Link>
            </div>
          </div>
        </div>
      )}

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
            const isSpeciesAllowed = !allowedSet || allowedSet.has(p.speciesId);
            const isDisabled = Boolean(p.isArchived || !isSpeciesAllowed);
            const spName = p.species?.name || p.speciesName || speciesMap[p.speciesId] || 'Питомец';
            const spTone = getSpeciesTone(p.species?.name || p.speciesId, speciesMap);
            const ageLabel = calculateAgeRu(p.birthDate);
            const disabledTitle = p.isArchived
              ? 'Архивный питомец — запись недоступна'
              : !isSpeciesAllowed
              ? 'Выбранный врач не принимает этот вид'
              : undefined;

            return (
              <button
                key={p.id}
                type="button"
                disabled={isDisabled}
                aria-disabled={isDisabled}
                title={disabledTitle}
                className={`tcard tone-${spTone} ${isSel ? 'sel' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => onSelectPet(p)}
                style={isDisabled ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
              >
                <div className="tcard-head">
                  <PetAvatar pet={p} tone={spTone} species={spTone} iconSize={26} className="t-ava lg" />
                  <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
                    <span className="tcard-title">{p.name}</span>
                    <span className="cell-sub">
                      {spName}
                      {ageLabel !== '—' ? ` · ${ageLabel}` : ''}
                    </span>
                  </span>
                  {p.isArchived ? (
                    <span className="badge">Архив</span>
                  ) : (
                    !isSpeciesAllowed && <span className="badge">Не принимает</span>
                  )}
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
