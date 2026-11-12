'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarPlus, X } from 'lucide-react';
import type { Pet, Vaccination } from '@/modules/client/types';
import { formatIsoDateDisplay, getMoscowDateKey } from '@/shared/lib';
import { getVaccinationStatus } from '../_hooks/useClientVaccinations';

export interface VaccinationDetailIslandProps {
  vaccination: Vaccination;
  pet?: Pet | null;
  onClose: () => void;
}

/**
 * Правый остров детального просмотра выбранной прививки.
 */
export function VaccinationDetailIsland({
  vaccination,
  pet,
  onClose,
}: VaccinationDetailIslandProps) {
  const name = vaccination.name || vaccination.vaccineName || 'Прививка';
  const rawAdmin = vaccination.administeredOn || vaccination.administeredAt;
  const adminLabel = rawAdmin
    ? formatIsoDateDisplay(getMoscowDateKey(rawAdmin) || rawAdmin)
    : '—';
  const rawNext = vaccination.nextDueOn || vaccination.validUntil;
  const nextLabel = rawNext
    ? formatIsoDateDisplay(getMoscowDateKey(rawNext) || rawNext)
    : 'По показаниям';
  const status = getVaccinationStatus(rawNext);

  return (
    <section className="island detail-island" aria-label="Прививка">
      <div className="island-head">
        <div className="col" style={{ gap: '2px', minWidth: 0 }}>
          <span className="h2" style={{ wordBreak: 'break-word' }}>
            {name}
          </span>
          <span className="cell-sub">{pet?.name || 'Питомец'}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X className="ic" />
        </button>
      </div>

      <div className="island-body">
        <dl className="kv" style={{ margin: 0 }}>
          <dt>Вакцина</dt>
          <dd>{name}</dd>

          <dt>Введена</dt>
          <dd className="tnum">{adminLabel}</dd>

          <dt>Следующая доза</dt>
          <dd>
            <span className={`badge ${status.cls}`}>{nextLabel}</span>{' '}
            {rawNext && <span className="small muted">{status.label}</span>}
          </dd>

          {vaccination.batchNumber && (
            <>
              <dt>Серия / партия</dt>
              <dd className="tnum">{vaccination.batchNumber}</dd>
            </>
          )}

          <dt>Приём</dt>
          <dd>
            {vaccination.appointmentId ? (
              <Link
                href={`/client/appointments?sel=${encodeURIComponent(vaccination.appointmentId)}`}
                className="linkish"
              >
                Открыть приём
              </Link>
            ) : (
              'Внесено вручную'
            )}
          </dd>
        </dl>

        {vaccination.notes && (
          <div className="col" style={{ gap: '6px', marginTop: '14px' }}>
            <span className="section-title">Примечания</span>
            <div className="note">{vaccination.notes}</div>
          </div>
        )}

        <p className="small muted" style={{ marginTop: '16px' }}>
          Только просмотр. Изменения вносит врач или администратор.
        </p>
      </div>

      {pet && !pet.isArchived && (
        <div className="island-foot">
          <Link
            href={(() => {
              const params = new URLSearchParams({
                petId: pet.id,
                intent: 'vaccination',
              });
              const vaccineName = (vaccination.name || vaccination.vaccineName || '').trim();
              if (vaccineName) {
                params.set('vaccine', vaccineName);
              }
              return `/client/book?${params.toString()}`;
            })()}
            className="btn btn-primary btn-sm"
          >
            <CalendarPlus className="ic" />
            <span>Записаться на ревакцинацию</span>
          </Link>
        </div>
      )}
    </section>
  );
}
