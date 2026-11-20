'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Trash2, Pencil, X, ChevronLeft, ChevronRight, CalendarOff } from 'lucide-react';
import type { ScheduleException } from '@/modules/admin/types';
import type { Veterinarian } from '@/modules/clinic/types';
import {
  DatePicker,
  SearchCombobox,
  type SearchComboboxOption,
} from '@/shared/components';
import { formatIsoDateDisplay, getMoscowTodayIso, getDoctorDisplay, getSpecStyle, getSpecTone } from '@/shared/lib';
import dynamic from 'next/dynamic';
import { VetAvatar } from '@/components/ui/EntityAvatar';

const ExceptionsCalendarView = dynamic(
  () => import('./ExceptionsCalendarView').then((m) => m.ExceptionsCalendarView),
  { ssr: false }
);

export interface ExceptionsTableProps {
  exceptions: ScheduleException[];
  vets: Veterinarian[];
  specsMap?: Record<string, string>;
  loading: boolean;
  vetFilter: string;
  onVetFilterChange: (vetId: string) => void;
  exTypeFilter?: string;
  onExTypeFilterChange?: (type: string) => void;
  exFromFilter?: string;
  onExFromFilterChange?: (from: string) => void;
  exToFilter?: string;
  onExToFilterChange?: (to: string) => void;
  onResetFilters?: () => void;
  onRefresh: () => void;
  onEdit: (exception: ScheduleException) => void;
  onDelete: (exception: ScheduleException) => void;
}

const PAGE_SIZE = 10;

export const ExceptionsTable: React.FC<ExceptionsTableProps> = ({
  exceptions,
  vets,
  specsMap,
  loading,
  vetFilter,
  onVetFilterChange,
  exTypeFilter: propExTypeFilter,
  onExTypeFilterChange,
  exFromFilter: propExFromFilter,
  onExFromFilterChange,
  exToFilter: propExToFilter,
  onExToFilterChange,
  onResetFilters,
  onRefresh,
  onEdit,
  onDelete,
}) => {
  const [internalExTypeFilter, setInternalExTypeFilter] = useState<string>('');
  const [internalExFromFilter, setInternalExFromFilter] = useState<string>(() => getMoscowTodayIso(-1));
  const [internalExToFilter, setInternalExToFilter] = useState<string>(() => getMoscowTodayIso(6));
  const [currentPage, setCurrentPage] = useState<number>(1);

  const exTypeFilter = propExTypeFilter !== undefined ? propExTypeFilter : internalExTypeFilter;
  const setExTypeFilter = onExTypeFilterChange ?? setInternalExTypeFilter;

  const exFromFilter = propExFromFilter !== undefined ? propExFromFilter : internalExFromFilter;
  const setExFromFilter = onExFromFilterChange ?? setInternalExFromFilter;

  const exToFilter = propExToFilter !== undefined ? propExToFilter : internalExToFilter;
  const setExToFilter = onExToFilterChange ?? setInternalExToFilter;

  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      onVetFilterChange('');
      setExTypeFilter('');
      setExFromFilter(getMoscowTodayIso(-1));
      setExToFilter(getMoscowTodayIso(6));
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [vetFilter, exTypeFilter, exFromFilter, exToFilter]);

  const vetOptions = useMemo<SearchComboboxOption[]>(
    () => [
      { value: 'ALL', label: 'Все врачи' },
      ...vets.map((v) => {
        const doc = getDoctorDisplay(v, specsMap);
        return {
          value: v.id,
          label: doc.fullName,
          hint: doc.specName,
          avatar: (
            <VetAvatar
              vet={v}
              initials={doc.initials}
              tone={getSpecTone(v.specializationId)}
              style={getSpecStyle(v.specializationId)}
              variant="thumb"
              className="t-ava xs round"
              alt={doc.fullName}
            />
          ),
        };
      }),
    ],
    [vets, specsMap]
  );

  const filteredExceptions = useMemo(
    () =>
      [...exceptions]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .filter((e) => {
          if (vetFilter && vetFilter !== 'ALL' && e.veterinarianId !== vetFilter) return false;
          if (exTypeFilter && e.type !== exTypeFilter) return false;
          if (exFromFilter && e.endDate < exFromFilter) return false;
          if (exToFilter && e.startDate > exToFilter) return false;
          return true;
        }),
    [exceptions, vetFilter, exTypeFilter, exFromFilter, exToFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredExceptions.length / PAGE_SIZE));
  const paginatedExceptions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredExceptions.slice(start, start + PAGE_SIZE);
  }, [filteredExceptions, currentPage]);

  const hasActiveFilters = Boolean((vetFilter && vetFilter !== 'ALL') || exTypeFilter || exFromFilter || exToFilter);

  const todayIso = useMemo(() => getMoscowTodayIso(), []);
  const activeAbsences = useMemo(() => {
    return exceptions.filter(
      (e) => e.type === 'ABSENCE' && e.startDate <= todayIso && e.endDate >= todayIso
    );
  }, [exceptions, todayIso]);

  return (
    <>
      {activeAbsences.length > 0 && (
        <div
          className="island"
          style={{
            flex: 'none',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '12px 18px',
            background: 'color-mix(in srgb, var(--primary) 7%, var(--card))',
            border: '1px solid color-mix(in srgb, var(--primary) 28%, var(--border))',
            borderRadius: 'var(--radius)',
            gap: '14px',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <CalendarOff size={19} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 260, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
              <span style={{ fontWeight: 650, fontSize: '13.5px' }}>
                Сейчас отсутствуют в клинике ({activeAbsences.length})
              </span>
              <span className="small muted">· на сегодня ({formatIsoDateDisplay(todayIso)})</span>
            </div>
            <div className="row wrap" style={{ gap: '6px 10px', justifyContent: 'flex-start' }}>
              {activeAbsences.map((e) => {
                const doc = vets.find((v) => v.id === e.veterinarianId);
                const docInfo = doc ? getDoctorDisplay(doc, specsMap) : null;
                const name = docInfo ? docInfo.fullName : 'Врач';
                return (
                  <span
                    key={e.id}
                    className="small"
                    style={{
                      background: 'color-mix(in srgb, var(--card) 80%, transparent)',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <VetAvatar
                      vet={doc}
                      initials={docInfo?.initials || 'ВР'}
                      tone={getSpecTone(doc?.specializationId)}
                      style={getSpecStyle(doc?.specializationId)}
                      variant="thumb"
                      className="t-ava xs round"
                      alt={name}
                    />
                    <b>{name}</b>
                    <span className="muted">· {e.reason || 'Отсутствие'} (по {formatIsoDateDisplay(e.endDate)})</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <section className="island filters" style={{ flex: 'none', overflow: 'visible' }} aria-label="Фильтры исключений">
        <div className="field" style={{ minWidth: 210, flex: '1 1 210px' }}>
          <label className="field-label" htmlFor="exc-vet-filter">
            Врач
          </label>
          <SearchCombobox
            id="exc-vet-filter"
            value={vetFilter || 'ALL'}
            options={vetOptions}
            onChange={(val) => onVetFilterChange(val === 'ALL' ? '' : val)}
            placeholder="Все врачи"
            ariaLabel="Фильтр по врачу"
          />
        </div>

        <div className="field" style={{ width: 'auto', flex: 'none' }}>
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

        <div className="field" style={{ width: 155, flex: 'none' }}>
          <label className="field-label" htmlFor="exc-from-filter">
            Дата с
          </label>
          <DatePicker
            id="exc-from-filter"
            value={exFromFilter}
            onChange={setExFromFilter}
            ariaLabel="Дата с"
          />
        </div>

        <div className="field" style={{ width: 155, flex: 'none' }}>
          <label className="field-label" htmlFor="exc-to-filter">
            Дата по
          </label>
          <DatePicker
            id="exc-to-filter"
            value={exToFilter}
            onChange={setExToFilter}
            ariaLabel="Дата по"
          />
        </div>

        {hasActiveFilters && (
          <div className="field" style={{ flex: 'none', marginLeft: 'auto', alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleReset}
              style={{ height: '36px' }}
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
        specsMap={specsMap}
        vetFilter={vetFilter}
        typeFilter={exTypeFilter}
        fromFilter={exFromFilter}
        toFilter={exToFilter}
        onEdit={onEdit}
      />

      <section className="island" style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
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
            style={{ '--cols': '1.3fr 0.9fr 1.3fr 0.9fr 1.6fr 80px', minWidth: '820px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Врач</span>
              <span>Тип</span>
              <span>Даты ↑</span>
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
                    <span className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <VetAvatar
                        vet={vet}
                        initials={getDoctorDisplay(vet, specsMap).initials}
                        tone={getSpecTone(vet?.specializationId)}
                        style={getSpecStyle(vet?.specializationId)}
                        variant="thumb"
                        className="t-ava xs round"
                        alt={getDoctorDisplay(vet, specsMap).fullName}
                      />
                      <span className="cell-main">{getDoctorDisplay(vet, specsMap).fullName}</span>
                    </span>
                    <span>
                      <span className={`badge ${isAbsence ? 'due-over' : 'badge-accent'}`}>
                        {isAbsence ? 'Отсутствие' : 'Особые часы'}
                      </span>
                    </span>
                    <span className="tnum">
                      {rangeStr}
                      {ex.type === 'ABSENCE' && ex.startDate <= todayIso && ex.endDate >= todayIso && (
                        <span className="badge badge-accent small" style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px' }}>
                          Сейчас
                        </span>
                      )}
                    </span>
                    <span className="tnum">{timeStr}</span>
                    <span className="muted">{ex.reason || '—'}</span>
                    <span className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label="Изменить"
                        title="Изменить исключение"
                        onClick={() => onEdit(ex)}
                      >
                        <Pencil className="ic" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--destructive)' }}
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
          <div className="island-foot" style={{ justifyContent: 'flex-end' }}>
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
                  className={`btn btn-ghost btn-sm ${p === currentPage ? 'on' : ''}`}
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
