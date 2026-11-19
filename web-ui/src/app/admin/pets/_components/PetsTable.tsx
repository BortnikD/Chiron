'use client';

import React, { useMemo } from 'react';
import { PawPrint } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import { calculateAgeRu, getSpeciesTone, getSpeciesStyle } from '@/shared/lib';
import { DataTable, type DataTableColumn } from '@/shared/components';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import type { PetsTableProps } from './types';

/**
 * Таблица списка питомцев на базе универсального компонента DataTable.
 */
export const PetsTable: React.FC<PetsTableProps> = ({
  pets,
  selectedPet,
  speciesList,
  users,
  loading,
  totalElements,
  page,
  pageSize,
  totalPages,
  onSelectPet,
  onPageChange,
  onPageSizeChange,
}) => {
  const usersMap = useMemo(() => new Map(users.map((u) => [u.id, u.fullName || u.email])), [users]);
  const speciesMap = useMemo(() => new Map(speciesList.map((s) => [s.id, s.name])), [speciesList]);

  const columns = useMemo<DataTableColumn<Pet>[]>(() => {
    return [
      {
        key: 'name',
        title: 'Кличка',
        width: '1.2fr',
        render: (p) => {
          const spName = speciesMap.get(p.speciesId) || p.species?.name || '—';
          const tone = getSpeciesTone(p.species?.name || spName || p.speciesId, speciesList);
          return (
            <span className="pet-cell">
              <PetAvatar
                pet={p}
                tone={tone}
                iconSize={14}
                className={`t-ava sm tone-${tone}`}
                style={getSpeciesStyle(p.speciesId, speciesList)}
                alt={p.name}
              />
              <span className="col" style={{ gap: 0, textAlign: 'left', minWidth: 0 }}>
                <span className="cell-main">{p.name}</span>
                {p.breed && <span className="cell-sub">{p.breed}</span>}
              </span>
            </span>
          );
        },
      },
      {
        key: 'species',
        title: 'Вид',
        width: '0.8fr',
        render: (p) => <span>{speciesMap.get(p.speciesId) || p.species?.name || '—'}</span>,
      },
      {
        key: 'gender',
        title: 'Пол',
        width: '0.7fr',
        render: (p) => <span>{p.gender === 'MALE' ? 'Самец' : 'Самка'}</span>,
      },
      {
        key: 'age',
        title: 'Возраст',
        width: '0.8fr',
        render: (p) => <span className="tnum">{calculateAgeRu(p.birthDate)}</span>,
      },
      {
        key: 'weight',
        title: 'Вес',
        width: '0.7fr',
        render: (p) => (
          <span className="tnum">
            {p.weightKg != null ? `${String(p.weightKg).replace('.', ',')} кг` : '—'}
          </span>
        ),
      },
      {
        key: 'owner',
        title: 'Владелец',
        width: '1.3fr',
        render: (p) => <span className="muted">{usersMap.get(p.ownerId) || '—'}</span>,
      },
      {
        key: 'status',
        title: 'Статус',
        width: '0.7fr',
        render: (p) => (
          <span className={`badge ${p.isArchived ? 'badge-outline' : 'badge-accent'}`}>
            {p.isArchived ? 'Архив' : 'Активен'}
          </span>
        ),
      },
    ];
  }, [speciesList, usersMap, speciesMap]);

  return (
    <DataTable<Pet>
      title="Питомцы"
      icon={<PawPrint size={18} />}
      columns={columns}
      data={pets}
      selectedId={selectedPet?.id}
      onRowClick={onSelectPet}
      loading={loading}
      emptyText="Питомцы не найдены"
      minWidth="820px"
      paginationProps={{
        page,
        pageSize,
        totalElements,
        totalPages,
        loading,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
};
