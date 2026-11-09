'use client';

import React from 'react';
import { X, Edit2, Trash2, Syringe, Calendar, PawPrint } from 'lucide-react';
import { Vaccination, Pet } from './types';
import { calculateVaccinationStatus } from './utils';

export interface VaccinationDetailIslandProps {
  vaccination: Vaccination;
  pet?: Pet;
  onClose: () => void;
  onEdit: (vaccination: Vaccination) => void;
  onDelete: (id: string) => void;
}

/**
 * Боковая панель Master-Detail с подробной информацией о вакцинации,
 * питомце, серии партии и сроках ревакцинации.
 */
export const VaccinationDetailIsland: React.FC<VaccinationDetailIslandProps> = ({
  vaccination,
  pet,
  onClose,
  onEdit,
  onDelete,
}) => {
  const vaxName = vaccination.name || vaccination.vaccineName || 'Вакцинация';
  const petName = pet?.name || 'Питомец';
  const adminDate = vaccination.administeredOn || vaccination.administeredAt || '—';
  const nextDue = vaccination.nextDueOn || vaccination.validUntil;
  const status = calculateVaccinationStatus(nextDue);

  return (
    <section className="island detail-island" aria-label="Детали вакцинации">
      <div className="island-head">
        <div className="col" style={{ gap: 2 }}>
          <span className="h2" style={{ wordBreak: 'break-word' }}>
            {vaxName}
          </span>
          <span className="cell-sub tnum">
            {petName}
            {pet?.species?.name ? ` (${pet.species.name})` : ''}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <span className={`badge ${status.cls}`}>{status.label}</span>
            {vaccination.batchNumber && (
              <span className="badge badge-outline">Партия: {vaccination.batchNumber}</span>
            )}
          </div>

          <dl className="kv" style={{ margin: 0 }}>
            <dt>Питомец</dt>
            <dd className="font-semibold">{petName}</dd>

            {pet?.species?.name && (
              <>
                <dt>Вид</dt>
                <dd>{pet.species.name}</dd>
              </>
            )}

            {pet?.breed && (
              <>
                <dt>Порода</dt>
                <dd>{pet.breed}</dd>
              </>
            )}

            {pet?.birthDate && (
              <>
                <dt>Дата рождения</dt>
                <dd className="tnum font-mono">{pet.birthDate}</dd>
              </>
            )}

            <dt>Препарат</dt>
            <dd className="font-semibold">{vaxName}</dd>

            <dt>Дата введения</dt>
            <dd className="tnum font-mono">{adminDate}</dd>

            <dt>След. доза</dt>
            <dd className="tnum font-mono">{nextDue || 'Не запланирована'}</dd>

            {vaccination.batchNumber && (
              <>
                <dt>Серия партии</dt>
                <dd className="font-mono">{vaccination.batchNumber}</dd>
              </>
            )}

            {vaccination.notes && (
              <>
                <dt>Примечания</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{vaccination.notes}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      <div
        className="island-foot"
        style={{
          marginTop: 'auto',
          paddingTop: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onDelete(vaccination.id)}
          style={{ color: 'var(--destructive)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Trash2 size={14} />
          <span>Удалить</span>
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onEdit(vaccination)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Edit2 size={14} />
          <span>Редактировать</span>
        </button>
      </div>
    </section>
  );
};
