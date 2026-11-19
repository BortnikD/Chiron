import React, { useState, useMemo } from 'react';
import { Clock, Check, X } from 'lucide-react';
import type { Service, Specialization } from '@/modules/clinic/types';
import { formatCurrency, getSpecColor, getSpecTone } from '@/shared/lib';
import { Skeleton } from '@/shared/components';

export interface StepServiceSelectionProps {
  services: Service[];
  specializations: Specialization[];
  selectedService: Service | null;
  selectedServices?: Service[];
  onSelectService: (service: Service) => void;
  onToggleService?: (service: Service) => void;
  onRemoveService?: (serviceId: string) => void;
  onClearServices?: () => void;
  specsMap: Record<string, string>;
  speciesName?: string;
  loading?: boolean;
  lockedDoctorName?: string | null;
  lockedSpecializationName?: string | null;
  onResetDoctorFilter?: () => void;
}

/**
 * Шаг 2: выбор одной или нескольких услуг (комплекса) для вида выбранного питомца.
 */
export const StepServiceSelection: React.FC<StepServiceSelectionProps> = ({
  services,
  specializations,
  selectedService,
  selectedServices = [],
  onSelectService,
  onToggleService,
  onRemoveService,
  onClearServices,
  specsMap,
  speciesName,
  loading = false,
  lockedDoctorName,
  lockedSpecializationName,
  onResetDoctorFilter,
}) => {
  const [selectedSpecId, setSelectedSpecId] = useState<string>('ALL');

  const specsById = useMemo(() => {
    const map = new Map<string, Specialization>();
    for (const s of specializations) {
      if (s.id) map.set(s.id, s);
    }
    return map;
  }, [specializations]);

  const activeSpecializations = useMemo(() => {
    const specIdsWithServices = new Set(services.map((s) => s.specializationId));
    return specializations.filter((sp) => specIdsWithServices.has(sp.id));
  }, [services, specializations]);

  const filteredServices = useMemo(() => {
    if (selectedSpecId === 'ALL') return services;
    return services.filter((s) => s.specializationId === selectedSpecId);
  }, [services, selectedSpecId]);

  return (
    <div className="col" style={{ gap: '12px' }}>
      <div className="row between wrap" style={{ alignItems: 'baseline' }}>
        <span className="h2">
          Услуга {speciesName ? `для вида «${speciesName}»` : ''}
        </span>
        <span className="small muted">Цена и длительность — для этого вида</span>
      </div>

      {lockedDoctorName && (
        <div className="row between wrap" style={{ gap: '8px', alignItems: 'center' }}>
          <span className="small muted">
            Показаны услуги врача <b>{lockedDoctorName}</b>
            {lockedSpecializationName ? ` (${lockedSpecializationName})` : ''}
          </span>
          {onResetDoctorFilter && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onResetDoctorFilter}
            >
              Показать все услуги
            </button>
          )}
        </div>
      )}

      {activeSpecializations.length > 1 && (
        <div className="seg">
          <button
            type="button"
            className={`seg-item ${selectedSpecId === 'ALL' ? 'on' : ''}`}
            onClick={() => setSelectedSpecId('ALL')}
          >
            Все ({services.length})
          </button>
          {activeSpecializations.map((spec) => {
            const count = services.filter((s) => s.specializationId === spec.id).length;
            const specColor = spec.color || getSpecColor(spec.id, specializations);
            const isTabSel = selectedSpecId === spec.id;
            return (
              <button
                key={spec.id}
                type="button"
                className={`seg-item ${isTabSel ? 'on' : ''}`}
                style={
                  specColor && isTabSel
                    ? {
                        borderColor: specColor,
                        color: 'var(--foreground)',
                      }
                    : undefined
                }
                onClick={() => setSelectedSpecId(spec.id)}
              >
                {specColor && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: specColor,
                      display: 'inline-block',
                      marginRight: 6,
                    }}
                  />
                )}
                {spec.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {selectedServices.length > 0 && (
        <div
          className="card static"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}
        >
          <div className="row between wrap items-center" style={{ gap: '8px' }}>
            <div className="col" style={{ gap: '2px' }}>
              <div className="row items-center wrap" style={{ gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                  Выбранный комплекс ({selectedServices.length})
                </span>
                <span
                  className="badge"
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    backgroundColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                    color: 'var(--primary-text, var(--primary))',
                  }}
                >
                  {specsMap[selectedServices[0].specializationId] || 'Специализация'}
                </span>
              </div>
              <span className="small muted">
                Общая длительность ~
                {selectedServices.reduce(
                  (sum, s) => sum + (s.effectiveDurationMin ?? s.baseDurationMin ?? 30),
                  0
                )}{' '}
                мин · Итого:{' '}
                {formatCurrency(
                  selectedServices.reduce(
                    (sum, s) => sum + (s.effectivePrice ?? s.basePrice ?? s.price ?? 0),
                    0
                  )
                )}
              </span>
            </div>
            {selectedServices.length > 1 && onClearServices && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClearServices}
                style={{ fontSize: '12px', height: '28px' }}
              >
                Сбросить выбор
              </button>
            )}
          </div>

          <div className="row wrap" style={{ gap: '6px', marginTop: '10px' }}>
            {selectedServices.map((s, idx) => (
              <span
                key={s.id}
                className="sp-chip"
                style={{
                  fontSize: '12px',
                  padding: '3px 8px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--primary-text, var(--primary))' }}>
                  {idx + 1}.
                </span>
                <span>{s.name}</span>
                <span className="muted" style={{ fontSize: '11px' }}>
                  {formatCurrency(s.effectivePrice ?? s.basePrice ?? s.price ?? 0)}
                </span>
                {onRemoveService && selectedServices.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Удалить ${s.name}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0 2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--muted-foreground)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveService(s.id);
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="cards">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`svc-book-skel-${i}`}
              className="card static"
              style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <Skeleton width="80px" height="18px" borderRadius="10px" />
              <Skeleton width="160px" height="18px" borderRadius="4px" />
              <div className="row items-center between" style={{ marginTop: 'auto', paddingTop: '8px' }}>
                <Skeleton width="60px" height="14px" borderRadius="4px" />
                <Skeleton width="70px" height="15px" borderRadius="4px" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="empty">
          <span className="empty-title">Нет доступных услуг</span>
          <span className="muted">Попробуйте выбрать другую специализацию</span>
        </div>
      ) : (
        <div className="cards">
          {filteredServices.map((svc) => {
            const isSel =
              selectedServices.length > 0
                ? selectedServices.some((s) => s.id === svc.id)
                : selectedService?.id === svc.id;
            const selIndex = selectedServices.findIndex((s) => s.id === svc.id);
            const isDifferentSpec =
              selectedServices.length > 0 &&
              selectedServices[0].specializationId !== svc.specializationId;
            const tone = getSpecTone(svc.specializationId);
            const spec = specsById.get(svc.specializationId);
            const specColor = spec?.color || getSpecColor(svc.specializationId, specializations);
            const specName = specsMap[svc.specializationId] || spec?.name || 'Терапия';
            const duration = svc.effectiveDurationMin ?? svc.baseDurationMin ?? svc.durationMin ?? 30;
            const price = svc.effectivePrice ?? svc.basePrice ?? svc.price;

            return (
              <button
                key={svc.id}
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
                onClick={() =>
                  onToggleService ? onToggleService(svc) : onSelectService(svc)
                }
              >
                <div className="row between" style={{ gap: '8px' }}>
                  <span
                    className={`t-badge tone-${tone}`}
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
                  {isSel && (
                    <span
                      className="tcard-check"
                      style={specColor ? { background: specColor } : undefined}
                    >
                      {selectedServices.length > 1 ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                          {selIndex + 1}
                        </span>
                      ) : (
                        <Check className="ic" />
                      )}
                    </span>
                  )}
                </div>
                <span className="tcard-title">{svc.name}</span>
                <div className="tcard-foot">
                  <span className="tcard-meta">
                    <Clock className="ic" />
                    {duration} мин
                  </span>
                  <span className="tcard-price">
                    {price != null ? formatCurrency(price) : '—'}
                  </span>
                </div>
                {isDifferentSpec && (
                  <span
                    className="small muted"
                    style={{ fontSize: '10px', marginTop: '2px', opacity: 0.8 }}
                  >
                    Другая специализация · сменит выбор
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
