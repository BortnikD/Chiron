'use client';

import React from 'react';
import { Stethoscope } from 'lucide-react';
import { getDoctorDisplay } from '@/shared/lib';
import { getSpecTone, getSpecStyle, getSpeciesTone, pluralRu } from '@/shared/lib';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { Skeleton, SkeletonCircle } from '@/shared/components';
import type { VeterinariansGridProps } from './types';

export const VeterinariansGrid: React.FC<VeterinariansGridProps> = ({
  vets,
  selectedVet,
  onSelectVet,
  specsMap,
  speciesMap,
  vetPermissions,
  speciesList,
  specializations,
  loading = false,
  hasFilters = false,
  onReset,
}) => {
  return (
    <section className="island grow" aria-label="Список врачей">
      <div className="island-head">
        <span className="island-title">
          <Stethoscope className="ic" />
          Врачи <span className="count">{vets.length}</span>
        </span>
      </div>
      <div className="island-body">
        {loading && vets.length === 0 ? (
          <div className="cards">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={`vet-skel-${i}`}
                className="card static"
                style={{
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  minHeight: '130px',
                }}
              >
                <SkeletonCircle size={52} />
                <div className="col grow" style={{ gap: '8px' }}>
                  <Skeleton width="150px" height="18px" borderRadius="4px" />
                  <Skeleton width="100px" height="18px" borderRadius="10px" />
                  <div className="row" style={{ gap: '6px', marginTop: '4px' }}>
                    <Skeleton width="60px" height="14px" borderRadius="4px" />
                    <Skeleton width="40px" height="14px" borderRadius="4px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : vets.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Stethoscope className="ic ic-40" />
            </div>
            <span className="empty-title">Нет врачей по фильтру</span>
            {hasFilters && onReset && (
              <button type="button" className="btn btn-outline" onClick={onReset}>
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="cards">
            {vets.map((v) => {
              const isSel = selectedVet?.id === v.id;
              const tone = getSpecTone(v.specializationId);
              const specStyle = getSpecStyle(v.specializationId, specializations);
              const { name, fullName, initials, specName } = getDoctorDisplay(v, specsMap);
              const perms = vetPermissions[v.id] || [];

              return (
                <button
                  key={v.id}
                  type="button"
                  className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                  style={specStyle}
                  onClick={() => onSelectVet(v)}
                >
                  <div className="tcard-head">
                    <VetAvatar
                      vet={v}
                      initials={initials}
                      tone={tone}
                      style={specStyle}
                      className="t-ava lg round"
                      alt={fullName}
                    />
                    <span className="col" style={{ gap: '4px', minWidth: 0 }}>
                      <span className="tcard-title" title={fullName}>
                        {name}
                      </span>
                      <span className="cell-sub">
                        стаж {v.experienceYears} {pluralRu(v.experienceYears, 'год', 'года', 'лет')}
                      </span>
                    </span>
                  </div>

                  <div className="row" style={{ gap: '6px' }}>
                    {(() => {
                      const spec =
                        v.specialization ||
                        (v.specializationId
                          ? specializations?.find((s) => s.id === v.specializationId)
                          : undefined);
                      const specColor = spec?.color;
                      return (
                        <span
                          className="t-badge"
                          style={
                            specColor
                              ? {
                                  color: specColor,
                                  borderColor: `${specColor}40`,
                                  backgroundColor: `${specColor}15`,
                                }
                              : undefined
                          }
                        >
                          {specName}
                        </span>
                      );
                    })()}
                  </div>

                  <span className="tcard-desc">{v.bio || '\u00A0'}</span>

                  <div className="tcard-foot" style={{ justifyContent: 'flex-start' }}>
                    <div className="chips">
                      {perms.length > 0 ? (
                        perms.map((spId) => {
                          const spName = speciesMap[spId] || 'Животное';
                          const sp = speciesList?.find((s) => s.id === spId);
                          const spTone = getSpeciesTone(sp?.iconKey || spName);
                          const customColor = sp?.color;
                          return (
                            <span
                              key={spId}
                              className={`sp-chip tone-${spTone}`}
                              style={
                                customColor
                                  ? ({
                                      '--tone': customColor,
                                      borderColor: customColor,
                                    } as React.CSSProperties)
                                  : undefined
                              }
                            >
                              <SpeciesIcon species={sp?.iconKey || spTone} size={14} />
                              {spName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="small muted">Виды не указаны</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
