'use client';

import React, { useMemo } from 'react';
import { Stethoscope } from 'lucide-react';
import type { Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { getSpecTone, getSpecStyle, getSpeciesTone, pluralRu, toIdNameMap } from '@/shared/lib';
import { DataTable, type DataTableColumn } from '@/shared/components';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { getDoctorDisplay } from '@/shared/lib';

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

  const columns = useMemo<DataTableColumn<Veterinarian>[]>(() => {
    return [
      {
        key: 'doctor',
        title: 'Врач',
        width: '1.4fr',
        render: (v) => {
          const doc = getDoctorDisplay({ ...v, user: v.user || usersMap[v.userId] }, specsMap);
          const tone = getSpecTone(v.specializationId);
          const specStyle = getSpecStyle(v.specializationId, specializations);
          return (
            <span className="row" style={{ gap: 8, alignItems: 'center' }}>
              <VetAvatar
                vet={v}
                initials={doc.initials}
                tone={tone}
                style={specStyle}
                className={`t-ava sm round tone-${tone}`}
                alt={doc.fullName}
              />
              <span className="cell-main">{doc.fullName}</span>
            </span>
          );
        },
      },
      {
        key: 'spec',
        title: 'Специализация',
        width: '1fr',
        render: (v) => {
          const doc = getDoctorDisplay({ ...v, user: v.user || usersMap[v.userId] }, specsMap);
          const specName = v.specializationId ? doc.specName : 'Не указана';
          const tone = getSpecTone(v.specializationId);
          const specStyle = getSpecStyle(v.specializationId, specializations);
          return (
            <span className={`t-badge tone-${tone}`} style={specStyle}>
              {specName}
            </span>
          );
        },
      },
      {
        key: 'experience',
        title: 'Стаж',
        width: '0.6fr',
        align: 'right',
        render: (v) => (
          <span className="right tnum">
            {v.experienceYears != null
              ? `${v.experienceYears} ${pluralRu(v.experienceYears, 'год', 'года', 'лет')}`
              : '—'}
          </span>
        ),
      },
      {
        key: 'species',
        title: 'Допуски к видам',
        width: '1.6fr',
        render: (v) => {
          const perms = vetPermMap[v.id] || [];
          const permittedSpecies = speciesList.filter((sp) => perms.includes(sp.id));
          return (
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
          );
        },
      },
      {
        key: 'status',
        title: 'Статус',
        width: '0.8fr',
        render: (v) => (
          <span className={`badge ${v.isActive ? 'badge-accent' : 'badge-outline'}`}>
            {v.isActive ? 'Активен' : 'Неактивен'}
          </span>
        ),
      },
    ];
  }, [usersMap, specsMap, specializations, speciesList, vetPermMap]);

  return (
    <DataTable<Veterinarian>
      title="Врачи"
      icon={<Stethoscope size={18} />}
      columns={columns}
      data={vets}
      selectedId={selectedVet?.id}
      onRowClick={onSelectVet}
      loading={loading}
      emptyText="Нет врачей по фильтру"
      minWidth="720px"
      count={vets.length}
    />
  );
};
