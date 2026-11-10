'use client';

import React from 'react';
import { Trash2, X } from 'lucide-react';
import type { Appointment } from '@/modules/client/types';
import type { ScheduleException } from '@/modules/admin/types';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateShort,
  formatIsoDateDisplay,
  formatSlotTime,
} from '@/shared/lib';

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

    return (
      <section className="island detail-island" aria-label="Детали приёма">
        <div className="island-head">
          <div className="col" style={{ gap: '2px', minWidth: 0 }}>
            <span className="h2" style={{ wordBreak: 'break-word' }}>
              {petName} — {svcName}
            </span>
            <span className="cell-sub tnum">
              {formatDateShort(selectedAppt.startAt)} в {formatSlotTime(selectedAppt.startAt)}
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
                {APPOINTMENT_STATUS_META[selectedAppt.status]?.short || selectedAppt.status}
              </span>
              {selectedAppt.priceSnapshot != null && (
                <span className="cell-main tnum">{formatCurrency(selectedAppt.priceSnapshot)}</span>
              )}
            </div>

            <dl className="kv" style={{ margin: 0 }}>
              <dt>Пациент</dt>
              <dd>{petName}</dd>
              <dt>Услуга</dt>
              <dd>{svcName}</dd>
              <dt>Время</dt>
              <dd className="tnum">
                {formatSlotTime(selectedAppt.startAt)}–{formatSlotTime(selectedAppt.endAt)}
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
        ? formatIsoDateDisplay(selectedException.startDate)
        : `${formatIsoDateDisplay(selectedException.startDate)} – ${formatIsoDateDisplay(selectedException.endDate)}`;

    return (
      <section className="island detail-island" aria-label="Детали исключения">
        <div className="island-head">
          <div className="col" style={{ gap: '2px', minWidth: 0 }}>
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
                  className="btn btn-destructive-outline btn-sm"
                  onClick={() => onDeleteException(selectedException)}
                >
                  <Trash2 size={14} className="ic" />
                  <span>Удалить исключение</span>
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
