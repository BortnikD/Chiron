import React, { useMemo } from 'react';
import { Stethoscope, Check } from 'lucide-react';
import type { Veterinarian } from '@/modules/clinic/types';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { getSpecTone, pluralRu } from '@/shared/lib';

export interface StepDoctorSelectionProps {
  veterinarians: Veterinarian[];
  serviceSpecializationId?: string | null;
  petSpeciesId?: string | null;
  specsMap: Record<string, string>;
  isAnyVet: boolean;
  selectedVet: Veterinarian | null;
  onSelectAnyVet: () => void;
  onSelectVet: (vet: Veterinarian) => void;
  lockedServiceName?: string | null;
  onResetServiceFilter?: () => void;
}

/**
 * Шаг 3: выбор врача («Любой врач» или конкретный специалист).
 */
export const StepDoctorSelection: React.FC<StepDoctorSelectionProps> = ({
  veterinarians,
  serviceSpecializationId,
  petSpeciesId,
  specsMap,
  isAnyVet,
  selectedVet,
  onSelectAnyVet,
  onSelectVet,
  lockedServiceName,
  onResetServiceFilter,
}) => {
  const filteredVeterinarians = useMemo(() => {
    const hasAnySpeciesIds = veterinarians.some(
      (v) => Array.isArray(v.speciesIds) && v.speciesIds.length > 0
    );
    return veterinarians.filter((v) => {
      if (v.isActive === false) return false;
      if (serviceSpecializationId && v.specializationId !== serviceSpecializationId) return false;
      if (
        petSpeciesId &&
        hasAnySpeciesIds &&
        Array.isArray(v.speciesIds) &&
        !v.speciesIds.includes(petSpeciesId)
      ) {
        return false;
      }
      return true;
    });
  }, [veterinarians, serviceSpecializationId, petSpeciesId]);

  const serviceTone = getSpecTone(serviceSpecializationId);

  return (
    <div className="col" style={{ gap: '12px' }}>
      <div className="row between wrap" style={{ gap: '8px', alignItems: 'center' }}>
        <span className="h2">Врач</span>
        {lockedServiceName && (
          <div className="row wrap" style={{ gap: '8px', alignItems: 'center' }}>
            <span className="small muted">
              Услуга: <b>{lockedServiceName}</b>
            </span>
            {onResetServiceFilter && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onResetServiceFilter}
              >
                Изменить услугу
              </button>
            )}
          </div>
        )}
      </div>

      <div className="cards">
        <button
          type="button"
          className={`tcard tone-${serviceTone} ${isAnyVet ? 'sel' : ''}`}
          onClick={onSelectAnyVet}
        >
          <div className="tcard-head">
            <span className="t-ava lg round">
              <Stethoscope className="ic ic-20" />
            </span>
            <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
              <span className="tcard-title">Любой врач</span>
              <span className="cell-sub">Покажем все свободные окна</span>
            </span>
            {isAnyVet && (
              <span className="tcard-check">
                <Check className="ic" />
              </span>
            )}
          </div>
        </button>

        {filteredVeterinarians.map((v) => {
          const isSel = !isAnyVet && selectedVet?.id === v.id;
          const tone = getSpecTone(v.specializationId);
          const { name, initials, specName } = getDoctorDisplay(v, specsMap);

          return (
            <button
              key={v.id}
              type="button"
              className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
              onClick={() => onSelectVet(v)}
            >
              <div className="tcard-head">
                <VetAvatar
                  vet={v}
                  initials={initials}
                  tone={tone}
                  className="t-ava lg round"
                  alt={name}
                />
                <span className="col grow" style={{ gap: '3px', minWidth: 0 }}>
                  <span className="tcard-title">{name}</span>
                  <span className="row" style={{ gap: '6px' }}>
                    <span className="t-badge">{specName}</span>
                    <span className="cell-sub">
                      стаж {v.experienceYears} {pluralRu(v.experienceYears, 'год', 'года', 'лет')}
                    </span>
                  </span>
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
    </div>
  );
};
