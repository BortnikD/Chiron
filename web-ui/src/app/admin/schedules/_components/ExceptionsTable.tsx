'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Trash2, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScheduleException } from '@/modules/admin/types';
import type { Veterinarian } from '@/modules/clinic/types';
import { formatIsoDateDisplay } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { ExceptionsCalendarView } from './ExceptionsCalendarView';

export interface ExceptionsTableProps {
  exceptions: ScheduleException[];
  vets: Veterinarian[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (exception: ScheduleException) => void;
  onDelete: (exception: ScheduleException) => void;
  initialVetFilter?: string;
}

const PAGE_SIZE = 10;

export const ExceptionsTable: React.FC<ExceptionsTableProps> = ({
  exceptions,
  vets,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  initialVetFilter = '',
}) => {
  const [exVetFilter, setExVetFilter] = useState<string>(initialVetFilter);
  const [exTypeFilter, setExTypeFilter] = useState<string>('');
  const [exFromFilter, setExFromFilter] = useState<string>('');
  const [exToFilter, setExToFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (initialVetFilter) setExVetFilter(initialVetFilter);
  }, [initialVetFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [exVetFilter, exTypeFilter, exFromFilter, exToFilter]);

  const filteredExceptions = useMemo(
    () =>
      exceptions.filter((e) => {
        if (exVetFilter && e.veterinarianId !== exVetFilter) return false;
        if (exTypeFilter && e.type !== exTypeFilter) return false;
        if (exFromFilter && e.endDate < exFromFilter) return false;
        if (exToFilter && e.startDate > exToFilter) return false;
        return true;
      }),
    [exceptions, exVetFilter, exTypeFilter, exFromFilter, exToFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredExceptions.length / PAGE_SIZE));
  const paginatedExceptions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredExceptions.slice(start, start + PAGE_SIZE);
  }, [filteredExceptions, currentPage]);

  const hasActiveFilters = Boolean(exVetFilter || exTypeFilter || exFromFilter || exToFilter);

  return (
    <>
      <section className="island filters" aria-label="Фильтры исключений">
        <div className="field">
          <label className="field-label" htmlFor="exc-vet-filter">Врач</label>
          <select
            id="exc-vet-filter"
            className="select"
            value={exVetFilter}
            onChange={(e) => setExVetFilter(e.target.value)}
          >
            <option value="">Все врачи</option>
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                {getDoctorDisplay(v).fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ width: 'auto' }}>
          <span className="field-label">Тип</span>
          <div className="seg">
            {[
              { val: '', label: 'Все' },
              { val: 'ABSENCE', label: 'Отсутствие' },
              { val: 'CUSTOM_HOURS', label: 'Особые часы' },
            ].map((chip) => (
              <button
                key={chip.val}
                type="button"
                className={`seg-item ${exTypeFilter === chip.val ? 'on' : ''}`}
                onClick={() => setExTypeFilter(chip.val)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field" style={{ width: '160px' }}>
          <label className="field-label" htmlFor="exc-from-filter">Заканчиваются с</label>
          <input
            id="exc-from-filter"
            type="date"
            className="input input-sm"
            value={exFromFilter}
            onChange={(e) => setExFromFilter(e.target.value)}
          />
        </div>

        <div className="field" style={{ width: '160px' }}>
          <label className="field-label" htmlFor="exc-to-filter">Начинаются до</label>
          <input
            id="exc-to-filter"
            type="date"
            className="input input-sm"
            value={exToFilter}
            onChange={(e) => setExToFilter(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <div className="field" style={{ justifyContent: 'flex-end', marginLeft: 'auto' }}>
            <span className="field-label">&nbsp;</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setExVetFilter('');
                setExTypeFilter('');
                setExFromFilter('');
                setExToFilter('');
              }}
            >
              <X className="ic" style={{ width: '13px', height: '13px' }} />
              <span>Сбросить</span>
            </button>
          </div>
        )}
      </section>

      <ExceptionsCalendarView
        exceptions={exceptions}
        vets={vets}
        vetFilter={exVetFilter}
        onEdit={onEdit}
      />

      <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="island-head">
          <span className="island-title">
            <span>Список</span>
            <span className="count">Найдено: {filteredExceptions.length}</span>
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onRefresh}
            title="Обновить"
            aria-label="Обновить список исключений"
          >
            <RefreshCw className={`ic ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="table-wrap">
          <div
            className="dtable"
            style={{ '--cols': '1.3fr 0.9fr 1.3fr 0.9fr 1.6fr 70px', minWidth: '820px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Врач</span>
              <span>Тип</span>
              <span>Даты</span>
              <span>Время</span>
              <span>Причина</span>
              <span />
            </div>

            {filteredExceptions.length === 0 ? (
              <div className="empty" style={{ padding: '32px' }}>
                <span className="empty-title">Исключений не найдено</span>
                <span>Внесите отпуск, больничный или особые часы работы</span>
              </div>
            ) : (
              paginatedExceptions.map((ex) => {
                const vet = vets.find((v) => v.id === ex.veterinarianId);
                const isAbsence = ex.type === 'ABSENCE';
                const rangeStr =
                  ex.startDate === ex.endDate
                    ? formatIsoDateDisplay(ex.startDate)
                    : `${formatIsoDateDisplay(ex.startDate)} – ${formatIsoDateDisplay(ex.endDate)}`;
                const timeStr =
                  ex.type === 'CUSTOM_HOURS' && ex.startTime && ex.endTime
                    ? `${ex.startTime.slice(0, 5)}–${ex.endTime.slice(0, 5)}`
                    : '—';

                return (
                  <div key={ex.id} className="trow static">
                    <span className="cell-main">{getDoctorDisplay(vet).fullName}</span>
                    <span>
                      <span className={`badge ${isAbsence ? 'due-over' : 'badge-accent'}`}>
                        {isAbsence ? 'Отсутствие' : 'Особые часы'}
                      </span>
                    </span>
                    <span className="tnum">{rangeStr}</span>
                    <span className="tnum">{timeStr}</span>
                    <span className="muted">{ex.reason || '—'}</span>
                    <span className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label="Редактировать"
                        title="Редактировать исключение"
                        onClick={() => onEdit(ex)}
                      >
                        <Pencil className="ic" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm text-[var(--destructive)]"
                        aria-label="Удалить"
                        title="Удалить исключение"
                        onClick={() => onDelete(ex)}
                      >
                        <Trash2 className="ic" />
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {filteredExceptions.length > PAGE_SIZE && (
          <div
            className="row between"
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              alignItems: 'center',
            }}
          >
            <span className="small muted">
              Показано {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredExceptions.length)} из{' '}
              {filteredExceptions.length}
            </span>

            <div className="pager">
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="ic" />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${p === currentPage ? 'on' : 'btn-ghost'}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Следующая страница"
              >
                <ChevronRight className="ic" />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
};
