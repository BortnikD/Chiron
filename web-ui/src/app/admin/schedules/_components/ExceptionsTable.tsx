'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Veterinarian, ScheduleException } from '../../../../types';
import {
  CalendarOff,
  RefreshCw,
  Trash2,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatIsoDisplay } from './utils';

export interface ExceptionsTableProps {
  exceptions: ScheduleException[];
  vets: Veterinarian[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (exception: ScheduleException) => void;
  onDelete: (exception: ScheduleException) => void;
  initialVetFilter?: string;
}

const NDAYS = 35;
const PAGE_SIZE = 10;

/**
 * Компонент таблицы исключений из расписания.
 * Включает панель фильтрации (по врачу, типу и датам),
 * 35-дневную диаграмму Ганта (календарь исключений)
 * и таблицу записей с пагинацией и действиями (редактирование, удаление).
 */
export const ExceptionsTable: React.FC<ExceptionsTableProps> = ({
  exceptions,
  vets,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  initialVetFilter = '',
}) => {
  // Фильтры
  const [exVetFilter, setExVetFilter] = useState<string>(initialVetFilter);
  const [exTypeFilter, setExTypeFilter] = useState<string>(''); // '' | 'ABSENCE' | 'CUSTOM_HOURS'
  const [exFromFilter, setExFromFilter] = useState<string>('');
  const [exToFilter, setExToFilter] = useState<string>('');

  // Пагинация
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Синхронизация фильтра врача при смене входного параметра
  useEffect(() => {
    if (initialVetFilter) {
      setExVetFilter(initialVetFilter);
    }
  }, [initialVetFilter]);

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [exVetFilter, exTypeFilter, exFromFilter, exToFilter]);

  // Фильтрованный список исключений
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((e) => {
      if (exVetFilter && e.veterinarianId !== exVetFilter) return false;
      if (exTypeFilter && e.type !== exTypeFilter) return false;
      if (exFromFilter && e.endDate < exFromFilter) return false;
      if (exToFilter && e.startDate > exToFilter) return false;
      return true;
    });
  }, [exceptions, exVetFilter, exTypeFilter, exFromFilter, exToFilter]);

  // Данные пагинации
  const totalPages = Math.max(1, Math.ceil(filteredExceptions.length / PAGE_SIZE));
  const paginatedExceptions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredExceptions.slice(start, start + PAGE_SIZE);
  }, [filteredExceptions, currentPage]);

  // Дни для диаграммы Ганта исключений (35 дней от сегодня)
  const ganttDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: NDAYS }, (_, i) => {
      const d = new Date(today.getTime() + i * 86400000);
      const isMonday = d.getDay() === 1;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const dayNum = d.getDate();
      const monthNum = d.getMonth() + 1;
      const label =
        isMonday || i === 0 ? `${dayNum}.${monthNum < 10 ? '0' : ''}${monthNum}` : '';
      const iso = d.toISOString().split('T')[0];

      return {
        i,
        iso,
        label,
        isWeekend,
      };
    });
  }, []);

  // Дорожки врачей в календаре исключений
  const ganttLanes = useMemo(() => {
    const todayIso = new Date().toISOString().split('T')[0];
    const targetVets = exVetFilter
      ? vets.filter((v) => v.id === exVetFilter)
      : vets;

    return targetVets.map((v) => {
      const vetExc = exceptions.filter((e) => e.veterinarianId === v.id);

      const bars = vetExc
        .map((e) => {
          const t0 = new Date(todayIso).getTime();
          const sT = new Date(e.startDate).getTime();
          const eT = new Date(e.endDate).getTime();

          const offStart = Math.floor((sT - t0) / 86400000);
          const offEnd = Math.floor((eT - t0) / 86400000);

          if (offEnd < 0 || offStart >= NDAYS) return null;

          const a = Math.max(0, offStart);
          const b = Math.min(NDAYS - 1, offEnd);

          const left = `${(a / NDAYS) * 100}%`;
          const width = `${Math.max(1, ((b - a + 1) / NDAYS) * 100)}%`;
          const isAbsence = e.type === 'ABSENCE';

          return {
            id: e.id,
            left,
            width,
            bg: isAbsence
              ? 'color-mix(in srgb, var(--destructive) 70%, transparent)'
              : 'var(--primary)',
            tip: `${v.user?.fullName || 'Врач'}: ${isAbsence ? 'Отсутствие' : 'Особые часы'}, ${formatIsoDisplay(e.startDate)}–${formatIsoDisplay(e.endDate)} · ${e.reason || ''}`,
            exception: e,
          };
        })
        .filter((b): b is NonNullable<typeof b> => Boolean(b));

      return {
        vetId: v.id,
        vetName: v.user?.fullName || 'Врач',
        bars,
      };
    });
  }, [vets, exceptions, exVetFilter]);

  const hasActiveFilters = Boolean(
    exVetFilter || exTypeFilter || exFromFilter || exToFilter
  );

  return (
    <>
      {/* Панель фильтров исключений */}
      <section className="island filters" aria-label="Фильтры исключений">
        <div className="field">
          <span className="field-label">Врач</span>
          <select
            className="select"
            value={exVetFilter}
            onChange={(e) => setExVetFilter(e.target.value)}
          >
            <option value="">Все врачи</option>
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                {v.user?.fullName || `Врач (${v.id.substring(0, 6)})`}
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
          <span className="field-label">Заканчиваются с</span>
          <input
            type="date"
            className="input input-sm"
            value={exFromFilter}
            onChange={(e) => setExFromFilter(e.target.value)}
          />
        </div>

        <div className="field" style={{ width: '160px' }}>
          <span className="field-label">Начинаются до</span>
          <input
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

      {/* Блок «Календарь исключений» (35-дневная диаграмма Ганта) */}
      <section className="island" style={{ flex: 'none' }}>
        <div className="island-head">
          <span className="island-title">
            <CalendarOff className="ic" />
            <span>Календарь исключений</span>
          </span>
          <div className="legend">
            <span>
              <i style={{ background: 'color-mix(in srgb, var(--destructive) 65%, transparent)' }} />
              Отсутствие
            </span>
            <span>
              <i style={{ background: 'var(--primary)' }} />
              Особые часы
            </span>
          </div>
        </div>

        <div className="island-body" style={{ overflowX: 'auto', padding: '12px 14px' }}>
          <div style={{ minWidth: '760px' }}>
            {/* Заголовок дней месяца */}
            <div className="row" style={{ gap: 0, paddingLeft: '130px', marginBottom: '4px' }}>
              {ganttDays.map((d) => (
                <span
                  key={d.i}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'center',
                    fontSize: '10px',
                    fontWeight: d.isWeekend ? 600 : 400,
                  }}
                  className="muted"
                >
                  {d.label}
                </span>
              ))}
            </div>

            {/* Дорожки врачей */}
            {ganttLanes.map((lane) => (
              <div
                key={lane.vetId}
                className="row"
                style={{
                  gap: 0,
                  height: '28px',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}
              >
                <span
                  className="small"
                  style={{
                    width: '130px',
                    flex: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: '8px',
                  }}
                  title={lane.vetName}
                >
                  {lane.vetName}
                </span>

                <div className="grow" style={{ position: 'relative', height: '100%' }}>
                  {lane.bars.map((bar) => (
                    <div
                      key={bar.id}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        height: '16px',
                        left: bar.left,
                        width: bar.width,
                        background: bar.bg,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      title={bar.tip}
                      onClick={() => onEdit(bar.exception)}
                    />
                  ))}
                  {/* Маркер текущего дня */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: '2px',
                      background: 'var(--primary)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Таблица исключений .dtable */}
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
          >
            <RefreshCw className={`ic ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="table-wrap">
          <div
            className="dtable"
            style={{
              // @ts-ignore
              '--cols': '1.3fr 0.9fr 1.3fr 0.9fr 1.6fr 70px',
              minWidth: '820px',
            }}
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
                    ? formatIsoDisplay(ex.startDate)
                    : `${formatIsoDisplay(ex.startDate)} – ${formatIsoDisplay(ex.endDate)}`;
                const timeStr =
                  ex.type === 'CUSTOM_HOURS' && ex.startTime && ex.endTime
                    ? `${ex.startTime.slice(0, 5)}–${ex.endTime.slice(0, 5)}`
                    : '—';

                return (
                  <div key={ex.id} className="trow static">
                    <span className="cell-main">{vet?.user?.fullName || 'Врач'}</span>
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

        {/* Пагинация таблицы исключений */}
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
