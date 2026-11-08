'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { clinicApi, vetApi } from '../../../api';
import {
  WorkSchedule,
  ScheduleException,
  Appointment,
  Veterinarian,
  DayOfWeek,
  Service,
  Pet,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  CalendarDays,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  X,
  Repeat,
  Info,
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
const H1 = 19;
const PPM = 1.4; // Пикселей на минуту
const CAL_HOUR_PX = `${60 * PPM}px`;
const CAL_HEIGHT = `${(H1 - H0) * 60 * PPM}px`;

function tm(t: string): number {
  if (!t) return 0;
  const parts = t.split(':');
  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
}

function px(n: number): string {
  return `${Math.round(n)}px`;
}

function formatIsoDisplay(iso?: string | null): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

function VetScheduleContent() {
  const { user } = useAuth();

  const [vetId, setVetId] = useState<string>('');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, string>>({});
  const [pets, setPets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Смещение недели относительно текущей (0 = текущая неделя, -1 = прошлая, +1 = следующая)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Выбранная запись для просмотра деталей
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Вычисление понедельника текущей отображаемой недели
  const mondayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // getDay(): 0 = Вс, 1 = Пн ... 6 = Сб
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
    return d;
  }, [weekOffset]);

  // Дни недели для сетки
  const weekDays = useMemo(() => {
    const todayIso = new Date().toISOString().split('T')[0];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mondayDate);
      d.setDate(d.getDate() + i);

      const iso = d.toISOString().split('T')[0];
      const isToday = iso === todayIso;
      const isWeekend = i >= 5;
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('ru-RU', { month: 'short' });

      return {
        i,
        date: d,
        iso,
        dow: DOWS[i],
        short: `${dayNum} ${monthShort}`,
        isToday,
        isWeekend,
      };
    });
  }, [mondayDate]);

  // Заголовок диапазона недели
  const weekRangeTitle = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.short} – ${last.short} ${last.date.getFullYear()}`;
  }, [weekDays]);

  // Часовые метки для левой шкалы времени (08:00 - 18:00)
  const calHours = useMemo(() => {
    const list = [];
    for (let h = H0; h < H1; h++) {
      list.push({
        label: `${String(h).padStart(2, '0')}:00`,
        top: px((h - H0) * 60 * PPM),
      });
    }
    return list;
  }, []);

  // Первоначальная загрузка
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [vetsRes, svcRes, apptsRes, patientsRes] = await Promise.all([
          clinicApi.getVeterinarians(),
          clinicApi.getServices(),
          vetApi.getAppointments(0, 100),
          vetApi.getPatients().catch(() => []),
        ]);

        const svcMap: Record<string, string> = {};
        if (Array.isArray(svcRes)) {
          svcRes.forEach((s) => {
            svcMap[s.id] = s.name;
          });
        }
        setServices(svcMap);

        const petMap: Record<string, string> = {};
        if (Array.isArray(patientsRes)) {
          patientsRes.forEach((p) => {
            petMap[p.id] = p.name;
          });
        }
        setPets(petMap);

        const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
        setAppointments(items);

        // Поиск ID врача текущего пользователя
        const vetList = Array.isArray(vetsRes) ? vetsRes : [];
        const myVet = vetList.find((v) => v.userId === user?.id) || vetList[0];

        if (myVet) {
          setVetId(myVet.id);
          const [schedRes, excRes] = await Promise.all([
            clinicApi.getWorkSchedules(myVet.id).catch(() => []),
            clinicApi.getScheduleExceptions(myVet.id).catch(() => []),
          ]);
          setSchedules(Array.isArray(schedRes) ? schedRes : []);
          setExceptions(Array.isArray(excRes) ? excRes : []);
        }
      } catch (err) {
        console.error('Failed to load vet schedule data', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  // Недельный шаблон графика врача на 7 дней
  const myWeek = useMemo(() => {
    return DOWS.map((dw, i) => {
      const dowEnum = INDEX_TO_DOW[i];
      const w = schedules.find((x) => x.dayOfWeek === dowEnum);
      return {
        dow: dw,
        hours: w ? `${w.startTime.slice(0, 5)}–${w.endTime.slice(0, 5)}` : 'Выходной',
        brk: w && w.breakStart && w.breakEnd ? `перерыв ${w.breakStart.slice(0, 5)}–${w.breakEnd.slice(0, 5)}` : '',
      };
    });
  }, [schedules]);

  // Список исключений текущего врача
  const myExceptions = useMemo(() => {
    return exceptions.map((e) => {
      const isAbsence = e.type === 'ABSENCE';
      const range =
        e.startDate === e.endDate
          ? formatIsoDisplay(e.startDate)
          : `${formatIsoDisplay(e.startDate)} – ${formatIsoDisplay(e.endDate)}`;
      const reason =
        e.type === 'CUSTOM_HOURS' && e.startTime && e.endTime
          ? `${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)} · ${e.reason || ''}`
          : e.reason || '—';

      return {
        id: e.id,
        range,
        reason,
        label: isAbsence ? 'Отсутствие' : 'Особые часы',
        cls: isAbsence ? 'due-over' : 'badge-accent',
      };
    });
  }, [exceptions]);

  // Блоки для столбца дня (рабочее время, перерыв, отсутствие, записи)
  const getBlocksForDay = (dayDate: Date, dayIso: string, dayIndex: number) => {
    const blocks: React.ReactNode[] = [];

    // 1. Проверяем исключения на этот день
    const exc = exceptions.find((e) => e.startDate <= dayIso && e.endDate >= dayIso);

    if (exc && exc.type === 'ABSENCE') {
      // Весь день отсутствие
      blocks.push(
        <div
          key={`exc-${exc.id}`}
          className="wk-block wk-off"
          style={{
            top: 0,
            height: CAL_HEIGHT,
            backgroundColor: 'color-mix(in srgb, var(--destructive) 25%, transparent)',
            borderRadius: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--destructive)',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          <span>Отсутствие · {exc.reason || 'Отпуск/Больничный'}</span>
        </div>
      );
      return blocks;
    }

    // 2. Рабочие часы по графику или особым часам
    const dowEnum = INDEX_TO_DOW[dayIndex];
    const sched = schedules.find((s) => s.dayOfWeek === dowEnum);

    let start = '';
    let end = '';
    let bs = '';
    let be = '';

    if (exc && exc.type === 'CUSTOM_HOURS' && exc.startTime && exc.endTime) {
      start = exc.startTime.slice(0, 5);
      end = exc.endTime.slice(0, 5);
    } else if (sched) {
      start = sched.startTime.slice(0, 5);
      end = sched.endTime.slice(0, 5);
      bs = sched.breakStart ? sched.breakStart.slice(0, 5) : '';
      be = sched.breakEnd ? sched.breakEnd.slice(0, 5) : '';
    }

    if (start && end) {
      const topMin = Math.max(0, tm(start) - H0 * 60);
      const heightMin = Math.max(0, tm(end) - tm(start));

      // Подложка рабочего времени
      blocks.push(
        <div
          key="work-bg"
          className="wk-block wk-work"
          style={{
            top: px(topMin * PPM),
            height: px(heightMin * PPM),
          }}
        />
      );

      // Перерыв
      if (bs && be) {
        const brkTopMin = Math.max(0, tm(bs) - H0 * 60);
        const brkHeightMin = Math.max(0, tm(be) - tm(bs));
        blocks.push(
          <div
            key="brk"
            className="wk-block wk-break"
            style={{
              top: px(brkTopMin * PPM),
              height: px(brkHeightMin * PPM),
            }}
          >
            <span>Перерыв</span>
          </div>
        );
      }
    }

    // 3. Записи на этот день
    const dayAppts = appointments.filter((a) => {
      const apptDateIso = new Date(a.startAt).toISOString().split('T')[0];
      return apptDateIso === dayIso && a.status !== 'CANCELLED';
    });

    dayAppts.forEach((a) => {
      const sDate = new Date(a.startAt);
      const eDate = new Date(a.endAt);
      const sTime = `${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`;
      const eTime = `${String(eDate.getHours()).padStart(2, '0')}:${String(eDate.getMinutes()).padStart(2, '0')}`;

      const topMin = Math.max(0, tm(sTime) - H0 * 60);
      const durMin = Math.max(20, tm(eTime) - tm(sTime));
      const petName = pets[a.petId] || 'Пациент';
      const svcName = services[a.serviceId] || 'Приём';

      const isSel = selectedAppt?.id === a.id;

      blocks.push(
        <button
          key={`appt-${a.id}`}
          type="button"
          className={`wk-block wk-appt ${a.status} ${isSel ? 'sel' : ''} ${durMin < 40 ? 'sm' : ''}`}
          style={{
            top: px(topMin * PPM),
            height: px(durMin * PPM - 3),
            textAlign: 'left',
            cursor: 'pointer',
            zIndex: 10,
          }}
          onClick={() => setSelectedAppt(a)}
          title={`${sTime}–${eTime} · ${petName} (${svcName}) — ${STATUS_SHORT[a.status] || a.status}`}
        >
          <span className="wk-time">
            {sTime}
            <span className="wk-end">–{eTime}</span>
          </span>
          <span className="wk-pet">{petName}</span>
          <span className="wk-svc">{svcName}</span>
        </button>
      );
    });

    return blocks;
  };

  return (
    <AppShell crumbGroup="Врач" crumb="Мой график">
      <div className="content-row">
        {/* Левая колонка: Календарная недельная сетка */}
        <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="island-head">
            <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-icon"
                aria-label="Предыдущая неделя"
                onClick={() => setWeekOffset((prev) => prev - 1)}
              >
                <ChevronLeft className="ic" />
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setWeekOffset(0)}
              >
                Эта неделя
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-icon"
                aria-label="Следующая неделя"
                onClick={() => setWeekOffset((prev) => prev + 1)}
              >
                <ChevronRight className="ic" />
              </button>

              <span className="island-title" style={{ marginLeft: '6px' }}>
                {weekRangeTitle}
              </span>
            </div>

            <span className="small muted">
              Только просмотр · график меняет администратор
            </span>
          </div>

          <div className="island-body" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
                <div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} />
              </div>
            ) : (
              <div
                className="week"
                style={{
                  gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))',
                  minWidth: '640px',
                }}
              >
                {/* Левый верхний пустой угол */}
                <div className="week-h" style={{ background: 'var(--muted)' }} />

                {/* Шапка 7 дней */}
                {weekDays.map((d) => (
                  <div
                    key={d.i}
                    className={`week-h ${d.isToday ? 'today' : ''} ${d.isWeekend ? 'we' : ''}`}
                  >
                    <span className="wh-dow">{d.dow}</span>
                    <span className="wh-date">{d.short}</span>
                  </div>
                ))}

                {/* Левая шкала времени */}
                <div className="week-t" style={{ height: CAL_HEIGHT }}>
                  {calHours.map((h, idx) => (
                    <span key={idx} className="wt-label" style={{ top: h.top }}>
                      {h.label}
                    </span>
                  ))}
                </div>

                {/* 7 столбцов дней */}
                {weekDays.map((d) => (
                  <div
                    key={d.i}
                    className={`week-c ${d.isWeekend ? 'we' : ''} ${d.isToday ? 'today' : ''}`}
                    style={{
                      height: CAL_HEIGHT,
                      // @ts-ignore
                      '--hp': CAL_HOUR_PX,
                    }}
                  >
                    {getBlocksForDay(d.date, d.iso, d.i)}
                  </div>
                ))}
              </div>
            )}

            {/* Легенда */}
            <div className="legend" style={{ marginTop: '12px' }}>
              <span>
                <i style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)' }} />
                Рабочие часы
              </span>
              <span>
                <i style={{ background: 'var(--muted)' }} />
                Перерыв
              </span>
              <span>
                <i style={{ background: 'color-mix(in srgb, var(--destructive) 25%, transparent)' }} />
                Отсутствие
              </span>
              <span>
                <i style={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                Запись
              </span>
            </div>
          </div>
        </section>

        {/* Правая колонка (340px): Исключения и Недельный шаблон */}
        <section
          className="island"
          style={{ width: '340px', flex: 'none', display: 'flex', flexDirection: 'column' }}
        >
          <div className="island-head">
            <span className="island-title">
              <CalendarOff className="ic" />
              <span>Исключения</span>
            </span>
          </div>

          <div className="island-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="col" style={{ gap: 0 }}>
              {myExceptions.length === 0 ? (
                <div className="small muted" style={{ padding: '8px 0' }}>
                  Исключений на ближайшее время нет
                </div>
              ) : (
                myExceptions.map((e) => (
                  <div
                    key={e.id}
                    className="row between"
                    style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="col" style={{ gap: 0 }}>
                      <span className="cell-main tnum">{e.range}</span>
                      <span className="cell-sub">{e.reason}</span>
                    </div>
                    <span className={`badge ${e.cls}`}>{e.label}</span>
                  </div>
                ))
              )}
            </div>

            {/* Недельный шаблон графика */}
            <div className="col" style={{ gap: '8px', marginTop: '12px' }}>
              <span className="section-title">Недельный шаблон</span>
              <div
                className="dtable"
                style={{
                  // @ts-ignore
                  '--cols': '44px 1fr 1fr',
                }}
              >
                {myWeek.map((w, idx) => (
                  <div key={idx} className="trow static compact">
                    <span className="cell-main">{w.dow}</span>
                    <span className="tnum">{w.hours}</span>
                    <span className="small muted">{w.brk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Боковой остров деталей приёма при клике на блок */}
        {selectedAppt && (
          <section className="island detail-island" style={{ width: '420px' }} aria-label="Детали приёма">
            <div className="island-head">
              <div className="col" style={{ gap: '2px' }}>
                <span className="h2">
                  {pets[selectedAppt.petId] || 'Пациент'} — {services[selectedAppt.serviceId] || 'Приём'}
                </span>
                <span className="cell-sub tnum">
                  {new Date(selectedAppt.startAt).toLocaleDateString('ru-RU')} в{' '}
                  {new Date(selectedAppt.startAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => setSelectedAppt(null)}
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
                  <dd>{pets[selectedAppt.petId] || 'Пациент'}</dd>
                  <dt>Услуга</dt>
                  <dd>{services[selectedAppt.serviceId] || 'Услуга'}</dd>
                  <dt>Время</dt>
                  <dd className="tnum">
                    {new Date(selectedAppt.startAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    –
                    {new Date(selectedAppt.endAt).toLocaleTimeString('ru-RU', {
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
        )}
      </div>
    </AppShell>
  );
}

export default function VetSchedulePage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '200px', margin: '24px' }} />}>
      <VetScheduleContent />
    </Suspense>
  );
}
