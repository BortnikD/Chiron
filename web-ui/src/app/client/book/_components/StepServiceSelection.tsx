import React, { useState, useMemo } from 'react';
import { Service, Specialization } from '../../../../types';
import { Clock, Check } from 'lucide-react';
import { SPEC_TONES } from './constants';

export interface StepServiceSelectionProps {
  services: Service[];
  specializations: Specialization[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
  specsMap: Record<string, string>;
  speciesName?: string;
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
}) => {
  const [selectedSpecId, setSelectedSpecId] = useState<string>('ALL');

  // Уникальные специализации, представленные в каталоге услуг
  const activeSpecializations = useMemo(() => {
    const specIdsWithServices = new Set(services.map((s) => s.specializationId));
    return specializations.filter((sp) => specIdsWithServices.has(sp.id));
  }, [services, specializations]);

  // Фильтрация услуг по выбранной специализации
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

      {/* Вкладки специализаций */}
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

      {/* Список карточек услуг */}
      {filteredServices.length === 0 ? (
        <div className="empty" style={{ padding: '32px 16px' }}>
          <span className="empty-title">В этой категории нет доступных услуг</span>
          <span className="muted">Выберите другую специализацию</span>
        </div>
      ) : (
        <div className="cards">
          {filteredServices.map((svc) => {
            const isSel = selectedService?.id === svc.id;
            const tone = SPEC_TONES[svc.specializationId] || 'ther';
            const specName = specsMap[svc.specializationId] || 'Терапия';
            const duration = svc.baseDurationMin || svc.durationMin || 30;

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
                    {svc.basePrice?.toLocaleString('ru-RU')} ₽
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
