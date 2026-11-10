'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import type { Veterinarian, Species } from '@/modules/clinic/types';
import { APPOINTMENT_STATUS_LIST, APPOINTMENT_STATUS_META } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface AdminAppointmentsFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  vetFilter: string;
  onVetFilterChange: (value: string) => void;
  speciesFilter: string;
  onSpeciesFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  veterinarians: Veterinarian[];
  speciesList: Species[];
  onCreateClick: () => void;
}

/**
 * Панель фильтрации записей на приём: статус, врач, вид животного, диапазон дат и текстовый поиск.
 */
export const AdminAppointmentsFilters: React.FC<AdminAppointmentsFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  vetFilter,
  onVetFilterChange,
  speciesFilter,
  onSpeciesFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  search,
  onSearchChange,
  veterinarians,
  speciesList,
  onCreateClick,
}) => {
  return (
    <section className="island filters" aria-label="Фильтры записей">
      <div className="field">
        <span className="field-label">Статус</span>
        <div className="dd">
          <select
            className="select dd-btn"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="ALL">Все статусы</option>
            {APPOINTMENT_STATUS_LIST.map((st) => (
              <option key={st} value={st}>
                {APPOINTMENT_STATUS_META[st].short}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Врач</span>
        <div className="dd">
          <select
            className="select dd-btn"
            value={vetFilter}
            onChange={(e) => onVetFilterChange(e.target.value)}
          >
            <option value="ALL">Все врачи</option>
            {veterinarians.map((v) => (
              <option key={v.id} value={v.id}>
                {getDoctorDisplay(v).fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Вид животного</span>
        <div className="dd">
          <select
            className="select dd-btn"
            value={speciesFilter}
            onChange={(e) => onSpeciesFilterChange(e.target.value)}
          >
            <option value="ALL">Все виды</option>
            {speciesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field" style={{ width: 140 }}>
        <label className="field-label" htmlFor="filter-from">
          С
        </label>
        <input
          id="filter-from"
          type="date"
          className="input"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </div>

      <div className="field" style={{ width: 140 }}>
        <label className="field-label" htmlFor="filter-to">
          По
        </label>
        <input
          id="filter-to"
          type="date"
          className="input"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>

      <div className="field" style={{ width: 180 }}>
        <span className="field-label">Поиск</span>
        <div className="input-icon">
          <Search size={14} className="ic" />
          <input
            type="text"
            className="input"
            placeholder="Питомец, услуга…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="spacer" />

      <button
        type="button"
        className="btn btn-primary"
        onClick={onCreateClick}
      >
        <Plus size={16} />
        Новая запись
      </button>
    </section>
  );
};
