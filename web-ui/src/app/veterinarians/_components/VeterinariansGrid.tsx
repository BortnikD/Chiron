'use client';

import React from 'react';
import { Stethoscope, Inbox } from 'lucide-react';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { getSpecTone, getSpeciesTone, pluralRu } from '@/shared/lib';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import type { VeterinariansGridProps } from './types';

export const VeterinariansGrid: React.FC<VeterinariansGridProps> = ({
  vets,
  selectedVet,
  onSelectVet,
  specsMap,
  speciesMap,
  vetPermissions,
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
        {vets.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Inbox className="ic ic-40" />
            </div>
            <span className="empty-title">Врачи не найдены</span>
            <span>Попробуйте изменить фильтры</span>
          </div>
        ) : (
          <div className="cards" style={{ alignItems: 'stretch' }}>
            {vets.map((v) => {
              const isSel = selectedVet?.id === v.id;
              const tone = getSpecTone(v.specializationId);
              const { name, fullName, initials, specName } = getDoctorDisplay(v, specsMap);
              const perms = vetPermissions[v.id] || [];

              return (
                <button
                  key={v.id}
                  type="button"
                  className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                  onClick={() => onSelectVet(v)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: 'stretch',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  <div
                    className="tcard-head"
                    style={{
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      minWidth: 0,
                      width: '100%',
                    }}
                  >
                    <span className="t-ava lg round" style={{ flexShrink: 0 }}>
                      {initials}
                    </span>
                    <span className="col" style={{ gap: '4px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <span
                        className="tcard-title"
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0,
                          display: 'block',
                        }}
                        title={fullName}
                      >
                        {name}
                      </span>
                      <span
                        className="cell-sub"
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0,
                        }}
                      >
                        стаж {v.experienceYears} {pluralRu(v.experienceYears, 'год', 'года', 'лет')}
                      </span>
                    </span>
                  </div>

                  <div className="row" style={{ gap: '6px' }}>
                    <span className="t-badge">{specName}</span>
                  </div>

                  {v.bio && (
                    <span
                      className="tcard-desc"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.45',
                      }}
                    >
                      {v.bio}
                    </span>
                  )}

                  <div className="tcard-foot" style={{ justifyContent: 'flex-start', marginTop: 'auto' }}>
                    <div className="chips">
                      {perms.length > 0 ? (
                        perms.map((spId) => {
                          const spName = speciesMap[spId] || 'Животное';
                          const spTone = getSpeciesTone(spName);

                          return (
                            <span key={spId} className={`sp-chip tone-${spTone}`}>
                              <SpeciesIcon species={spTone} size={14} />
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
