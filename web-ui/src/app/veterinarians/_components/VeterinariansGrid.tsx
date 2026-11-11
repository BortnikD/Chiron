'use client';

import React from 'react';
import { Stethoscope } from 'lucide-react';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { getSpecTone, getSpeciesTone, pluralRu } from '@/shared/lib';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import type { VeterinariansGridProps } from './types';

export const VeterinariansGrid: React.FC<VeterinariansGridProps> = ({
  vets,
  selectedVet,
  onSelectVet,
  specsMap,
  speciesMap,
  vetPermissions,
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
        {vets.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Stethoscope className="ic ic-40" />
            </div>
            <span className="empty-title">
              {loading ? 'Загрузка врачей...' : 'Нет врачей по фильтру'}
            </span>
            {loading ? (
              <span>Получение списка врачей клиники...</span>
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
                >
                  <div className="tcard-head">
                    <VetAvatar
                      vet={v}
                      initials={initials}
                      tone={tone}
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
                    <span className="t-badge">{specName}</span>
                  </div>

                  {v.bio && <span className="tcard-desc">{v.bio}</span>}

                  <div className="tcard-foot" style={{ justifyContent: 'flex-start' }}>
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
