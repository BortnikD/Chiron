'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi, clinicApi } from '../../../api';
import {
  Veterinarian,
  WorkSchedule,
  ScheduleException,
  ScheduleExceptionType,
  DayOfWeek,
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
  CreateScheduleExceptionRequest,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Clock,
  Calendar,
  CalendarDays,
  CalendarOff,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const DOWS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DOWS_FULL = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

const DOW_TO_INDEX: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

const INDEX_TO_DOW: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const H0 = 8;
const H1 = 20;

function tm(t: string): number {
  if (!t) return 0;
  const parts = t.split(':');
  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
}

function pctX(t: string): string {
  const m = tm(t);
  const p = ((m - H0 * 60) / ((H1 - H0) * 60)) * 100;
  return `${Math.max(0, Math.min(100, p))}%`;
}

function pctW(a: string, b: string): string {
  const p = ((tm(b) - tm(a)) / ((H1 - H0) * 60)) * 100;
  return `${Math.max(0, Math.min(100, p))}%`;
}

function fmtH(m: number): string {
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h} ч${rem ? ` ${rem} мин` : ''}`;
}

function formatIsoDisplay(iso?: string | null): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function AdminSchedulesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const vetParam = searchParams.get('vetId') || searchParams.get('vet');

  const [activeTab, setActiveTab] = useState<'sched' | 'exc'>('sched');
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [loadingVets, setLoadingVets] = useState(true);

  // Выбранный врач для расписания
  const [selectedVetId, setSelectedVetId] = useState<string>('');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Модальное окно редактирования/создания дня расписания
  const [wsModal, setWsModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    dayIndex: number;
    scheduleId?: string;
    startTime: string;
    endTime: string;
    breakStart: string;
    breakEnd: string;
    error: string | null;
  }>({
    open: false,
    mode: 'create',
    dayIndex: 0,
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    error: null,
  });
  const [savingWs, setSavingWs] = useState(false);

  // Исключения
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [exVetFilter, setExVetFilter] = useState<string>('');
  const [exTypeFilter, setExTypeFilter] = useState<string>(''); // '' | 'ABSENCE' | 'CUSTOM_HOURS'
  const [exFromFilter, setExFromFilter] = useState<string>('');
  const [exToFilter, setExToFilter] = useState<string>('');

  // Модальное окно создания/редактирования исключения
  const [exModal, setExModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    id?: string;
    vetId: string;
    type: ScheduleExceptionType;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    reason: string;
    error: string | null;
  }>({
    open: false,
    mode: 'create',
    vetId: '',
    type: 'ABSENCE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '16:00',
    reason: '',
    error: null,
  });
  const [savingEx, setSavingEx] = useState(false);

  // Синхронизация вкладки из URL
  useEffect(() => {
    if (tabParam === 'exc' || tabParam === 'exceptions') {
      setActiveTab('exc');
    } else {
      setActiveTab('sched');
    }
  }, [tabParam]);

  // Загрузка врачей
  const loadVets = async () => {
    setLoadingVets(true);
    try {
      const res = await adminApi.getVeterinarians();
      const list = Array.isArray(res) ? res : [];
      setVets(list);

      // Выбор активного врача
      if (list.length > 0) {
        if (vetParam && list.some((v) => v.id === vetParam)) {
          setSelectedVetId(vetParam);
          setExVetFilter(vetParam);
        } else if (!selectedVetId) {
          setSelectedVetId(list[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setVets([]);
    } finally {
      setLoadingVets(false);
    }
  };

  useEffect(() => {
    loadVets();
  }, []);

  // Загрузка расписания при смене выбранного врача
  const loadSchedule = async (vetId: string) => {
    if (!vetId) return;
    setLoadingSchedule(true);
    try {
      const res = await clinicApi.getWorkSchedules(vetId);
      setSchedules(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setSchedules([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (selectedVetId) {
      loadSchedule(selectedVetId);
    }
  }, [selectedVetId]);

  // Загрузка всех исключений
  const loadExceptions = async () => {
    setLoadingExceptions(true);
    try {
      const res = await adminApi.getScheduleExceptions(0, 100);
      setExceptions(res?.items ?? []);
    } catch (err) {
      console.error(err);
      setExceptions([]);
    } finally {
      setLoadingExceptions(false);
    }
  };

  useEffect(() => {
    loadExceptions();
  }, []);

  const selectedVet = useMemo(() => {
    return vets.find((v) => v.id === selectedVetId);
  }, [vets, selectedVetId]);

  const selectedVetName = selectedVet?.user?.fullName || 'Врач';

  // Вычисление строк расписания на 7 дней
  const scheduleRows = useMemo(() => {
    return DOWS.map((shortName, i) => {
      const dowEnum = INDEX_TO_DOW[i];
      const ws = schedules.find((s) => s.dayOfWeek === dowEnum);

      if (!ws) {
        return {
          dayIndex: i,
          dowShort: shortName,
          dowFull: DOWS_FULL[i],
          hasSchedule: false,
          totalHours: '—',
          mins: 0,
          rowCls: 'off',
          ws: null,
          segments: [],
        };
      }

      const start = ws.startTime.slice(0, 5);
      const end = ws.endTime.slice(0, 5);
      const bs = ws.breakStart ? ws.breakStart.slice(0, 5) : '';
      const be = ws.breakEnd ? ws.breakEnd.slice(0, 5) : '';

      const durMins = tm(end) - tm(start) - (bs && be ? tm(be) - tm(bs) : 0);
      const isWeekend = i >= 5;

      const segments: { left: string; width: string; cls: string; label: string }[] = [];

      if (bs && be) {
        // До перерыва
        segments.push({
          left: pctX(start),
          width: pctW(start, bs),
          cls: `work ${tm(bs) - tm(start) < 90 ? 'narrow' : ''}`,
          label: `${start}–${bs}`,
        });
        // Перерыв
        segments.push({
          left: pctX(bs),
          width: pctW(bs, be),
          cls: `brk ${tm(be) - tm(bs) < 90 ? 'narrow' : ''}`,
          label: 'перерыв',
        });
        // После перерыва
        segments.push({
          left: pctX(be),
          width: pctW(be, end),
          cls: `work ${tm(end) - tm(be) < 90 ? 'narrow' : ''}`,
          label: `${be}–${end}`,
        });
      } else {
        segments.push({
          left: pctX(start),
          width: pctW(start, end),
          cls: `work ${tm(end) - tm(start) < 90 ? 'narrow' : ''}`,
          label: `${start}–${end}`,
        });
      }

      return {
        dayIndex: i,
        dowShort: shortName,
        dowFull: DOWS_FULL[i],
        hasSchedule: true,
        totalHours: fmtH(durMins),
        mins: durMins,
        rowCls: isWeekend ? 'we' : '',
        ws,
        segments,
      };
    });
  }, [schedules]);

  // Суммарные часы за неделю
  const totalWeekMins = useMemo(() => {
    return scheduleRows.reduce((acc, r) => acc + r.mins, 0);
  }, [scheduleRows]);

  // Фильтрованные исключения
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((e) => {
      if (exVetFilter && e.veterinarianId !== exVetFilter) return false;
      if (exTypeFilter && e.type !== exTypeFilter) return false;
      if (exFromFilter && e.endDate < exFromFilter) return false;
      if (exToFilter && e.startDate > exToFilter) return false;
      return true;
    });
  }, [exceptions, exVetFilter, exTypeFilter, exFromFilter, exToFilter]);

  // Дни для диаграммы Ганта исключений (35 дней от сегодня)
  const NDAYS = 35;
  const ganttDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: NDAYS }, (_, i) => {
      const d = new Date(today.getTime() + i * 86400000);
      const isMonday = d.getDay() === 1;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const dayNum = d.getDate();
      const monthNum = d.getMonth() + 1;
      const label = isMonday || i === 0 ? `${dayNum}.${monthNum < 10 ? '0' : ''}${monthNum}` : '';
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
          // Вычисление смещения в днях от сегодня
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

  // Обработчик сохранения рабочего дня
  const handleSaveWorkSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVetId) return;

    if (tm(wsModal.endTime) <= tm(wsModal.startTime)) {
      setWsModal((prev) => ({ ...prev, error: 'Время окончания должно быть позже начала' }));
      return;
    }

    if ((wsModal.breakStart && !wsModal.breakEnd) || (!wsModal.breakStart && wsModal.breakEnd)) {
      setWsModal((prev) => ({
        ...prev,
        error: 'Укажите обе границы перерыва или очистите обе',
      }));
      return;
    }

    if (
      wsModal.breakStart &&
      (tm(wsModal.breakStart) < tm(wsModal.startTime) ||
        tm(wsModal.breakEnd) > tm(wsModal.endTime) ||
        tm(wsModal.breakEnd) <= tm(wsModal.breakStart))
    ) {
      setWsModal((prev) => ({
        ...prev,
        error: 'Перерыв должен находиться внутри рабочего времени',
      }));
      return;
    }

    setSavingWs(true);
    setWsModal((prev) => ({ ...prev, error: null }));

    try {
      const startTime = `${wsModal.startTime}:00`;
      const endTime = `${wsModal.endTime}:00`;
      const breakStart = wsModal.breakStart ? `${wsModal.breakStart}:00` : null;
      const breakEnd = wsModal.breakEnd ? `${wsModal.breakEnd}:00` : null;

      if (wsModal.mode === 'edit' && wsModal.scheduleId) {
        const payload: UpdateWorkScheduleRequest = {
          startTime,
          endTime,
          breakStart,
          breakEnd,
        };
        await adminApi.updateWorkSchedule(wsModal.scheduleId, payload);
      } else {
        const payload: CreateWorkScheduleRequest = {
          veterinarianId: selectedVetId,
          dayOfWeek: INDEX_TO_DOW[wsModal.dayIndex],
          startTime,
          endTime,
          breakStart,
          breakEnd,
        };
        await adminApi.createWorkSchedule(payload);
      }

      setWsModal((prev) => ({ ...prev, open: false }));
      loadSchedule(selectedVetId);
    } catch (err: any) {
      setWsModal((prev) => ({
        ...prev,
        error: err?.message || 'Не удалось сохранить рабочий день',
      }));
    } finally {
      setSavingWs(false);
    }
  };

  // Удаление дня из графика
  const handleDeleteWorkSchedule = async (id: string, dowName: string) => {
    if (!window.confirm(`Удалить рабочий график на ${dowName}? День станет выходным.`)) return;

    try {
      await adminApi.deleteWorkSchedule(id);
      loadSchedule(selectedVetId);
    } catch (err: any) {
      alert(err?.message || 'Не удалось удалить график');
    }
  };

  // Обработчик сохранения исключения
  const handleSaveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exModal.vetId) {
      setExModal((prev) => ({ ...prev, error: 'Выберите врача' }));
      return;
    }
    if (!exModal.startDate || !exModal.endDate || exModal.endDate < exModal.startDate) {
      setExModal((prev) => ({ ...prev, error: 'Дата окончания не может быть раньше даты начала' }));
      return;
    }
    if (
      exModal.type === 'CUSTOM_HOURS' &&
      (!exModal.startTime || !exModal.endTime || tm(exModal.endTime) <= tm(exModal.startTime))
    ) {
      setExModal((prev) => ({
        ...prev,
        error: 'Для особых часов укажите корректное время начала и окончания',
      }));
      return;
    }

    setSavingEx(true);
    setExModal((prev) => ({ ...prev, error: null }));

    try {
      const payload: CreateScheduleExceptionRequest = {
        veterinarianId: exModal.vetId,
        type: exModal.type,
        startDate: exModal.startDate,
        endDate: exModal.endDate,
        startTime: exModal.type === 'CUSTOM_HOURS' ? `${exModal.startTime}:00` : null,
        endTime: exModal.type === 'CUSTOM_HOURS' ? `${exModal.endTime}:00` : null,
        reason: exModal.reason.trim() || null,
      };

      await adminApi.createScheduleException(payload);
      setExModal((prev) => ({ ...prev, open: false }));
      loadExceptions();
    } catch (err: any) {
      setExModal((prev) => ({
        ...prev,
        error: err?.message || 'Не удалось сохранить исключение',
      }));
    } finally {
      setSavingEx(false);
    }
  };

  // Удаление исключения
  const handleDeleteException = async (id: string) => {
    if (!window.confirm('Удалить это исключение из расписания?')) return;

    try {
      await adminApi.deleteScheduleException(id);
      loadExceptions();
    } catch (err: any) {
      alert(err?.message || 'Не удалось удалить исключение');
    }
  };

  return (
    <AppShell
      crumbGroup="Персонал"
      crumb={activeTab === 'sched' ? 'Расписания' : 'Исключения из расписания'}
      actions={
        activeTab === 'sched' ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              // Ищем первый день без графика
              const firstOff = scheduleRows.find((r) => !r.hasSchedule);
              const dayIdx = firstOff ? firstOff.dayIndex : 0;
              setWsModal({
                open: true,
                mode: 'create',
                dayIndex: dayIdx,
                startTime: '09:00',
                endTime: '18:00',
                breakStart: '13:00',
                breakEnd: '14:00',
                error: null,
              });
            }}
          >
            <Plus className="ic" />
            <span>Добавить рабочий день</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setExModal({
                open: true,
                mode: 'create',
                vetId: selectedVetId || (vets[0]?.id ?? ''),
                type: 'ABSENCE',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                startTime: '10:00',
                endTime: '16:00',
                reason: '',
                error: null,
              });
            }}
          >
            <Plus className="ic" />
            <span>Добавить исключение</span>
          </button>
        )
      }
    >
      <div className="content-col grow" style={{ gap: '10px' }}>
        {/* Переключатель вкладок «Недельный график» / «Исключения» */}
        <section className="island filters" style={{ padding: '8px 12px' }}>
          <div className="seg">
            <button
              type="button"
              className={`seg-item ${activeTab === 'sched' ? 'on' : ''}`}
              onClick={() => {
                setActiveTab('sched');
                router.replace('/admin/schedules');
              }}
            >
              <CalendarDays className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Недельные графики</span>
            </button>
            <button
              type="button"
              className={`seg-item ${activeTab === 'exc' ? 'on' : ''}`}
              onClick={() => {
                setActiveTab('exc');
                router.replace('/admin/schedules?tab=exc');
              }}
            >
              <CalendarOff className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Исключения из расписания</span>
            </button>
          </div>
        </section>

        {activeTab === 'sched' ? (
          /* ==============================================================
             ВКЛАДКА 1: НЕДЕЛЬНЫЙ ГРАФИК ВРАЧА (scr.schedules)
             ============================================================== */
          <>
            {/* Панель выбора врача */}
            <section className="island filters" aria-label="Врач">
              <div className="field" style={{ width: '320px' }}>
                <span className="field-label">Врач</span>
                <select
                  className="select"
                  value={selectedVetId}
                  onChange={(e) => setSelectedVetId(e.target.value)}
                  disabled={loadingVets}
                >
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.user?.fullName || `Врач (${v.id.substring(0, 6)})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="spacer" />

              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => selectedVetId && loadSchedule(selectedVetId)}
                title="Обновить график"
              >
                <RefreshCw className={`ic ${loadingSchedule ? 'animate-spin' : ''}`} />
              </button>
            </section>

            {/* Основной остров с визуальным расписанием .sch */}
            <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="island-head">
                <span className="island-title">
                  <CalendarDays className="ic" />
                  <span>Недельный график · {selectedVetName}</span>
                </span>
                <span className="small muted">
                  Дни без записи — выходные · исключения важнее графика
                </span>
              </div>

              <div className="island-body" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
                {loadingSchedule ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="skeleton"
                        style={{ height: '56px', borderRadius: '8px' }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="sch" style={{ minWidth: '680px' }}>
                    {/* Шкала времени от 08:00 до 20:00 (13 делений) */}
                    <div className="sch-row sch-head">
                      <span className="sch-day" />
                      <div className="sch-scale">
                        <span className="first" style={{ left: '0%' }}>
                          08:00
                        </span>
                        <span style={{ left: '8.333%' }}>09:00</span>
                        <span style={{ left: '16.666%' }}>10:00</span>
                        <span style={{ left: '25%' }}>11:00</span>
                        <span style={{ left: '33.333%' }}>12:00</span>
                        <span style={{ left: '41.666%' }}>13:00</span>
                        <span style={{ left: '50%' }}>14:00</span>
                        <span style={{ left: '58.333%' }}>15:00</span>
                        <span style={{ left: '66.666%' }}>16:00</span>
                        <span style={{ left: '75%' }}>17:00</span>
                        <span style={{ left: '83.333%' }}>18:00</span>
                        <span style={{ left: '91.666%' }}>19:00</span>
                        <span className="last" style={{ left: '100%' }}>
                          20:00
                        </span>
                      </div>
                      <span className="sch-act" />
                    </div>

                    {/* 7 строк по дням недели */}
                    {scheduleRows.map((r) => (
                      <div key={r.dayIndex} className={`sch-row ${r.rowCls}`}>
                        <div className="sch-day">
                          <span className="cell-main sch-dl">{r.dowFull}</span>
                          <span className="cell-main sch-ds">{r.dowShort}</span>
                          <span className="sch-total">{r.totalHours}</span>
                        </div>

                        <div className="sch-track">
                          {r.hasSchedule ? (
                            r.segments.map((seg, sIdx) => (
                              <div
                                key={sIdx}
                                className={`sch-seg ${seg.cls}`}
                                style={{ left: seg.left, width: seg.width }}
                                title={seg.label}
                              >
                                <span className="sch-seg-t">{seg.label}</span>
                              </div>
                            ))
                          ) : (
                            <span className="sch-off">Выходной</span>
                          )}
                        </div>

                        <div className="sch-act">
                          {r.hasSchedule && r.ws ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-icon"
                                aria-label={`Изменить ${r.dowFull}`}
                                title={`Изменить ${r.dowFull}`}
                                onClick={() => {
                                  const start = r.ws!.startTime.slice(0, 5);
                                  const end = r.ws!.endTime.slice(0, 5);
                                  const bs = r.ws!.breakStart ? r.ws!.breakStart.slice(0, 5) : '';
                                  const be = r.ws!.breakEnd ? r.ws!.breakEnd.slice(0, 5) : '';
                                  setWsModal({
                                    open: true,
                                    mode: 'edit',
                                    dayIndex: r.dayIndex,
                                    scheduleId: r.ws!.id,
                                    startTime: start,
                                    endTime: end,
                                    breakStart: bs,
                                    breakEnd: be,
                                    error: null,
                                  });
                                }}
                              >
                                <Pencil className="ic" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-icon text-[var(--accent-red)]"
                                aria-label={`Удалить ${r.dowFull}`}
                                title={`Сделать выходным (${r.dowFull})`}
                                onClick={() => handleDeleteWorkSchedule(r.ws!.id, r.dowFull)}
                              >
                                <Trash2 className="ic" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                setWsModal({
                                  open: true,
                                  mode: 'create',
                                  dayIndex: r.dayIndex,
                                  startTime: '09:00',
                                  endTime: '18:00',
                                  breakStart: '13:00',
                                  breakEnd: '14:00',
                                  error: null,
                                });
                              }}
                            >
                              <Plus className="ic" />
                              <span>Рабочий день</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Подвал с легендой и итоговыми часами */}
                    <div className="sch-foot">
                      <span className="legend">
                        <span>
                          <i style={{ background: 'var(--primary)' }} />
                          Приём
                        </span>
                        <span>
                          <i className="sch-lg-brk" />
                          Перерыв
                        </span>
                      </span>
                      <span className="small">
                        Итого за неделю: <b>{fmtH(totalWeekMins)}</b>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          /* ==============================================================
             ВКЛАДКА 2: ИСКЛЮЧЕНИЯ ИЗ РАСПИСАНИЯ (scr.exceptions)
             ============================================================== */
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

              {(exVetFilter || exTypeFilter || exFromFilter || exToFilter) && (
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
                            onClick={() => {
                              const e = bar.exception;
                              setExModal({
                                open: true,
                                mode: 'edit',
                                id: e.id,
                                vetId: e.veterinarianId,
                                type: e.type,
                                startDate: e.startDate,
                                endDate: e.endDate,
                                startTime: e.startTime ? e.startTime.slice(0, 5) : '10:00',
                                endTime: e.endTime ? e.endTime.slice(0, 5) : '16:00',
                                reason: e.reason || '',
                                error: null,
                              });
                            }}
                          />
                        ))}
                        {/* Маркер сегодня */}
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
                  onClick={loadExceptions}
                  title="Обновить"
                >
                  <RefreshCw className={`ic ${loadingExceptions ? 'animate-spin' : ''}`} />
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
                    filteredExceptions.map((ex) => {
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
                              className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                              aria-label="Удалить"
                              title="Удалить исключение"
                              onClick={() => handleDeleteException(ex.id)}
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
            </section>
          </>
        )}
      </div>

      {/* ==============================================================
          МОДАЛЬНОЕ ОКНО: РЕДАКТИРОВАНИЕ ДНЯ РАСПИСАНИЯ
          ============================================================== */}
      {wsModal.open && (
        <div className="overlay">
          <div className="dialog dialog-sm" role="dialog" aria-modal="true">
            <div className="dialog-head">
              <div className="row between" style={{ alignItems: 'center' }}>
                <span className="dialog-title">
                  {wsModal.mode === 'edit'
                    ? `Изменить: ${DOWS_FULL[wsModal.dayIndex]}`
                    : `Новый рабочий день: ${DOWS_FULL[wsModal.dayIndex]}`}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setWsModal((prev) => ({ ...prev, open: false }))}
                >
                  <X className="ic" />
                </button>
              </div>
              <span className="dialog-desc">
                {selectedVetName} · {wsModal.mode === 'edit' ? 'Изменение графика' : 'Добавление дня в график'}
              </span>
            </div>

            <form onSubmit={handleSaveWorkSchedule} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="dialog-body">
                {wsModal.error && (
                  <div className="alert alert-err" style={{ marginBottom: '12px' }}>
                    <AlertCircle className="ic" />
                    <span>{wsModal.error}</span>
                  </div>
                )}

                <div className="form-grid">
                  <div className="field">
                    <label className="field-label">
                      Начало <span className="req">*</span>
                    </label>
                    <input
                      type="time"
                      step={900}
                      className="input"
                      value={wsModal.startTime}
                      onChange={(e) => setWsModal((prev) => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">
                      Конец <span className="req">*</span>
                    </label>
                    <input
                      type="time"
                      step={900}
                      className="input"
                      value={wsModal.endTime}
                      onChange={(e) => setWsModal((prev) => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Перерыв с</label>
                    <input
                      type="time"
                      step={900}
                      className="input"
                      value={wsModal.breakStart}
                      onChange={(e) => setWsModal((prev) => ({ ...prev, breakStart: e.target.value }))}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Перерыв до</label>
                    <input
                      type="time"
                      step={900}
                      className="input"
                      value={wsModal.breakEnd}
                      onChange={(e) => setWsModal((prev) => ({ ...prev, breakEnd: e.target.value }))}
                    />
                  </div>
                </div>

                <span className="field-hint" style={{ marginTop: '8px', display: 'block' }}>
                  Шаг интервалов — 15 минут. День недели привязан к позиции в неделе.
                </span>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setWsModal((prev) => ({ ...prev, open: false }))}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingWs}>
                  {savingWs ? 'Сохранение...' : wsModal.mode === 'edit' ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          МОДАЛЬНОЕ ОКНО: ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ ИСКЛЮЧЕНИЯ
          ============================================================== */}
      {exModal.open && (
        <div className="overlay">
          <div className="dialog dialog-sm" role="dialog" aria-modal="true">
            <div className="dialog-head">
              <div className="row between" style={{ alignItems: 'center' }}>
                <span className="dialog-title">
                  {exModal.mode === 'edit' ? 'Изменить исключение' : 'Новое исключение'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setExModal((prev) => ({ ...prev, open: false }))}
                >
                  <X className="ic" />
                </button>
              </div>
              <span className="dialog-desc">Отпуск, болезнь, командировка или индивидуальные часы работы</span>
            </div>

            <form onSubmit={handleSaveException} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="dialog-body">
                {exModal.error && (
                  <div className="alert alert-err" style={{ marginBottom: '12px' }}>
                    <AlertCircle className="ic" />
                    <span>{exModal.error}</span>
                  </div>
                )}

                <div className="col" style={{ gap: '12px' }}>
                  <div className="field">
                    <span className="field-label">Врач</span>
                    <select
                      className="select"
                      value={exModal.vetId}
                      onChange={(e) => setExModal((prev) => ({ ...prev, vetId: e.target.value }))}
                      required
                    >
                      {vets.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.user?.fullName || `Врач (${v.id.substring(0, 6)})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <span className="field-label">Тип исключения</span>
                    <div className="seg">
                      <button
                        type="button"
                        className={`seg-item ${exModal.type === 'ABSENCE' ? 'on' : ''}`}
                        onClick={() => setExModal((prev) => ({ ...prev, type: 'ABSENCE' }))}
                      >
                        Отсутствие
                      </button>
                      <button
                        type="button"
                        className={`seg-item ${exModal.type === 'CUSTOM_HOURS' ? 'on' : ''}`}
                        onClick={() => setExModal((prev) => ({ ...prev, type: 'CUSTOM_HOURS' }))}
                      >
                        Особые часы
                      </button>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label">
                        С даты <span className="req">*</span>
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={exModal.startDate}
                        onChange={(e) => setExModal((prev) => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">
                        По дату <span className="req">*</span>
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={exModal.endDate}
                        onChange={(e) => setExModal((prev) => ({ ...prev, endDate: e.target.value }))}
                        required
                      />
                    </div>

                    {exModal.type === 'CUSTOM_HOURS' && (
                      <>
                        <div className="field">
                          <label className="field-label">
                            Время с <span className="req">*</span>
                          </label>
                          <input
                            type="time"
                            step={900}
                            className="input"
                            value={exModal.startTime}
                            onChange={(e) => setExModal((prev) => ({ ...prev, startTime: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="field">
                          <label className="field-label">
                            Время по <span className="req">*</span>
                          </label>
                          <input
                            type="time"
                            step={900}
                            className="input"
                            value={exModal.endTime}
                            onChange={(e) => setExModal((prev) => ({ ...prev, endTime: e.target.value }))}
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="field">
                    <label className="field-label">Причина</label>
                    <textarea
                      className="textarea"
                      placeholder="Например: Ежегодный отпуск, Обучение, Дежурство"
                      value={exModal.reason}
                      onChange={(e) => setExModal((prev) => ({ ...prev, reason: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setExModal((prev) => ({ ...prev, open: false }))}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEx}>
                  {savingEx ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function AdminSchedulesPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '200px', margin: '24px' }} />}>
      <AdminSchedulesContent />
    </Suspense>
  );
}
