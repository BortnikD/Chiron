'use client';

import React, { useMemo } from 'react';
import { Syringe, Edit2, Trash2 } from 'lucide-react';
import { Vaccination, Pet } from './types';
import { calculateVaccinationStatus } from './utils';
import { VACCINATIONS_TABLE_COLS } from './constants';

export interface VaccinationsTableProps {
  vaccinations: Vaccination[];
  pets: Pet[];
  selectedVaccination?: Vaccination | null;
  loading: boolean;
  onSelect: (vaccination: Vaccination) => void;
  onEdit: (vaccination: Vaccination) => void;
  onDelete: (id: string) => void;
}

/**
 * Таблица списка вакцинаций (.dtable, дата, питомец, вакцина, доза, следующая ревакцинация, бейдж статуса).
 */
export const VaccinationsTable: React.FC<VaccinationsTableProps> = ({
  vaccinations,
  pets,
  selectedVaccination,
  loading,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const petMap = useMemo(() => {
    const map = new Map<string, Pet>();
    pets.forEach((p) => map.set(p.id, p));
    return map;
  }, [pets]);

  return (
    <section className="island grow" aria-label="Таблица вакцинаций">
      <div className="island-head">
        <span className="island-title">
          <Syringe className="ic" />
          Вакцинации
          <span className="count">Найдено: {vaccinations.length}</span>
        </span>
      </div>

      <div className="table-wrap">
        <div
          className="dtable"
          style={
            {
              '--cols': VACCINATIONS_TABLE_COLS,
              minWidth: '760px',
            } as React.CSSProperties
          }
        >
          <div className="thead">
            <span>Питомец</span>
            <span>Вакцина</span>
            <span>Введено</span>
            <span>Следующая</span>
            <span>Срок</span>
            <span className="right">Действия</span>
          </div>

          {loading ? (
            <div
              style={{ padding: '36px', textAlign: 'center', gridColumn: '1 / -1' }}
              className="muted text-xs"
            >
              Загрузка данных реестра...
            </div>
          ) : vaccinations.length === 0 ? (
            <div
              style={{ padding: '36px', textAlign: 'center', gridColumn: '1 / -1' }}
              className="muted text-xs"
            >
              Записей по заданным критериям не найдено
            </div>
          ) : (
            vaccinations.map((v) => {
              const isSelected = selectedVaccination?.id === v.id;
              const pet = petMap.get(v.petId);
              const petName = pet?.name || 'Питомец';
              const vaxName = v.name || v.vaccineName || 'Вакцинация';
              const adminDate = v.administeredOn || v.administeredAt || '—';
              const nextDue = v.nextDueOn || v.validUntil;
              const status = calculateVaccinationStatus(nextDue);

              return (
                <div
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  className={`trow ${isSelected ? 'sel' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelect(v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(v);
                    }
                  }}
                >
                  <span className="pet-cell">
                    <span className="avatar sm font-bold bg-[var(--primary)] text-[var(--primary-foreground)]">
                      {petName.charAt(0).toUpperCase()}
                    </span>
                    <span className="cell-main">{petName}</span>
                  </span>

                  <span className="font-semibold">{vaxName}</span>
                  <span className="tnum font-mono">{adminDate}</span>
                  <span className="tnum font-mono">{nextDue || '—'}</span>

                  <span>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </span>

                  <span className="row-actions right">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(v);
                      }}
                      title="Редактировать"
                    >
                      <Edit2 className="ic" style={{ width: '13px', height: '13px' }} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(v.id);
                      }}
                      title="Удалить"
                      style={{ color: 'var(--destructive)' }}
                    >
                      <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
