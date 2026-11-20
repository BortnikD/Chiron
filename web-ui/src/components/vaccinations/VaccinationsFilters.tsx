'use client';

import React, { useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import type { Pet, User } from '@/shared/types';
import { DatePicker, SearchCombobox, type SearchComboboxOption } from '@/shared/components';

export type VaccinationFilterTone = 'all' | 'overdue' | 'soon' | 'ok';

export const SHARED_STATUS_FILTERS: Array<{ value: VaccinationFilterTone; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'overdue', label: 'Просрочено' },
  { value: 'soon', label: 'Скоро' },
  { value: 'ok', label: 'В норме' },
];

export interface SharedVaccinationsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedPetId: string;
  onPetChange: (petId: string) => void;
  nextDueFrom: string;
  onNextDueFromChange: (iso: string) => void;
  nextDueTo: string;
  onNextDueToChange: (iso: string) => void;
  statusFilter: VaccinationFilterTone;
  onStatusFilterChange: (status: VaccinationFilterTone) => void;
  pets?: Pet[];
  users?: User[];
  onCreateClick?: () => void;
  createButtonLabel?: string;
}

export const VaccinationsFilters: React.FC<SharedVaccinationsFiltersProps> = ({
  search,
  onSearchChange,
  selectedPetId,
  onPetChange,
  nextDueFrom,
  onNextDueFromChange,
  nextDueTo,
  onNextDueToChange,
  statusFilter,
  onStatusFilterChange,
  pets = [],
  users = [],
  onCreateClick,
  createButtonLabel = 'Новая прививка',
}) => {
  const petOptions = useMemo<SearchComboboxOption[]>(
    () => [
      { value: 'all', label: 'Все питомцы' },
      ...pets.map((p) => {
        const owner = users.find((u) => u.id === p.ownerId);
        const ownerName = owner ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.fullName : undefined;
        return {
          value: p.id,
          label: p.name,
          hint: ownerName,
          keywords: [p.name, p.breed, ownerName, owner?.phone].filter(Boolean) as string[],
        };
      }),
    ],
    [pets, users]
  );

  return (
    <section className="island filters" aria-label="Фильтры прививок">
      <div className="filter-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {pets.length > 0 && (
          <div className="field" style={{ minWidth: 200, flex: 1 }}>
            <label className="field-label">Питомец</label>
            <SearchCombobox
              options={petOptions}
              value={selectedPetId || 'all'}
              onChange={(val) => onPetChange(val === 'all' ? '' : val)}
              placeholder="Все питомцы"
            />
          </div>
        )}

        <div className="field" style={{ minWidth: 200, flex: 1.2 }}>
          <label className="field-label">Препарат / вакцина</label>
          <div className="field-with-icon">
            <Search className="field-icon ic" style={{ width: 14, height: 14 }} />
            <input
              type="text"
              className="input has-icon"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="field" style={{ minWidth: 140 }}>
          <label className="field-label">Повтор с</label>
          <DatePicker
            value={nextDueFrom}
            onChange={onNextDueFromChange}
            placeholder="С даты"
          />
        </div>

        <div className="field" style={{ minWidth: 140 }}>
          <label className="field-label">Повтор по</label>
          <DatePicker
            value={nextDueTo}
            onChange={onNextDueToChange}
            placeholder="По дату"
          />
        </div>

        <div className="field" style={{ minWidth: 220 }}>
          <label className="field-label">Статус</label>
          <div className="seg" role="radiogroup">
            {SHARED_STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={statusFilter === s.value}
                className={`seg-btn ${statusFilter === s.value ? 'active' : ''}`}
                onClick={() => onStatusFilterChange(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {onCreateClick && (
          <div className="field" style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onCreateClick}
            >
              <Plus className="ic" style={{ width: 14, height: 14 }} />
              <span>{createButtonLabel}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
