'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { ScheduleException } from '@/modules/clinic/types';
import { formatIsoDateDisplay } from '@/shared/lib';

export interface VetScheduleDetailIslandProps {
  selectedException: ScheduleException | null;
  onClose: () => void;
}

/**
 * Боковая карточка просмотра деталей выбранного исключения из графика (только чтение).
 */
export const VetScheduleDetailIsland: React.FC<VetScheduleDetailIslandProps> = ({
  selectedException,
  onClose,
}) => {
  if (!selectedException) return null;

  const isAbsence = selectedException.type === 'ABSENCE';
  const rangeText =
    selectedException.startDate === selectedException.endDate
      ? formatIsoDateDisplay(selectedException.startDate)
      : `${formatIsoDateDisplay(selectedException.startDate)} – ${formatIsoDateDisplay(selectedException.endDate)}`;

  return (
    <section className="island detail-island xl:w-[380px]" aria-label="Детали исключения">
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
              {isAbsence ? 'Отсутствие' : 'Особые часы'}
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
                    {selectedException.startTime.slice(0, 5)} –{' '}
                    {selectedException.endTime.slice(0, 5)}
                  </dd>
                </>
              )}
            <dt>Причина</dt>
            <dd>{selectedException.reason || '—'}</dd>
          </dl>

          <p className="small muted">
            Исключения и расписание смен настраивает администратор клиники.
          </p>
        </div>
      </div>
    </section>
  );
};
