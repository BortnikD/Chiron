'use client';

import React, { useEffect, useState } from 'react';
import { vetApi } from '../../../api';
import { Appointment, AppointmentStatus } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { Modal } from '../../../components/ui/Modal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Repeat,
  XCircle,
  Stethoscope,
  PawPrint,
  User,
  AlertCircle,
  Phone,
  Check,
  ChevronRight,
} from 'lucide-react';

export default function VetDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Модальное окно завершения приёма и протокола
  const [completingAppt, setCompletingAppt] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Модальное окно повторного приёма
  const [followUpAppt, setFollowUpAppt] = useState<Appointment | null>(null);
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpSuccess, setFollowUpSuccess] = useState<string | null>(null);

  const loadAppointments = () => {
    setLoading(true);
    vetApi
      .getAppointments(0, 50, statusFilter || undefined)
      .then((res) => {
        const items = res?.items ?? (Array.isArray(res) ? res : []);
        setAppointments(items);
      })
      .catch((err) => {
        console.error(err);
        setAppointments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await vetApi.updateAppointment(id, { status: newStatus });
      loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteWithNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingAppt) return;
    setUpdating(true);
    try {
      await vetApi.updateAppointment(completingAppt.id, {
        status: 'COMPLETED',
        vetNotes: clinicalNotes.trim() || undefined,
      });
      setCompletingAppt(null);
      setClinicalNotes('');
      loadAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpAppt) return;
    setFollowUpSubmitting(true);
    setFollowUpError(null);

    try {
      const [hours, minutes] = followUpTime.split(':').map(Number);
      const start = new Date(`${followUpDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
      const durationMin = followUpAppt.service?.baseDurationMin || followUpAppt.service?.durationMin || 30;
      const end = new Date(start.getTime() + durationMin * 60 * 1000);

      await vetApi.createFollowUp(followUpAppt.id, {
        serviceId: followUpAppt.serviceId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      setFollowUpSuccess('Повторный приём успешно назначен!');
      setTimeout(() => {
        setFollowUpAppt(null);
        setFollowUpSuccess(null);
        loadAppointments();
      }, 1200);
    } catch (err: any) {
      setFollowUpError(err?.message || 'Не удалось назначить повторный приём.');
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-PENDING">Ожидает</span>;
      case 'CONFIRMED':
        return <span className="badge badge-CONFIRMED">Подтверждена</span>;
      case 'COMPLETED':
        return <span className="badge badge-COMPLETED">Завершена</span>;
      case 'CANCELLED':
        return <span className="badge badge-CANCELLED">Отменена</span>;
      case 'NO_SHOW':
        return <span className="badge badge-NO_SHOW">Неявка</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <AppShell
      title="Рабочее место ветеринарного врача"
      subtitle="Очередь приёма пациентов, осмотр и электронные протоколы"
    >
      <div className="flex flex-col gap-2 p-1">
        {/* Очередь приёмов врача */}
        <section className="island p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--primary-text)]" />
              <h2 className="text-sm font-bold">Очередь приёмов</h2>
              <span className="badge text-[10px] font-mono">{appointments.length}</span>
            </div>

            {/* Фильтры статусов записей */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('')}
                className={`seg-item text-xs h-7 px-2.5 rounded-md border border-[var(--border)] transition-colors ${
                  statusFilter === '' ? 'on font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'bg-[var(--card)] text-[var(--muted-foreground)]'
                }`}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CONFIRMED')}
                className={`seg-item text-xs h-7 px-2.5 rounded-md border border-[var(--border)] transition-colors ${
                  statusFilter === 'CONFIRMED' ? 'on font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'bg-[var(--card)] text-[var(--muted-foreground)]'
                }`}
              >
                Подтверждённые
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`seg-item text-xs h-7 px-2.5 rounded-md border border-[var(--border)] transition-colors ${
                  statusFilter === 'PENDING' ? 'on font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'bg-[var(--card)] text-[var(--muted-foreground)]'
                }`}
              >
                Ожидают
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`seg-item text-xs h-7 px-2.5 rounded-md border border-[var(--border)] transition-colors ${
                  statusFilter === 'COMPLETED' ? 'on font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'bg-[var(--card)] text-[var(--muted-foreground)]'
                }`}
              >
                Завершённые
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
              Загрузка расписания приёма...
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)] flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 opacity-25" />
              <span>В выбранной категории записей нет</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {appointments.map((appt) => {
                const dateObj = appt.startAt ? new Date(appt.startAt) : null;
                const pet = appt.pet;

                return (
                  <div
                    key={appt.id}
                    className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--primary)] transition-all bg-[var(--card)]"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Блок даты приёма */}
                      <div className="datebox shrink-0">
                        <b>{dateObj ? dateObj.toLocaleDateString('ru-RU', { day: '2-digit' }) : '—'}</b>
                        <span>{dateObj ? dateObj.toLocaleDateString('ru-RU', { month: 'short' }) : ''}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm">
                            {dateObj
                              ? dateObj.toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                          <span>·</span>
                          <span className="font-bold text-sm text-[var(--foreground)]">
                            {pet?.name || 'Пациент'}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            ({pet?.species?.name || 'Вид не указан'}
                            {pet?.gender ? ` · ${pet.gender === 'MALE' ? 'самец' : 'самка'}` : ''}
                            {pet?.weightKg ? ` · ${pet.weightKg} кг` : ''})
                          </span>
                          {getStatusBadge(appt.status)}
                        </div>

                        <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-3">
                          <span className="font-medium text-[var(--foreground)]">{appt.service?.name}</span>
                          {appt.clientComment && (
                            <span className="italic truncate max-w-md">
                              «{appt.clientComment}»
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Кнопки действий над записью */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-[var(--border)]">
                      {appt.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(appt.id, 'CONFIRMED')}
                          className="btn btn-primary h-7 px-3 text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Подтвердить</span>
                        </button>
                      )}

                      {appt.status === 'CONFIRMED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setCompletingAppt(appt);
                              setClinicalNotes(appt.vetNotes || '');
                            }}
                            className="btn btn-primary h-7 px-3 text-xs flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Завершить приём</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appt.id, 'NO_SHOW')}
                            className="btn btn-outline h-7 px-2.5 text-xs text-rose-500 hover:text-rose-600"
                          >
                            Неявка
                          </button>
                        </>
                      )}

                      {appt.status === 'COMPLETED' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setCompletingAppt(appt);
                              setClinicalNotes(appt.vetNotes || '');
                            }}
                            className="btn btn-outline h-7 px-3 text-xs flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Протокол</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFollowUpAppt(appt);
                              setFollowUpError(null);
                              setFollowUpSuccess(null);
                            }}
                            className="btn btn-primary h-7 px-2.5 text-xs flex items-center gap-1"
                            title="Назначить повторный приём"
                          >
                            <Repeat className="w-3 h-3" />
                            <span>Повторный</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно клинического протокола */}
      <Modal
        isOpen={!!completingAppt}
        onClose={() => setCompletingAppt(null)}
        title={`Медицинский протокол: ${completingAppt?.pet?.name || ''}`}
        description="Внесите данные осмотра, диагноз и назначение лечения"
      >
        <form onSubmit={handleCompleteWithNotes} className="flex flex-col gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] flex items-center justify-between">
            <div>
              <span className="font-bold text-sm block">{completingAppt?.service?.name}</span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                Пациент: {completingAppt?.pet?.name} ({completingAppt?.pet?.species?.name || 'Вид не указан'})
              </span>
            </div>
            {completingAppt && getStatusBadge(completingAppt.status)}
          </div>

          <div className="field">
            <label className="field-label text-xs font-semibold">
              Клинический осмотр, диагноз и назначения <span className="req">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Температура, жалобы владельца, результаты пальпации, поставленный диагноз, медикаменты и дозировки..."
              className="textarea text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              className="btn btn-ghost h-8 px-3 text-xs"
              onClick={() => setCompletingAppt(null)}
            >
              Отмена
            </button>
            <button type="submit" disabled={updating} className="btn btn-primary h-8 px-4 text-xs">
              {updating ? 'Сохранение...' : 'Зафиксировать приём'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно повторного приёма */}
      <Modal
        isOpen={!!followUpAppt}
        onClose={() => setFollowUpAppt(null)}
        title={`Назначение повторного приёма: ${followUpAppt?.pet?.name || ''}`}
        description="Создание связанного повторного визита в статусе «Подтверждена»"
      >
        <form onSubmit={handleScheduleFollowUp} className="flex flex-col gap-3 text-xs">
          {followUpSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-medium text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{followUpSuccess}</span>
            </div>
          )}

          {followUpError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{followUpError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">{followUpAppt?.pet?.name}</span>
              <span className="badge b-confirmed text-[10px]">Повторный визит</span>
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Услуга: {followUpAppt?.service?.name || 'Повторный осмотр'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="field-label text-xs font-semibold">
                Дата приёма <span className="req">*</span>
              </label>
              <input
                type="date"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div className="field">
              <label className="field-label text-xs font-semibold">
                Время приёма <span className="req">*</span>
              </label>
              <input
                type="time"
                step="900"
                required
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="input text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              className="btn btn-ghost h-8 px-3 text-xs"
              onClick={() => setFollowUpAppt(null)}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={followUpSubmitting}
              className="btn btn-primary h-8 px-4 text-xs flex items-center gap-1.5"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>{followUpSubmitting ? 'Сохранение...' : 'Назначить повторно'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
