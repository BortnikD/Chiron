'use client';

import React from 'react';
import { ClipboardList, Clock, Inbox } from 'lucide-react';
import { formatCurrency, getSpecTone } from '@/shared/lib';
import type { ServicesGridProps } from './types';

export function ServicesGrid({
  services,
  selectedService,
  onSelectService,
  specsMap,
  loading = false,
}: ServicesGridProps) {
  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <ClipboardList className="ic" />
          Услуги <span className="count">{services.length}</span>
        </span>
      </div>
      <div className="island-body">
        {services.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Inbox className="ic ic-40" />
            </div>
            <span className="empty-title">
              {loading ? 'Загрузка услуг...' : 'Услуги не найдены'}
            </span>
            <span>
              {loading
                ? 'Получение списка услуг клиники...'
                : 'Попробуйте изменить параметры фильтрации или поисковый запрос'}
            </span>
          </div>
        ) : (
          <div className="cards">
            {services.map((svc) => {
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
                  <span className="t-badge" style={{ alignSelf: 'flex-start' }}>
                    {specName}
                  </span>
                  <span className="col" style={{ gap: '4px' }}>
                    <span className="tcard-title">{svc.name}</span>
                    <span className="tcard-desc">{svc.description}</span>
                  </span>
                  <div className="tcard-foot">
                    <span className="tcard-meta">
                      <Clock className="ic" />
                      {duration} мин
                    </span>
                    <span className="tcard-price">
                      {svc.effectivePrice != null ? formatCurrency(price) : `от ${formatCurrency(price)}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
