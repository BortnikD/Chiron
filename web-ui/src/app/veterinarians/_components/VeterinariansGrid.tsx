'use client';

import React from 'react';
import { Stethoscope } from 'lucide-react';
import { getDoctorDisplay } from '@/shared/lib';
import { getSpecTone, getSpecStyle, getSpeciesTone, getSpeciesStyle, pluralRu } from '@/shared/lib';
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
  error = null,
  hasFilters = false,
  onReset,
  onReload,
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
                className="card static p-md row gap-md items-start min-h-130"
              >
                <SkeletonCircle size={52} />
                <div className="col grow gap-sm">
                  <Skeleton width="150px" height="18px" borderRadius="4px" />
                  <Skeleton width="100px" height="18px" borderRadius="10px" />
                  <div className="row gap-xs mt-2xs">
                    <Skeleton width="60px" height="14px" borderRadius="4px" />
                    <Skeleton width="40px" height="14px" borderRadius="4px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty">
            <div className="empty-art">
              <Stethoscope className="ic ic-40 text-danger" />
            </div>
            <span className="empty-title">Не удалось загрузить каталог врачей</span>
            <span className="small muted">Сервер временно недоступен или произошла ошибка</span>
            {onReload && (
              <button type="button" className="btn btn-primary btn-sm mt-sm" onClick={onReload}>
                Повторить попытку
              </button>
            )}
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

                  <div className="row wrap" style={{ gap: '6px' }}>
                    {(() => {
                      const allSpecIds =
                        v.specializationIds && v.specializationIds.length > 0
                          ? v.specializationIds
                          : v.specializationId
                          ? [v.specializationId]
                          : [];

                      if (allSpecIds.length === 0) {
                        return <span className="t-badge">{specName}</span>;
                      }

                      return allSpecIds.map((sId) => {
                        const spec = specializations?.find((s) => s.id === sId);
                        const label = spec?.name || specName;
                        const specColor = spec?.color;
                        return (
                          <span
                            key={sId}
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
                            {label}
                          </span>
                        );
                      });
                    })()}
                  </div>

                  <span className="tcard-desc">{v.bio || '\u00A0'}</span>

                  <div className="tcard-foot" style={{ justifyContent: 'flex-start' }}>
                    <div className="chips">
                      {perms.length > 0 ? (
                        perms.map((spId) => {
                          const spName = speciesMap[spId] || 'Животное';
                          const sp = speciesList?.find((s) => s.id === spId);
                          const spTone = getSpeciesTone(sp?.name || sp?.iconKey || spName, speciesList);
                          const style = getSpeciesStyle(spId, speciesList);
                          return (
                            <span
                              key={spId}
                              className={`sp-chip tone-${spTone}`}
                              style={style}
                            >
                              <SpeciesIcon species={sp?.iconKey || spTone} size={14} className="ic" />
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
