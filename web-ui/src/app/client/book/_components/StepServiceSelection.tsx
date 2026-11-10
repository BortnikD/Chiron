import React, { useState, useMemo } from 'react';
import { Clock, Check, Loader2 } from 'lucide-react';
import type { Service, Specialization } from '@/modules/clinic/types';
import { formatCurrency, getSpecTone } from '@/shared/lib';

export interface StepServiceSelectionProps {
  services: Service[];
  specializations: Specialization[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
  specsMap: Record<string, string>;
  speciesName?: string;
  loading?: boolean;
}

/**
 * Шаг 2: выбор услуги.
 * Вкладки специализаций, карточки услуг с ценами, длительностью и цветовой дифференциацией.
 */
export const StepServiceSelection: React.FC<StepServiceSelectionProps> = ({
  services,
  specializations,
  selectedService,
  onSelectService,
  specsMap,
  speciesName,
  loading = false,
}) => {
  const [selectedSpecId, setSelectedSpecId] = useState<string>('ALL');

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

      {activeSpecializations.length > 1 && (
        <div className="seg wrap" style={{ gap: '4px' }}>
          <button
            type="button"
            className={`seg-item ${selectedSpecId === 'ALL' ? 'on' : ''}`}
            onClick={() => setSelectedSpecId('ALL')}
          >
            Все ({services.length})
          </button>
          {activeSpecializations.map((spec) => {
            const count = services.filter((s) => s.specializationId === spec.id).length;
            return (
              <button
                key={spec.id}
                type="button"
                className={`seg-item ${selectedSpecId === spec.id ? 'on' : ''}`}
                onClick={() => setSelectedSpecId(spec.id)}
              >
                {spec.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-text)]" />
          <span>Загрузка услуг для выбранного вида...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="empty" style={{ padding: '32px 16px' }}>
          <span className="empty-title">В этой категории нет доступных услуг</span>
          <span className="muted">Выберите другую специализацию</span>
        </div>
      ) : (
        <div className="cards">
          {filteredServices.map((svc) => {
            const isSel = selectedService?.id === svc.id;
            const tone = getSpecTone(svc.specializationId);
            const specName = specsMap[svc.specializationId] || 'Терапия';
            const duration = svc.effectiveDurationMin ?? svc.baseDurationMin ?? svc.durationMin ?? 30;
            const price = svc.effectivePrice ?? svc.basePrice;

            return (
              <button
                key={svc.id}
                type="button"
                className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                onClick={() => onSelectService(svc)}
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="row between" style={{ gap: '8px' }}>
                  <span className="t-badge">{specName}</span>
                  {isSel && (
                    <span className="tcard-check">
                      <Check className="ic" />
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
