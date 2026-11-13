'use client';

import React, { useMemo } from 'react';
import { Stethoscope } from 'lucide-react';
import type { Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { getSpecTone, getSpeciesTone, pluralRu, toIdNameMap } from '@/shared/lib';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

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
  const usersMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users]
  );
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

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
            const doc = getDoctorDisplay({ ...v, user: v.user || usersMap[v.userId] }, specsMap);
            const specName = v.specializationId ? doc.specName : 'Не указана';
            const isSelected = selectedVet?.id === v.id;
            const perms = vetPermMap[v.id] || [];
            const permittedSpecies = speciesList.filter((sp) => perms.includes(sp.id));

            return (
              <button
                key={v.id}
                type="button"
                className={`trow ${isSelected ? 'sel' : ''}`}
                onClick={() => onSelectVet(v)}
              >
                <span className="row" style={{ gap: 8 }}>
                  <VetAvatar
                    vet={v}
                    initials={doc.initials}
                    tone={getSpecTone(v.specializationId)}
                    className={`t-ava sm round tone-${getSpecTone(v.specializationId)}`}
                    alt={doc.fullName}
                  />
                  <span className="cell-main">{doc.fullName}</span>
                </span>
                <span>
                  <span className={`t-badge tone-${getSpecTone(v.specializationId)}`}>{specName}</span>
                </span>
                <span className="right tnum">
                  {v.experienceYears != null
                    ? `${v.experienceYears} ${pluralRu(v.experienceYears, 'год', 'года', 'лет')}`
                    : '—'}
                </span>
                <span className="chips">
                  {permittedSpecies.length > 0 ? (
                    permittedSpecies.map((sp) => {
                      const tone = getSpeciesTone(sp.name);
                      return (
                        <span key={sp.id} className={`sp-chip tone-${tone}`}>
                          <SpeciesIcon species={tone} size={14} className="ic" />
                          {sp.name}
                        </span>
                      );
                    })
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

        {loading && vets.length === 0 && (
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="muted">Загрузка врачей…</span>
          </div>
        )}

        {vets.length === 0 && !loading && (
          <div className="empty">
            <span className="empty-title">Нет врачей по фильтру</span>
          </div>
        )}
      </div>
    </section>
  );
};
