import React from 'react';
import Link from 'next/link';
import { Check, Plus, AlertCircle } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { Skeleton, SkeletonCircle } from '@/shared/components';
import { calculateAgeRu, getSpeciesTone } from '@/shared/lib';

export interface StepPetSelectionProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
  speciesMap: Record<string, string>;
  loading?: boolean;
  allowedSpeciesIds?: string[];
  doctorLabel?: string;
  serviceLabel?: string;
  onResetDoctorFilter?: () => void;
  onResetServiceFilter?: () => void;
  onOpenQuickAdd?: () => void;
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
  serviceLabel,
  onResetDoctorFilter,
  onResetServiceFilter,
  onOpenQuickAdd,
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
          {allowedSet && (doctorLabel || serviceLabel) && (
            <span className="small muted">
              {doctorLabel
                ? `Доступны виды животных, с которыми работает ${doctorLabel}`
                : `Доступны виды животных для услуги «${serviceLabel}»`}
            </span>
          )}
        </div>
        {onOpenQuickAdd ? (
          <button type="button" onClick={onOpenQuickAdd} className="btn btn-sm btn-outline">
            <Plus className="ic" />
            <span>Добавить питомца</span>
          </button>
        ) : (
          <Link href="/client/pets?action=create" className="btn btn-sm btn-outline">
            <Plus className="ic" />
            <span>Добавить питомца</span>
          </Link>
        )}
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
              {onResetServiceFilter && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onResetServiceFilter}
                >
                  Выбрать другую услугу
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
        <div className="cards">
          {[1, 2, 3].map((i) => (
            <div
              key={`pet-book-skel-${i}`}
              className="tcard static"
              style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}
            >
              <SkeletonCircle size={48} />
              <div className="col grow" style={{ gap: '6px' }}>
                <Skeleton width="100px" height="18px" borderRadius="4px" />
                <Skeleton width="140px" height="13px" borderRadius="4px" />
              </div>
            </div>
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div
          className="empty"
          style={{
            padding: '36px 20px',
            background: 'var(--surface-sunken)',
            borderRadius: '12px',
            border: '1px dashed var(--border)',
          }}
        >
          <span className="empty-title" style={{ fontSize: '18px' }}>
            У вас пока нет добавленных питомцев
          </span>
          <span className="muted" style={{ maxWidth: '420px', textAlign: 'center', lineHeight: 1.5 }}>
            Добавьте вашего любимца прямо сейчас — это займёт меньше минуты, и вы сможете сразу продолжить запись.
          </span>
          {onOpenQuickAdd ? (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
            >
              <Plus className="ic" />
              <span>Добавить первого питомца</span>
            </button>
          ) : (
            <Link href="/client/pets?action=create" className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Plus className="ic" />
              <span>Добавить питомца</span>
            </Link>
          )}
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
                  <span className="col grow" style={{ gap: '2px', minWidth: 0 }}>
                    <span className="tcard-title">{p.name}</span>
                    <span className="cell-sub">
                      {spName}
                      {p.breed ? ` (${p.breed})` : ''}
                      {ageLabel !== '—' ? ` · ${ageLabel}` : ''}
                    </span>
                    {p.isArchived ? (
                      <span className="row" style={{ marginTop: '2px' }}>
                        <span className="badge">Архив</span>
                      </span>
                    ) : (
                      !isSpeciesAllowed && (
                        <span className="row" style={{ marginTop: '2px' }}>
                          <span className="badge">Не принимает</span>
                        </span>
                      )
                    )}
                  </span>
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
