'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { vetApi, clinicApi } from '../../../api';
import { Appointment, AppointmentStatus, Service, Pet } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { SpeciesIcon } from '../../../components/ui/SpeciesIcon';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Repeat,
  XCircle,
  Stethoscope,
  X,
  AlertCircle,
  Check,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { ConsultationPrintSheet } from '../../../components/print/ConsultationPrintSheet';

const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

export default function VetDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Выбранная запись для детального просмотра
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Диалог повторного приёма
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpServiceId, setFollowUpServiceId] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [apptsRes, svcRes] = await Promise.all([
        vetApi.getAppointments(0, 100),
        clinicApi.getServices(),
      ]);

      const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
      items.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      setAppointments(items);
      setServices(Array.isArray(svcRes) ? svcRes : []);

      if (items.length > 0 && !selectedAppt && typeof window !== 'undefined' && window.innerWidth >= 1280) {
        setSelectedAppt(items[0]);
        setNotesText(items[0].vetNotes || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (selectedAppt) {
      setNotesText(selectedAppt.vetNotes || '');
    }
  }, [selectedAppt?.id]);

  const servicesMap = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [services]);

  // Записи на сегодня
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = useMemo(() => {
    return appointments.filter((a) => a.startAt.startsWith(todayStr));
  }, [appointments, todayStr]);

  const pendingAppts = useMemo(() => {
    return appointments.filter((a) => a.status === 'PENDING');
  }, [appointments]);

  const nextAppt = useMemo(() => {
    return appointments.find((a) => a.status === 'CONFIRMED' || a.status === 'PENDING') || null;
  }, [appointments]);

  const handleUpdateStatus = async (apptId: string, status: AppointmentStatus) => {
    try {
      await vetApi.updateAppointment(apptId, { status });
      await loadAll();
      if (selectedAppt?.id === apptId) {
        setSelectedAppt((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      alert(err?.message || 'Ошибка обновления статуса');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppt) return;
    setSavingNotes(true);
    try {
      await vetApi.updateAppointment(selectedAppt.id, {
        vetNotes: notesText.trim() || undefined,
      });
      await loadAll();
    } catch (err: any) {
      alert(err?.message || 'Не удалось сохранить заметки');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setSubmittingFollowUp(true);
    setFollowUpError(null);

    try {
      const [hours, minutes] = followUpTime.split(':').map(Number);
      const start = new Date(`${followUpDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
      const targetSvc = services.find((s) => s.id === followUpServiceId) || services[0];
      const dur = targetSvc?.baseDurationMin || 30;
      const end = new Date(start.getTime() + dur * 60000);

      await vetApi.createFollowUp(selectedAppt.id, {
        serviceId: targetSvc?.id || selectedAppt.serviceId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      setIsFollowUpOpen(false);
      await loadAll();
    } catch (err: any) {
      setFollowUpError(err?.message || 'Не удалось назначить повторный приём');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const formatSlotTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
  };

  return (
    <AppShell title="Кабинет ветеринара" currentSection="Сегодня">
      <div className="content-row">
        {/* Левая колонка: Таймлайн дня */}
        <section className="island grow" aria-label="Таймлайн дня">
          <div className="island-head">
            <span className="island-title">
              <Clock className="ic" />
              {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div className="chips">
              <span className="day-stat">
                <i style={{ background: 'var(--st-confirmed-fg)' }} />
                <b>{todayAppts.length}</b> на сегодня
              </span>
              <span className="day-stat">
                <i style={{ background: 'var(--st-completed-fg)' }} />
                <b>{todayAppts.filter((a) => a.status === 'COMPLETED').length}</b> завершено
              </span>
              <span className="day-stat">
                <i style={{ background: 'var(--st-pending-fg)' }} />
                <b>{todayAppts.filter((a) => a.status === 'PENDING').length}</b> ожидает
              </span>
            </div>
          </div>

          <div className="island-body">
            <div className="timeline">
              {appointments.length === 0 ? (
                <div className="empty" style={{ padding: '40px' }}>
                  <span className="empty-title">На сегодня приёмов нет</span>
                  <span>Здесь появится список пациентов по расписанию</span>
                </div>
              ) : (
                appointments.map((a) => {
                  const isSel = selectedAppt?.id === a.id;
                  const isNext = nextAppt?.id === a.id;
                  const timeStart = formatSlotTime(a.startAt);
                  const timeEnd = formatSlotTime(a.endAt);

                  return (
                    <div key={a.id} className="tl-row">
                      <span className="tl-time">
                        {timeStart}
                        <span className="tl-time-end">{timeEnd}</span>
                      </span>

                      <button
                        type="button"
                        className={`tl-card tl-appt ${isSel ? 'sel' : ''}`}
                        onClick={() => setSelectedAppt(a)}
                        style={{ textAlign: 'left', cursor: 'pointer', flex: 1 }}
                      >
                        <span className="pet-ava">
                          <SpeciesIcon species="cat" size={20} />
                        </span>
                        <span className="col grow" style={{ gap: '1px' }}>
                          <span className="row" style={{ gap: '8px' }}>
                            <span className="cell-main">Пациент</span>
                            {isNext && (
                              <span className="badge badge-accent" style={{ height: '20px' }}>
                                Следующий
                              </span>
                            )}
                            {a.followUpOf && (
                              <span className="badge badge-outline" style={{ height: '20px' }}>
                                Повторный
                              </span>
                            )}
                          </span>
                          <span className="cell-sub">{servicesMap[a.serviceId] || 'Приём'}</span>
                        </span>
                        <span className={`badge st badge-${a.status}`}>
                          {STATUS_SHORT[a.status] || a.status}
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Правая колонка: Ближайший приём + Детали выбранного приёма */}
        <div className="content-col" style={{ width: '420px', flex: 'none' }}>
          {/* Остров детального протокола приёма */}
          {selectedAppt && (
            <section className="island detail-island" style={{ width: '100%' }}>
              <div className="island-head">
                <div className="col" style={{ gap: '2px', minWidth: 0 }}>
                  <span className="h2" style={{ wordBreak: 'break-word' }}>
                    {servicesMap[selectedAppt.serviceId] || 'Приём'}
                  </span>
                  <span className="cell-sub">
                    {new Date(selectedAppt.startAt).toLocaleDateString('ru-RU')} в{' '}
                    {formatSlotTime(selectedAppt.startAt)}–{formatSlotTime(selectedAppt.endAt)}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
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

                  {selectedAppt.clientComment && (
                    <div className="col" style={{ gap: '4px' }}>
                      <span className="section-title">Жалобы владельца</span>
                      <div className="note">{selectedAppt.clientComment}</div>
                    </div>
                  )}

                  {/* Поле протокола осмотра врача */}
                  <div className="col" style={{ gap: '6px' }}>
                    <span className="section-title">Клинический протокол и назначения</span>
                    <textarea
                      className="textarea"
                      rows={5}
                      maxLength={4000}
                      placeholder="Опишите результаты осмотра, диагноз, назначенные препараты и дозировки..."
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                    />
                    <div className="row between">
                      <span className="small muted">{notesText.length} / 4000</span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={savingNotes}
                        onClick={handleSaveNotes}
                      >
                        {savingNotes ? 'Сохранение...' : 'Сохранить заметки'}
                      </button>
                    </div>
                  </div>

                  {/* Кнопки управления статусом */}
                  <div className="row wrap" style={{ gap: '6px', paddingTop: '8px' }}>
                    {selectedAppt.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleUpdateStatus(selectedAppt.id, 'COMPLETED')}
                      >
                        <Check className="ic" />
                        <span>Завершить приём</span>
                      </button>
                    )}

                    {selectedAppt.status === 'PENDING' && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleUpdateStatus(selectedAppt.id, 'CONFIRMED')}
                      >
                        Подтвердить
                      </button>
                    )}

                    {selectedAppt.status !== 'NO_SHOW' && selectedAppt.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        className="btn btn-destructive-outline btn-sm"
                        onClick={() => handleUpdateStatus(selectedAppt.id, 'NO_SHOW')}
                      >
                        Неявка
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFollowUpServiceId(selectedAppt.serviceId);
                        setIsFollowUpOpen(true);
                      }}
                    >
                      <Repeat className="ic" />
                      <span>Повторный приём</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => window.print()}
                      title="Распечатать медицинский протокол приёма"
                    >
                      <Printer className="ic" />
                      <span>Печать листа</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Остров «Ожидают подтверждения» */}
          {pendingAppts.length > 0 && (
            <section className="island" style={{ width: '100%' }}>
              <div className="island-head">
                <span className="island-title">
                  <CheckCircle2 className="ic" />
                  Ожидают подтверждения <span className="count">{pendingAppts.length}</span>
                </span>
              </div>
              <div className="island-body" style={{ padding: '0 8px 8px' }}>
                {pendingAppts.map((p) => (
                  <div
                    key={p.id}
                    className="lrow"
                    style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="datebox">
                      <b>{new Date(p.startAt).getDate()}</b>
                      <span>
                        {new Date(p.startAt).toLocaleDateString('ru-RU', { month: 'short' })}
                      </span>
                    </span>
                    <span className="col grow" style={{ gap: 0, minWidth: 0 }}>
                      <span className="cell-main tnum">{formatSlotTime(p.startAt)}</span>
                      <span className="cell-sub">{servicesMap[p.serviceId] || 'Приём'}</span>
                    </span>
                    <div className="row" style={{ gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdateStatus(p.id, 'CONFIRMED')}
                      >
                        Подтвердить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Диалог назначения повторного приёма */}
      {isFollowUpOpen && selectedAppt && (
        <div className="dialog-backdrop">
          <div className="dialog" style={{ width: '440px', maxWidth: 'calc(100vw - 32px)' }}>
            <div className="dialog-head">
              <span className="dialog-title">Назначить повторный приём</span>
              <span className="dialog-desc">
                Создание связанного визита для контроля результатов лечения
              </span>
            </div>

            <form onSubmit={handleScheduleFollowUp}>
              <div className="dialog-body">
                {followUpError && (
                  <div className="alert alert-destructive">
                    <AlertCircle className="ic" />
                    <div>{followUpError}</div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="field span-2">
                    <label className="field-label" htmlFor="fu-svc">
                      Услуга
                    </label>
                    <select
                      id="fu-svc"
                      className="select"
                      value={followUpServiceId}
                      onChange={(e) => setFollowUpServiceId(e.target.value)}
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.baseDurationMin} мин)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="fu-date">
                      Дата приёма
                    </label>
                    <input
                      id="fu-date"
                      type="date"
                      className="input"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="fu-time">
                      Время
                    </label>
                    <input
                      id="fu-time"
                      type="time"
                      className="input"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsFollowUpOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingFollowUp}>
                  {submittingFollowUp ? 'Назначение...' : 'Назначить приём'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAppt && (
        <ConsultationPrintSheet
          appointment={selectedAppt}
          serviceName={servicesMap[selectedAppt.serviceId]}
          notes={notesText}
        />
      )}
    </AppShell>
  );
}
