'use client';

import React from 'react';
import { Appointment, ScheduleException } from '../../../../types';
import { X } from 'lucide-react';
import { STATUS_SHORT, formatIsoDisplay } from './utils';

export interface VetScheduleDetailIslandProps {
  selectedAppt: Appointment | null;
  selectedException?: ScheduleException | null;
  onClose: () => void;
  pets: Record<string, string>;
  services: Record<string, string>;
  onDeleteException?: (exception: ScheduleException) => void;
}

/**
 * Правый master-detail остров с деталями выбранного приёма (смены) или исключения.
 */
export const VetScheduleDetailIsland: React.FC<VetScheduleDetailIslandProps> = ({
  selectedAppt,
  selectedException,
  onClose,
  pets,
  services,
  onDeleteException,
}) => {
  if (selectedAppt) {
    const petName = pets[selectedAppt.petId] || 'Пациент';
    const svcName = services[selectedAppt.serviceId] || 'Приём';
    const startDate = new Date(selectedAppt.startAt);
    const endDate = new Date(selectedAppt.endAt);

    return (
      <section className="island detail-island" style={{ width: '420px' }} aria-label="Детали приёма">
        <div className="island-head">
          <div className="col" style={{ gap: '2px' }}>
            <span className="h2" style={{ wordBreak: 'break-word' }}>
              {petName} — {svcName}
            </span>
            <span className="cell-sub tnum">
              {startDate.toLocaleDateString('ru-RU')} в{' '}
              {startDate.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
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
          <div className="col" style={{ gap: '14px' }}>
            <div className="row wrap">
              <span className={`badge st badge-${selectedAppt.status}`}>
                {STATUS_SHORT[selectedAppt.status] || selectedAppt.status}
              </span>
              {selectedAppt.priceSnapshot && (
                <span className="cell-main tnum">
                  {selectedAppt.priceSnapshot.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>

            <dl className="kv" style={{ margin: 0 }}>
              <dt>Пациент</dt>
              <dd>{petName}</dd>
              <dt>Услуга</dt>
              <dd>{svcName}</dd>
              <dt>Время</dt>
              <dd className="tnum">
                {startDate.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                –
                {endDate.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </dl>

            {selectedAppt.clientComment && (
              <div className="col" style={{ gap: '4px' }}>
                <span className="section-title">Комментарий клиента</span>
                <div className="note">{selectedAppt.clientComment}</div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (selectedException) {
    const isAbsence = selectedException.type === 'ABSENCE';
    const rangeText =
      selectedException.startDate === selectedException.endDate
        ? formatIsoDisplay(selectedException.startDate)
        : `${formatIsoDisplay(selectedException.startDate)} – ${formatIsoDisplay(selectedException.endDate)}`;

    return (
      <section className="island detail-island" style={{ width: '420px' }} aria-label="Детали исключения">
        <div className="island-head">
          <div className="col" style={{ gap: '2px' }}>
            <span className="h2" style={{ wordBreak: 'break-word' }}>
              {isAbsence ? 'Отсутствие врача' : 'Особый график работы'}
            </span>
            <span className="cell-sub tnum">{rangeText}</span>
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
          <div className="col" style={{ gap: '14px' }}>
            <div className="row wrap">
              <span className={`badge ${isAbsence ? 'due-over' : 'badge-accent'}`}>
                {isAbsence ? 'Отпуск / Больничный' : 'Особые часы'}
              </span>
            </div>

            <dl className="kv" style={{ margin: 0 }}>
              <dt>Период</dt>
              <dd className="tnum">{rangeText}</dd>
              {selectedException.type === 'CUSTOM_HOURS' &&
                selectedException.startTime &&
                selectedException.endTime && (
                  <>
                    <dt>Часы работы</dt>
                    <dd className="tnum">
                      {selectedException.startTime.slice(0, 5)} – {selectedException.endTime.slice(0, 5)}
                    </dd>
                  </>
                )}
              <dt>Причина</dt>
              <dd>{selectedException.reason || '—'}</dd>
            </dl>

            {onDeleteException && (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-destructive"
                  onClick={() => onDeleteException(selectedException)}
                >
                  Удалить исключение
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return null;
};
