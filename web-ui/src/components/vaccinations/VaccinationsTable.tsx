'use client';

import React, { useMemo } from 'react';
import { Syringe, Edit2, Trash2 } from 'lucide-react';
import type { Vaccination, Pet, Species } from '@/shared/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { DataTable, type DataTableColumn, type PaginationFooterProps } from '@/shared/components';
import { formatIsoDateDisplay, getSpeciesTone, getVaccinationDueInfo } from '@/shared/lib';

export interface SharedVaccinationsTableProps {
  vaccinations?: Vaccination[];
  data?: Vaccination[];
  pets?: Pet[];
  petsMap?: Record<string, Pet>;
  speciesList?: Species[];
  speciesMap?: Record<string, string>;
  selectedVaccination?: Vaccination | null;
  selectedId?: string | null;
  loading: boolean;
  totalElements?: number;
  count?: number;
  paginationProps?: PaginationFooterProps;
  showActions?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onSelect?: ((vaccination: Vaccination) => void) | ((vaccination: any) => void);
  onEdit?: (vaccination: Vaccination) => void;
  onDelete?: (id: string) => void;
}

export const VaccinationsTable: React.FC<SharedVaccinationsTableProps> = ({
  vaccinations,
  data,
  pets = [],
  petsMap,
  speciesList = [],
  speciesMap,
  selectedVaccination,
  selectedId,
  loading,
  totalElements,
  count,
  paginationProps,
  showActions = false,
  emptyTitle,
  emptyDescription,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const items = vaccinations ?? data ?? [];
  const effectiveTotal = count ?? totalElements;
  const effectiveSelectedId = selectedId !== undefined ? selectedId : (selectedVaccination?.id ?? null);
  const resolvedPetsMap = useMemo(() => {
    if (petsMap) return petsMap;
    const map: Record<string, Pet> = {};
    for (const p of pets) {
      if (p.id) map[p.id] = p;
    }
    return map;
  }, [pets, petsMap]);

  const columns: DataTableColumn<Vaccination>[] = useMemo(() => {
    const cols: DataTableColumn<Vaccination>[] = [
      {
        key: 'pet',
        title: 'Питомец',
        width: '1.4fr',
        render: (v) => {
          const pet = resolvedPetsMap[v.petId];
          const petName = pet?.name || 'Питомец';
          const tone = getSpeciesTone(
            pet?.species?.name || pet?.speciesName || pet?.speciesId,
            speciesList.length > 0 ? speciesList : speciesMap
          );
          return (
            <span className="pet-cell">
              <PetAvatar
                pet={pet ?? { name: petName }}
                className="t-ava round"
              />
              <span className="col gap-0 min-w-0" style={{ textAlign: 'left' }}>
                <span className="cell-main truncate">{petName}</span>
                {pet?.breed && <span className="cell-sub truncate text-xs">{pet.breed}</span>}
              </span>
            </span>
          );
        },
      },
      {
        key: 'vaccine',
        title: 'Препарат / вакцина',
        width: '1.6fr',
        render: (v) => {
          const name = v.name || v.vaccineName || 'Вакцина';
          return (
            <span className="row gap-2 items-center">
              <Syringe className="ic muted" style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span className="strong truncate" title={name}>
                {name}
              </span>
            </span>
          );
        },
      },
      {
        key: 'administered',
        title: 'Дата введения',
        width: '1fr',
        render: (v) => (
          <div className="col gap-1 items-start">
            <span className="cell-sub mobile-only muted" style={{ fontSize: '11px' }}>
              Введена:
            </span>
            <span className="tabular">
              {formatIsoDateDisplay(v.administeredOn || v.administeredAt)}
            </span>
          </div>
        ),
      },
      {
        key: 'nextDue',
        title: 'Следующая прививка',
        width: '1.2fr',
        render: (v) => {
          const dueIso = v.nextDueOn || v.validUntil;
          if (!dueIso) return <span className="muted">—</span>;
          const status = getVaccinationDueInfo(dueIso);
          return (
            <div className="col gap-1 items-start">
              <span className="cell-sub mobile-only muted" style={{ fontSize: '11px' }}>
                Повторить:
              </span>
              <span className="tabular">{formatIsoDateDisplay(dueIso)}</span>
              <span className={`pill small ${status.cls}`}>{status.label}</span>
            </div>
          );
        },
      },
    ];

    if (showActions && (onEdit || onDelete)) {
      cols.push({
        key: 'actions',
        title: '',
        width: '80px',
        render: (v) => (
          <div
            className="row gap-1 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                type="button"
                className="btn-icon xs ghost"
                title="Редактировать прививку"
                onClick={() => onEdit(v)}
              >
                <Edit2 className="ic" style={{ width: 13, height: 13 }} />
              </button>
            )}
            {onDelete && v.id && (
              <button
                type="button"
                className="btn-icon xs ghost destructive"
                title="Удалить прививку"
                onClick={() => onDelete(v.id)}
              >
                <Trash2 className="ic" style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [resolvedPetsMap, speciesList, speciesMap, showActions, onEdit, onDelete]);

  return (
    <DataTable<Vaccination>
      columns={columns}
      data={items}
      keyExtractor={(v) => v.id}
      selectedId={effectiveSelectedId}
      onRowClick={onSelect}
      loading={loading}
      count={effectiveTotal}
      paginationProps={paginationProps}
      emptyText={emptyTitle || 'Прививок не найдено'}
    />
  );
};
