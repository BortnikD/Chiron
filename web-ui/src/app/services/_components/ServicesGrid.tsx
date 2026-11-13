'use client';

import React from 'react';
import { ClipboardList, Clock } from 'lucide-react';
import { formatCurrency, getSpecTone } from '@/shared/lib';
import type { ServicesGridProps } from './types';

export function ServicesGrid({
  services,
  selectedService,
  onSelectService,
  specsMap,
  loading = false,
  hasFilters = false,
  onReset,
  isAuthenticated = false,
}: ServicesGridProps) {
  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <ClipboardList className="ic" />
          {isAuthenticated ? 'Услуги' : 'Услуги клиники'}{' '}
          <span className="count">{services.length}</span>
        </span>
        {!isAuthenticated && <span className="small muted">Только активные услуги</span>}
      </div>
      <div className="island-body">
        {services.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <ClipboardList className="ic ic-40" />
            </div>
            <span className="empty-title">
              {loading ? 'Загрузка услуг...' : 'Нет услуг по фильтру'}
            </span>
            {loading ? (
              <span>Получение списка услуг клиники...</span>
            ) : (
              hasFilters &&
              onReset && (
                <button type="button" className="btn btn-outline" onClick={onReset}>
                  Сбросить фильтры
                </button>
              )
            )}
          </div>
        ) : (
          <div className="cards">
            {services.map((svc) => {
              const isSel = selectedService?.id === svc.id;
              const tone = getSpecTone(svc.specializationId);
              const specName = specsMap[svc.specializationId] || 'Терапия';
              const duration =
                svc.effectiveDurationMin ?? svc.baseDurationMin ?? svc.durationMin ?? 30;
              const price = svc.effectivePrice ?? svc.basePrice;

              return (
                <button
                  key={svc.id}
                  type="button"
                  className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                  onClick={() => onSelectService(svc)}
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
                      {svc.effectivePrice != null
                        ? formatCurrency(price)
                        : `от ${formatCurrency(price)}`}
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
