'use client';

import React from 'react';
import { Stethoscope } from 'lucide-react';
import { Veterinarian, User, Specialization, Species } from '../../../../types';
import { getSpeciesTone } from '../../../../components/ui/SpeciesIcon';
import { getSpecTone, getUserName, getUserInitials, getSpecName } from './utils';

export interface AdminVetsTableProps {
  vets: Veterinarian[];
  selectedVet: Veterinarian | null;
  onSelectVet: (vet: Veterinarian) => void;
  users: User[];
  specializations: Specialization[];
  speciesList: Species[];
  vetPermMap: Record<string, string[]>;
  loading: boolean;
}

export const AdminVetsTable: React.FC<AdminVetsTableProps> = ({
  vets,
  selectedVet,
  onSelectVet,
  users,
  specializations,
  speciesList,
  vetPermMap,
  loading,
}) => {
  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <Stethoscope size={18} />
          Врачи <span className="count">{vets.length} · включая неактивных</span>
        </span>
      </div>

      <div className="table-wrap">
        <div
          className="dtable"
          style={
            {
              '--cols': '1.4fr 1fr 0.6fr 1.6fr 0.8fr',
              minWidth: '720px',
            } as React.CSSProperties
          }
        >
          <div className="thead">
            <span>Врач</span>
            <span>Специализация</span>
            <span className="right">Стаж</span>
            <span>Допуски к видам</span>
            <span>Статус</span>
          </div>

          {vets.map((v) => {
            const specName = getSpecName(v.specializationId, specializations);
            const isSelected = selectedVet?.id === v.id;
            const perms = vetPermMap[v.id] || [];
            const permittedSpecies = speciesList.filter((sp) => perms.includes(sp.id));

            return (
              <button
                key={v.id}
                className={`trow ${isSelected ? 'sel' : ''}`}
                onClick={() => onSelectVet(v)}
              >
                <span className="row" style={{ gap: 8 }}>
                  <span className={`t-ava sm round tone-${getSpecTone(v.specializationId)}`}>
                    {getUserInitials(v.userId, users)}
                  </span>
                  <span className="cell-main">{getUserName(v.userId, users)}</span>
                </span>
                <span>
                  <span className={`t-badge tone-${getSpecTone(v.specializationId)}`}>{specName}</span>
                </span>
                <span className="right tnum">
                  {v.experienceYears != null ? `${v.experienceYears} г.` : '—'}
                </span>
                <span className="chips">
                  {permittedSpecies.length > 0 ? (
                    permittedSpecies.map((sp) => (
                      <span key={sp.id} className={`sp-chip ${getSpeciesTone(sp.id)}`}>
                        {sp.name}
                      </span>
                    ))
                  ) : (
                    <span className="small muted">Нет допусков</span>
                  )}
                </span>
                <span>
                  <span className={`badge ${v.isActive ? 'badge-accent' : 'badge-outline'}`}>
                    {v.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {vets.length === 0 && !loading && (
          <div className="empty">
            <span className="empty-title">Нет врачей по фильтру</span>
          </div>
        )}
      </div>
    </section>
  );
};
