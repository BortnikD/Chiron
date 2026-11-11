'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Calendar, CalendarOff } from 'lucide-react';
import type { WorkSchedule, ScheduleException } from '@/modules/admin/types';
import type { Species } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  DOW_LABELS,
  DOW_ORDER,
  formatApiError,
  formatIsoDateDisplay,
  getSpeciesTone,
} from '@/shared/lib';

export interface VetDetailTabsSectionProps {
  vetId: string;
  activeTab: 'species' | 'schedule' | 'exceptions';
  speciesList: Species[];
  permittedSpeciesIds: string[];
  vetSchedules: WorkSchedule[];
  vetExceptions: ScheduleException[];
  loadingDetails: boolean;
  detailsError: string | null;
  onToggleSpeciesPermission: (
    vetId: string,
    speciesId: string,
    isCurrentlyPermitted: boolean
  ) => Promise<void>;
}

export const VetDetailTabsSection: React.FC<VetDetailTabsSectionProps> = ({
  vetId,
  activeTab,
  speciesList,
  permittedSpeciesIds,
  vetSchedules,
  vetExceptions,
  loadingDetails,
  detailsError,
  onToggleSpeciesPermission,
}) => {
  const [permError, setPermError] = useState<string | null>(null);
  const [togglingSpeciesId, setTogglingSpeciesId] = useState<string | null>(null);

  const handleToggle = async (speciesId: string) => {
    const isPermitted = permittedSpeciesIds.includes(speciesId);
    setPermError(null);
    setTogglingSpeciesId(speciesId);
    try {
      await onToggleSpeciesPermission(vetId, speciesId, isPermitted);
    } catch (err: unknown) {
      setPermError(formatApiError(err, 'Не удалось изменить допуск к виду'));
    } finally {
      setTogglingSpeciesId(null);
    }
  };

  if (detailsError && !loadingDetails && activeTab !== 'species') {
    return (
      <div className="alert alert-destructive" role="alert">
        <AlertCircle size={16} className="ic" />
        <div>{detailsError}</div>
      </div>
    );
  }

  if (loadingDetails && activeTab !== 'species') {
    return (
      <div className="empty" style={{ padding: 24 }}>
        <span className="spinner" aria-hidden="true" />
        <span className="muted">Загрузка…</span>
      </div>
    );
  }

  if (activeTab === 'species') {
    return (
      <div className="col" style={{ gap: 12 }}>
        <span className="small muted">
          Включите вид, чтобы врач мог принимать таких пациентов. Без допуска запись к врачу для
          этого вида недоступна.
        </span>

        {detailsError && (
          <div className="alert alert-destructive" role="alert">
            <AlertCircle size={16} className="ic" />
            <div>{detailsError}</div>
          </div>
        )}

        {permError && (
          <div className="alert alert-destructive" role="alert">
            <AlertCircle size={16} className="ic" />
            <div>{permError}</div>
          </div>
        )}

        <div className="col" style={{ gap: 6 }}>
          {speciesList.map((sp) => {
            const isPermitted = permittedSpeciesIds.includes(sp.id);
            const busy = togglingSpeciesId === sp.id;
            const tone = getSpeciesTone(sp.name);
            return (
              <div
                key={sp.id}
                className="row between"
                style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
              >
                <span className={`sp-chip tone-${tone}`}>
                  <SpeciesIcon species={tone} size={14} className="ic" />
                  {sp.name}
                </span>
                <div className="row" style={{ gap: 10 }}>
                  <span className="small muted">{isPermitted ? 'допущен' : 'нет допуска'}</span>
                  <button
                    type="button"
                    className={`switch ${isPermitted ? 'on' : ''}`}
                    role="switch"
                    aria-checked={isPermitted}
                    aria-label={`Допуск: ${sp.name}`}
                    disabled={busy}
                    onClick={() => void handleToggle(sp.id)}
                  />
                </div>
              </div>
            );
          })}

          {speciesList.length === 0 && (
            <span className="small muted">Виды животных пока не добавлены</span>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'schedule') {
    return (
      <div className="col" style={{ gap: 10 }}>
        <div className="dtable" style={{ '--cols': '40px 1fr 1fr' } as React.CSSProperties}>
          {DOW_ORDER.map((dow) => {
            const item = vetSchedules.find((s) => s.dayOfWeek === dow);
            return (
              <div key={dow} className="trow static compact">
                <span className="cell-main">{DOW_LABELS[dow]}</span>
                <span className="tnum">
                  {item ? `${item.startTime.slice(0, 5)}–${item.endTime.slice(0, 5)}` : 'Выходной'}
                </span>
                <span className="small muted">
                  {item && item.breakStart && item.breakEnd
                    ? `перерыв ${item.breakStart.slice(0, 5)}–${item.breakEnd.slice(0, 5)}`
                    : '—'}
                </span>
              </div>
            );
          })}
        </div>

        <Link
          href={`/admin/schedules?tab=schedules&vetId=${vetId}`}
          className="btn btn-outline btn-sm"
          style={{ alignSelf: 'flex-start' }}
        >
          <Calendar size={14} />
          Редактировать в «Расписаниях»
        </Link>
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 0 }}>
      {vetExceptions.map((e) => {
        const timePart =
          e.type === 'CUSTOM_HOURS' && e.startTime && e.endTime
            ? `${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)} · `
            : '';
        return (
          <div
            key={e.id}
            className="row between"
            style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}
          >
            <div className="col" style={{ gap: 0 }}>
              <span className="cell-main tnum">
                {formatIsoDateDisplay(e.startDate)}
                {e.endDate && e.endDate !== e.startDate
                  ? ` – ${formatIsoDateDisplay(e.endDate)}`
                  : ''}
              </span>
              <span className="cell-sub">{`${timePart}${e.reason || '—'}`}</span>
            </div>
            <span className={`badge ${e.type === 'ABSENCE' ? 'due-over' : 'badge-accent'}`}>
              {e.type === 'ABSENCE' ? 'Отсутствие' : 'Особые часы'}
            </span>
          </div>
        );
      })}

      {vetExceptions.length === 0 && (
        <span className="small muted" style={{ padding: '12px 0' }}>
          Исключений нет
        </span>
      )}

      <Link
        href={`/admin/schedules?tab=exc&vetId=${vetId}`}
        className="btn btn-outline btn-sm"
        style={{ alignSelf: 'flex-start', marginTop: 12 }}
      >
        <CalendarOff size={14} />
        Все исключения врача
      </Link>
    </div>
  );
};
