import React, { useMemo } from 'react';
import { Stethoscope, Check, AlertCircle } from 'lucide-react';
import type { Veterinarian, AvailableSlotResponse } from '@/modules/clinic/types';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { getDoctorDisplay, formatMoscowMonthDay, formatSlotTime, getSpecColor, getSpecTone, pluralRu } from '@/shared/lib';
import { useDictionaries } from '@/shared/hooks';

export interface StepDoctorSelectionProps {
  veterinarians: Veterinarian[];
  serviceSpecializationId?: string | null;
  petSpeciesId?: string | null;
  specsMap: Record<string, string>;
  isAnyVet: boolean;
  selectedVet: Veterinarian | null;
  selectedSlot?: AvailableSlotResponse | null;
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
  selectedSlot,
  onSelectAnyVet,
  onSelectVet,
  lockedServiceName,
  onResetServiceFilter,
}) => {
  const { specializationsMap } = useDictionaries();

  const slotTimeStr = selectedSlot ? formatSlotTime(selectedSlot.startAt) : null;
  const slotDateStr = selectedSlot ? formatMoscowMonthDay(selectedSlot.startAt) : null;

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
  const serviceSpec = serviceSpecializationId
    ? specializationsMap.get(serviceSpecializationId)
    : undefined;
  const serviceSpecColor = serviceSpec?.color || getSpecColor(serviceSpecializationId);

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
          style={
            serviceSpecColor
              ? ({
                  '--tone': serviceSpecColor,
                  ...(isAnyVet
                    ? {
                        borderColor: serviceSpecColor,
                        boxShadow: `inset 0 0 0 1px ${serviceSpecColor}`,
                      }
                    : {}),
                } as React.CSSProperties)
              : undefined
          }
          onClick={onSelectAnyVet}
        >
          <div className="tcard-head">
            <span className="t-ava lg round">
              <Stethoscope className="ic ic-20" />
            </span>
            <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
              <span className="tcard-title">Любой врач</span>
              <span className="cell-sub">
                {selectedSlot
                  ? `Свободен (${slotDateStr} в ${slotTimeStr})`
                  : 'Покажем все свободные окна'}
              </span>
            </span>
            {isAnyVet && (
              <span
                className="tcard-check"
                style={serviceSpecColor ? { background: serviceSpecColor } : undefined}
              >
                <Check className="ic" />
              </span>
            )}
          </div>
        </button>

        {filteredVeterinarians.map((v) => {
          const isSel = !isAnyVet && selectedVet?.id === v.id;
          const tone = getSpecTone(v.specializationId);
          const spec = v.specialization || (v.specializationId ? specializationsMap.get(v.specializationId) : undefined);
          const specColor = spec?.color || getSpecColor(v.specializationId);
          const { name, initials, specName } = getDoctorDisplay(v, specsMap);
          const isAvailableAtSlot = selectedSlot ? selectedSlot.veterinarianIds.includes(v.id) : true;

          return (
            <button
              key={v.id}
              type="button"
              className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
              style={
                specColor
                  ? ({
                      '--tone': specColor,
                      ...(isSel
                        ? {
                            borderColor: specColor,
                            boxShadow: `inset 0 0 0 1px ${specColor}`,
                          }
                        : {}),
                    } as React.CSSProperties)
                  : undefined
              }
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
                  <span className="row items-center wrap" style={{ gap: '6px' }}>
                    <span
                      className="t-badge"
                      style={
                        specColor
                          ? ({
                              '--tone': specColor,
                              backgroundColor: `color-mix(in srgb, ${specColor} 15%, transparent)`,
                              color: specColor,
                              borderColor: `color-mix(in srgb, ${specColor} 40%, transparent)`,
                            } as React.CSSProperties)
                          : undefined
                      }
                    >
                      {specName}
                    </span>
                    <span className="cell-sub" style={{ whiteSpace: 'nowrap' }}>
                      стаж {v.experienceYears} {pluralRu(v.experienceYears, 'год', 'года', 'лет')}
                    </span>
                    {selectedSlot && (
                      isAvailableAtSlot ? (
                        <span
                          className="t-badge"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                            color: 'var(--accent)',
                            borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
                            fontSize: '11px',
                          }}
                        >
                          В {slotTimeStr}
                        </span>
                      ) : (
                        <span className="cell-sub muted" style={{ fontSize: '11px' }}>
                          (не в {slotTimeStr})
                        </span>
                      )
                    )}
                  </span>
                </span>
                {isSel && (
                  <span
                    className="tcard-check"
                    style={specColor ? { background: specColor } : undefined}
                  >
                    <Check className="ic" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!isAnyVet && selectedVet && selectedSlot && !selectedSlot.veterinarianIds.includes(selectedVet.id) && (
        <div
          className="row items-center"
          style={{
            padding: '10px 14px',
            background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            borderRadius: '8px',
            fontSize: '13px',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} className="accent" />
          <span>
            У врача <b>{selectedVet.fullName}</b> другое расписание (время {slotTimeStr} недоступно).
            На следующем шаге выберите подходящее свободное окно из его графика.
          </span>
        </div>
      )}
    </div>
  );
};
