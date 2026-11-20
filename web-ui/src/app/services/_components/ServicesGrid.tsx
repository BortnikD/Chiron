'use client';

import React from 'react';
import { ClipboardList, Clock } from 'lucide-react';
import { formatCurrency, getSpecColor, getSpecStyle, getSpecTone } from '@/shared/lib';
import { Skeleton } from '@/shared/components';
import type { ServicesGridProps } from './types';

export function ServicesGrid({
  services,
  selectedService,
  onSelectService,
  specsMap,
  specializations,
  loading = false,
  error = null,
  hasFilters = false,
  onReset,
  onReload,
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
        {loading && services.length === 0 ? (
          <div className="cards">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={`svc-skel-${i}`}
                className="card static p-md col gap-md min-h-140"
              >
                <div className="row items-center between">
                  <Skeleton width="80px" height="20px" borderRadius="12px" />
                </div>
                <div className="col gap-xs">
                  <Skeleton width="160px" height="18px" borderRadius="4px" />
                  <Skeleton width="220px" height="13px" borderRadius="4px" />
                </div>
                <div className="row items-center between mt-auto pt-sm">
                  <Skeleton width="70px" height="14px" borderRadius="4px" />
                  <Skeleton width="90px" height="16px" borderRadius="4px" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty">
            <div className="empty-art">
              <ClipboardList className="ic ic-40 text-danger" />
            </div>
            <span className="empty-title">Не удалось загрузить каталог услуг</span>
            <span className="small muted">Сервер временно недоступен или произошла ошибка связи</span>
            {onReload && (
              <button type="button" className="btn btn-primary btn-sm mt-sm" onClick={onReload}>
                Повторить попытку
              </button>
            )}
          </div>
        ) : services.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <ClipboardList className="ic ic-40" />
            </div>
            <span className="empty-title">Нет услуг по фильтру</span>
            {hasFilters && onReset && (
              <button type="button" className="btn btn-outline" onClick={onReset}>
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="cards">
            {services.map((svc) => {
              const isSel = selectedService?.id === svc.id;
              const tone = getSpecTone(svc.specializationId);
              const specColor = getSpecColor(svc.specializationId, specializations);
              const specName = specsMap[svc.specializationId] || 'Терапия';
              const duration =
                svc.effectiveDurationMin ?? svc.baseDurationMin ?? svc.durationMin ?? 30;
              const price = svc.effectivePrice ?? svc.basePrice;

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
                  onClick={() => onSelectService(svc)}
                >
                  <span
                    className={`t-badge tone-${tone}`}
                    style={
                      specColor
                        ? ({
                            alignSelf: 'flex-start',
                            '--tone': specColor,
                            backgroundColor: `color-mix(in srgb, ${specColor} 15%, transparent)`,
                            color: specColor,
                            borderColor: `color-mix(in srgb, ${specColor} 40%, transparent)`,
                          } as React.CSSProperties)
                        : { alignSelf: 'flex-start' }
                    }
                  >
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
