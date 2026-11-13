'use client';

import React from 'react';
import Link from 'next/link';
import { X, Edit2, Trash2 } from 'lucide-react';
import type { Vaccination, Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { formatIsoDateDisplay } from '@/shared/lib';
import { calculateVaccinationStatus } from './utils';

export interface VaccinationDetailIslandProps {
  vaccination: Vaccination;
  pet?: Pet;
  speciesList: Species[];
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
  speciesList,
  onClose,
  onEdit,
  onDelete,
}) => {
  const vaxName = vaccination.name || vaccination.vaccineName || 'Вакцинация';
  const petName = pet?.name || 'Питомец';
  const speciesName =
    pet?.species?.name ||
    pet?.speciesName ||
    speciesList.find((sp) => sp.id === pet?.speciesId)?.name ||
    '';
  const adminRaw = vaccination.administeredOn || vaccination.administeredAt;
  const nextDueRaw = vaccination.nextDueOn || vaccination.validUntil;
  const adminDate = formatIsoDateDisplay(adminRaw ? adminRaw.slice(0, 10) : null);
  const nextDue = nextDueRaw ? formatIsoDateDisplay(nextDueRaw.slice(0, 10)) : null;
  const status = calculateVaccinationStatus(nextDueRaw);

  return (
    <section className="island detail-island" aria-label="Детали вакцинации">
      <div className="island-head">
        <div className="col" style={{ gap: 2 }}>
          <span className="h2" style={{ wordBreak: 'break-word' }}>
            {vaxName}
          </span>
          <span className="cell-sub tnum">
            {petName}
            {speciesName ? ` (${speciesName})` : ''}
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
            <dd>
              {pet ? (
                <Link href={`/admin/pets?sel=${pet.id}`} className="linkish">
                  {petName}
                </Link>
              ) : (
                petName
              )}
            </dd>

            {speciesName && (
              <>
                <dt>Вид</dt>
                <dd>{speciesName}</dd>
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
                <dd className="tnum">{formatIsoDateDisplay(pet.birthDate.slice(0, 10))}</dd>
              </>
            )}

            <dt>Препарат</dt>
            <dd>{vaxName}</dd>

            <dt>Дата введения</dt>
            <dd className="tnum">{adminDate}</dd>

            <dt>След. доза</dt>
            <dd className="tnum">{nextDue || 'Не запланирована'}</dd>

            {vaccination.batchNumber && (
              <>
                <dt>Серия партии</dt>
                <dd className="tnum">{vaccination.batchNumber}</dd>
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

      <div className="island-foot">
        <button
          type="button"
          className="btn btn-destructive-outline btn-sm"
          onClick={() => onDelete(vaccination.id)}
        >
          <Trash2 size={14} />
          <span>Удалить</span>
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onEdit(vaccination)}
        >
          <Edit2 size={14} />
          <span>Редактировать</span>
        </button>
      </div>
    </section>
  );
};
