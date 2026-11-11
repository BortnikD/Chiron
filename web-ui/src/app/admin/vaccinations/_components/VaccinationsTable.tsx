'use client';

import React, { useMemo } from 'react';
import { Syringe, Edit2, Trash2 } from 'lucide-react';
import type { Vaccination, Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { formatIsoDateDisplay, getSpeciesTone } from '@/shared/lib';
import { calculateVaccinationStatus } from './utils';
import { VACCINATIONS_TABLE_COLS } from './constants';

export interface VaccinationsTableProps {
  vaccinations: Vaccination[];
  pets: Pet[];
  speciesList: Species[];
  selectedVaccination?: Vaccination | null;
  loading: boolean;
  onSelect: (vaccination: Vaccination) => void;
  onEdit: (vaccination: Vaccination) => void;
  onDelete: (id: string) => void;
}

/**
 * Таблица списка вакцинаций (.dtable, дата, питомец, вакцина, следующая ревакцинация, бейдж статуса).
 */
export const VaccinationsTable: React.FC<VaccinationsTableProps> = ({
  vaccinations,
  pets,
  speciesList,
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
          Прививки
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
            <span>Введена ↓</span>
            <span>Следующая</span>
            <span>Срок</span>
            <span className="right">Действия</span>
          </div>

          {!loading &&
            vaccinations.map((v) => {
              const isSelected = selectedVaccination?.id === v.id;
              const pet = petMap.get(v.petId);
              const petName = pet?.name || 'Питомец';
              const tone = getSpeciesTone(
                pet?.species?.name || pet?.speciesName || pet?.speciesId,
                speciesList
              );
              const vaxName = v.name || v.vaccineName || 'Вакцинация';
              const adminRaw = v.administeredOn || v.administeredAt;
              const nextDueRaw = v.nextDueOn || v.validUntil;
              const adminDate = formatIsoDateDisplay(adminRaw ? adminRaw.slice(0, 10) : null);
              const nextDue = nextDueRaw ? formatIsoDateDisplay(nextDueRaw.slice(0, 10)) : '—';
              const status = calculateVaccinationStatus(nextDueRaw);

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
                    <span className={`t-ava xs tone-${tone}`}>
                      <SpeciesIcon species={tone} size={14} />
                    </span>
                    <span className="cell-main">{petName}</span>
                  </span>

                  <span className="cell-main">{vaxName}</span>
                  <span className="tnum">{adminDate}</span>
                  <span className="tnum">{nextDue || '—'}</span>

                  <span>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </span>

                  <span className="row-actions right">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      aria-label={`Редактировать вакцинацию «${vaxName}»`}
                      title="Редактировать"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(v);
                      }}
                    >
                      <Edit2 className="ic" size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm text-destructive"
                      aria-label={`Удалить вакцинацию «${vaxName}»`}
                      title="Удалить"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(v.id);
                      }}
                    >
                      <Trash2 className="ic" size={14} />
                    </button>
                  </span>
                </div>
              );
            })}
        </div>

        {loading && (
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="muted">Загрузка данных реестра…</span>
          </div>
        )}

        {!loading && vaccinations.length === 0 && (
          <div className="empty">
            <span className="empty-title">Ничего не найдено</span>
          </div>
        )}
      </div>
    </section>
  );
};
