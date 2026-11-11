'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Syringe } from 'lucide-react';
import type { Pet, Vaccination } from '@/modules/client/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { formatIsoDateDisplay, getSpeciesTone } from '@/shared/lib';
import { getVetVaccinationDueInfo } from '../../dashboard/_components/vetHelpers';

export interface VetVaccinationsTableProps {
  vaccinations: Vaccination[];
  totalElements: number;
  page: number;
  totalPages: number;
  loading: boolean;
  hasDateBounds: boolean;
  hasActiveFilters: boolean;
  selectedVac: Vaccination | null;
  petsMap: Record<string, Pet>;
  speciesMap: Record<string, string>;
  onSelectVac: (vac: Vaccination) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export const VetVaccinationsTable: React.FC<VetVaccinationsTableProps> = ({
  vaccinations,
  totalElements,
  page,
  totalPages,
  loading,
  hasDateBounds,
  hasActiveFilters,
  selectedVac,
  petsMap,
  speciesMap,
  onSelectVac,
  onPageChange,
  onResetFilters,
}) => {
  const pageNumbers = useMemo(() => {
    const total = Math.max(1, totalPages);
    const maxButtons = 5;
    let start = Math.max(0, page - Math.floor(maxButtons / 2));
    const end = Math.min(total - 1, start + maxButtons - 1);
    start = Math.max(0, end - maxButtons + 1);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <Syringe className="ic" />
          Прививки пациентов <span className="count">Найдено: {totalElements}</span>
        </span>
        {hasDateBounds && (
          <span className="small muted">
            С заданной границей прививки без даты ревакцинации скрыты
          </span>
        )}
      </div>

      <div className="table-wrap">
        {loading && vaccinations.length === 0 ? (
          <div className="col" style={{ gap: '8px', padding: '12px 16px' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton" style={{ height: '42px' }} />
            ))}
          </div>
        ) : vaccinations.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Syringe className="ic ic-40" />
            </div>
            <span className="empty-title">Ничего не найдено</span>
            {hasActiveFilters && (
              <button type="button" className="btn btn-outline" onClick={onResetFilters}>
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div
            className="dtable"
            style={{ '--cols': '1fr 1.6fr 1fr 1fr 1fr 0.9fr', minWidth: '760px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Пациент</span>
              <span>Вакцина</span>
              <span>Введена ↓</span>
              <span>Следующая</span>
              <span>Срок</span>
              <span>Приём</span>
            </div>

            {vaccinations.map((v) => {
              const pet = petsMap[v.petId];
              const petName = pet?.name || 'Пациент';
              const tone = getSpeciesTone(
                pet?.species?.name || pet?.speciesName || pet?.speciesId || 'cat',
                speciesMap
              );
              const due = getVetVaccinationDueInfo(v.nextDueOn);
              const isSel = selectedVac?.id === v.id;

              return (
                <button
                  key={v.id}
                  type="button"
                  className={`trow ${isSel ? 'sel' : ''}`}
                  onClick={() => onSelectVac(v)}
                >
                  <span className="pet-cell">
                    <PetAvatar
                      pet={pet}
                      tone={tone}
                      species={tone}
                      iconSize={14}
                      variant="thumb"
                      className={`t-ava xs tone-${tone}`}
                    />
                    <span className="cell-main">{petName}</span>
                  </span>
                  <span>{v.name}</span>
                  <span className="tnum">{formatIsoDateDisplay(v.administeredOn)}</span>
                  <span className="tnum">{due.label}</span>
                  <span>
                    <span className={`badge ${due.cls}`}>{due.text}</span>
                  </span>
                  <span className="muted">{v.appointmentId ? 'по записи' : '—'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="island-foot">
        <span className="small muted">Сортировка: по дате введения, новые сверху</span>
        <div className="pager">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            disabled={page <= 0}
            aria-label="Назад"
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            <ChevronLeft className="ic" />
          </button>
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              type="button"
              className={`btn btn-ghost btn-sm ${pg === page ? 'on' : ''}`}
              onClick={() => onPageChange(pg)}
            >
              {pg + 1}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            disabled={page >= totalPages - 1}
            aria-label="Вперёд"
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          >
            <ChevronRight className="ic" />
          </button>
        </div>
      </div>
    </section>
  );
};
