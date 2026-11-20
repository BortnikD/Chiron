'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { AppointmentStatus } from '@/shared/types';
import { DatePicker, FilterDropdown, type FilterDropdownOption } from '@/shared/components';
import { APPOINTMENT_STATUS_LIST, APPOINTMENT_STATUS_META } from '@/shared/lib';
import type { AppointmentsFilterTab } from '../_components/utils';

export interface AppointmentsFiltersProps {
  tab: AppointmentsFilterTab;
  onTabChange: (tab: AppointmentsFilterTab) => void;
  selectedPetId: string;
  onPetChange: (petId: string) => void;
  pets: Pet[];
  fromDate: string;
  onFromDateChange: (iso: string) => void;
  toDate: string;
  onToDateChange: (iso: string) => void;
  statusChips: AppointmentStatus[];
  onToggleStatus: (status: AppointmentStatus) => void;
}

/**
 * Верхний остров фильтров записей клиента.
 */
export function AppointmentsFilters({
  tab,
  onTabChange,
  selectedPetId,
  onPetChange,
  pets,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  statusChips,
  onToggleStatus,
}: AppointmentsFiltersProps) {
  const petOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: 'ALL', label: 'Все питомцы' },
      ...pets.map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.isArchived ? 'архив' : undefined,
      })),
    ],
    [pets]
  );

  return (
    <section className="island col" style={{ padding: '12px 16px', gap: '10px' }} aria-label="Фильтры">
      <div className="row wrap between items-end" style={{ gap: '10px' }}>
        <div className="row wrap items-end" style={{ gap: '10px', flex: 1, minWidth: 0 }}>
          <div className="field" style={{ width: 'auto' }}>
            <span className="field-label">Показать</span>
            <div className="seg">
              <button
                type="button"
                className={`seg-item ${tab === 'UPCOMING' ? 'on' : ''}`}
                onClick={() => onTabChange('UPCOMING')}
              >
                Предстоящие
              </button>
              <button
                type="button"
                className={`seg-item ${tab === 'HISTORY' ? 'on' : ''}`}
                onClick={() => onTabChange('HISTORY')}
              >
                История
              </button>
              <button
                type="button"
                className={`seg-item ${tab === 'ALL' ? 'on' : ''}`}
                onClick={() => onTabChange('ALL')}
              >
                Все
              </button>
            </div>
          </div>

          <div className="field" style={{ width: '170px' }}>
            <span className="field-label">Питомец</span>
            <FilterDropdown
              value={selectedPetId}
              options={petOptions}
              onChange={onPetChange}
              searchable={pets.length > 6}
              placeholder="Все питомцы"
              searchPlaceholder="Поиск питомца…"
              ariaLabel="Фильтр по питомцу"
            />
          </div>

          <div className="row" style={{ gap: '8px', alignItems: 'flex-end', flexWrap: 'nowrap' }}>
            <div className="field" style={{ width: '135px' }}>
              <label className="field-label" htmlFor="ap-from">
                С
              </label>
              <DatePicker
                id="ap-from"
                value={fromDate}
                max={toDate || undefined}
                onChange={onFromDateChange}
                ariaLabel="Дата начала периода"
              />
            </div>

            <div className="field" style={{ width: '135px' }}>
              <label className="field-label" htmlFor="ap-to">
                По
              </label>
              <DatePicker
                id="ap-to"
                value={toDate}
                min={fromDate || undefined}
                onChange={onToDateChange}
                ariaLabel="Дата окончания периода"
              />
            </div>
          </div>
        </div>

        <Link href="/client/book" className="btn btn-primary" style={{ flexShrink: 0 }}>
          <CalendarPlus className="ic" />
          <span>Записаться</span>
        </Link>
      </div>

      <div className="row items-center" style={{ gap: '10px' }}>
        <div className="field" style={{ width: 'auto' }}>
          <span className="field-label">Статус</span>
          <div className="chips">
            {APPOINTMENT_STATUS_LIST.map((st) => {
              const on = statusChips.includes(st);
              return (
                <button
                  key={st}
                  type="button"
                  className={`chip ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  onClick={() => onToggleStatus(st)}
                >
                  {APPOINTMENT_STATUS_META[st].short}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
