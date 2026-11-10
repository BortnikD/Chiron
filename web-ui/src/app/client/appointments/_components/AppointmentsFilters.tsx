'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { FilterTab } from '../_hooks/useClientAppointments';

export interface AppointmentsFiltersProps {
  /** Текущая выбранная вкладка (предстоящие, прошедшие или все) */
  tab: FilterTab;
  /** Функция смены вкладки фильтрации */
  onTabChange: (tab: FilterTab) => void;
  /** ID выбранного питомца или 'ALL' */
  selectedPetId: string;
  /** Функция смены выбранного питомца */
  onPetChange: (petId: string) => void;
  /** Список всех питомцев клиента */
  pets: Pet[];
}

/**
 * Верхний остров фильтров записей клиента:
 * переключение вкладок «Предстоящие / Прошедшие / Все», выбор питомца и кнопка новой записи.
 */
export function AppointmentsFilters({
  tab,
  onTabChange,
  selectedPetId,
  onPetChange,
  pets,
}: AppointmentsFiltersProps) {
  return (
    <section className="island filters" aria-label="Фильтры">
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
            className={`seg-item ${tab === 'COMPLETED' ? 'on' : ''}`}
            onClick={() => onTabChange('COMPLETED')}
          >
            Прошедшие
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

      <div className="field">
        <span className="field-label">Питомец</span>
        <select
          className="select"
          value={selectedPetId}
          onChange={(e) => onPetChange(e.target.value)}
        >
          <option value="ALL">Все питомцы</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="spacer" />

      <Link
        href="/client/book"
        className="btn btn-primary"
        style={{ textDecoration: 'none', alignSelf: 'flex-end', height: '34px' }}
      >
        <CalendarPlus className="ic" />
        <span>Записаться</span>
      </Link>
    </section>
  );
}
