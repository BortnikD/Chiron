'use client';

import React from 'react';
import { PawPrint } from 'lucide-react';
import { calculateAgeRu, getSpeciesTone } from '@/shared/lib';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import type { PetsTableProps } from './types';

/**
 * Таблица списка питомцев с поддержкой выбора активной строки,
 * отображения аватара вида, клички, породы, владельца, пола, возраста, веса и статуса.
 */
export const PetsTable: React.FC<PetsTableProps> = ({
  pets,
  selectedPet,
  speciesList,
  users,
  loading,
  onSelectPet,
}) => {
  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <PawPrint size={18} />
          Питомцы <span className="count">Найдено: {pets.length}</span>
        </span>
      </div>

      <div className="table-wrap">
        <div
          className="dtable"
          style={
            {
              '--cols': '1.2fr 0.8fr 0.7fr 0.8fr 0.7fr 1.3fr 0.7fr',
              minWidth: '820px',
            } as React.CSSProperties
          }
        >
          <div className="thead">
            <span>Кличка</span>
            <span>Вид</span>
            <span>Пол</span>
            <span>Возраст</span>
            <span>Вес</span>
            <span>Владелец</span>
            <span>Статус</span>
          </div>

          {pets.map((p) => {
            const isSelected = selectedPet?.id === p.id;
            const speciesName = speciesList.find((s) => s.id === p.speciesId)?.name || '—';
            const ownerName = users.find((u) => u.id === p.ownerId)?.fullName || '—';
            const age = calculateAgeRu(p.birthDate);
            const weight = p.weightKg != null ? `${String(p.weightKg).replace('.', ',')} кг` : '—';
            const tone = getSpeciesTone(p.species?.name || speciesName || p.speciesId, speciesList);

            return (
              <button
                key={p.id}
                type="button"
                className={`trow ${isSelected ? 'sel' : ''}`}
                onClick={() => onSelectPet(p)}
              >
                <span className="pet-cell">
                  <span className={`t-ava sm tone-${tone}`}>
                    <SpeciesIcon species={tone} size={14} />
                  </span>
                  <span className="col" style={{ gap: 0, textAlign: 'left', minWidth: 0 }}>
                    <span className="cell-main">{p.name}</span>
                    {p.breed && <span className="cell-sub">{p.breed}</span>}
                  </span>
                </span>
                <span>{speciesName}</span>
                <span>{p.gender === 'MALE' ? 'Самец' : 'Самка'}</span>
                <span className="tnum">{age}</span>
                <span className="tnum">{weight}</span>
                <span className="muted">{ownerName}</span>
                <span>
                  <span className={`badge ${p.isArchived ? 'badge-outline' : 'badge-accent'}`}>
                    {p.isArchived ? 'Архив' : 'Активен'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {loading && pets.length === 0 && (
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="small muted">Загрузка питомцев…</span>
          </div>
        )}

        {pets.length === 0 && !loading && (
          <div className="empty">
            <span className="empty-title">Питомцы не найдены</span>
          </div>
        )}
      </div>
    </section>
  );
};
