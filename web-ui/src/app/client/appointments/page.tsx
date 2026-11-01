'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientApi } from '../../../api';
import { Appointment } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { Modal } from '../../../components/ui/Modal';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  XCircle,
  User,
  PawPrint,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  Info,
} from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'UPCOMING' | 'COMPLETED' | 'ALL'>('UPCOMING');

  // Состояние модальных окон
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [detailsAppt, setDetailsAppt] = useState<Appointment | null>(null);

  const loadAppointments = () => {
    setLoading(true);
    clientApi
      .getAppointments(0, 50)
      .then((res) => {
        const items = res?.items ?? (Array.isArray(res) ? res : []);
        setAppointments(items);
      })
      .catch((err) => {
        console.error('Failed to load appointments', err);
        setAppointments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async () => {
    if (!cancellingAppt) return;
    setCancelling(true);
    try {
      await clientApi.cancelAppointment(cancellingAppt.id, cancelReason);
      setCancellingAppt(null);
      setCancelReason('');
      loadAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const safeAppointments = appointments || [];
  const filtered = safeAppointments.filter((appt) => {
    const isUpcoming = appt.status === 'PENDING' || appt.status === 'CONFIRMED';
    const isCompleted = appt.status === 'COMPLETED' || appt.status === 'CANCELLED' || appt.status === 'NO_SHOW';

    if (tab === 'UPCOMING') return isUpcoming;
    if (tab === 'COMPLETED') return isCompleted;
    return true;
  });

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

  const formatPrice = (p?: number) => (p !== undefined ? `${p.toLocaleString('ru-RU')} ₽` : '—');

  return (
    <AppShell
      title="Мои записи на приём"
      subtitle="История и предстоящие посещения ветеринарной клиники"
      actions={
        <Link href="/client/book" className="btn btn-primary h-8 px-3 text-xs flex items-center gap-1.5">
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Записаться</span>
        </Link>
      }
    >
      <div className="flex flex-col gap-2 p-1">
        {/* Список записей на приём */}
        <section className="island p-5 flex flex-col gap-4">
          {/* Вкладки: Предстоящие / История */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
            <div className="seg">
              <button
                type="button"
                className={`seg-item text-xs ${tab === 'UPCOMING' ? 'on font-semibold' : ''}`}
                onClick={() => setTab('UPCOMING')}
              >
                Предстоящие
              </button>
              <button
                type="button"
                className={`seg-item text-xs ${tab === 'COMPLETED' ? 'on font-semibold' : ''}`}
                onClick={() => setTab('COMPLETED')}
              >
                Завершённые
              </button>
              <button
                type="button"
                className={`seg-item text-xs ${tab === 'ALL' ? 'on font-semibold' : ''}`}
                onClick={() => setTab('ALL')}
              >
                Все ({safeAppointments.length})
              </button>
            </div>

            <span className="text-xs text-[var(--muted-foreground)]">
              Найдено записей: <strong className="font-mono text-[var(--foreground)]">{filtered.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
              Загрузка записей...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)] flex flex-col items-center gap-3">
              <Calendar className="w-10 h-10 opacity-20" />
              <span>
                {tab === 'UPCOMING' ? 'У вас нет предстоящих записей' : 'Записи в данной категории не найдены'}
              </span>
              <Link href="/client/book" className="btn btn-primary h-8 px-4 text-xs mt-1">
                + Записаться на приём
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((appt) => {
                const canCancel = appt.status === 'PENDING' || appt.status === 'CONFIRMED';
                const dateObj = appt.startAt ? new Date(appt.startAt) : null;

                return (
                  <div
                    key={appt.id}
                    className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[var(--primary)] transition-all bg-[var(--card)]"
                  >
                    <div className="flex items-center gap-4">
                      {/* Блок даты приёма */}
                      <div className="datebox shrink-0">
                        <b>{dateObj ? dateObj.toLocaleDateString('ru-RU', { day: '2-digit' }) : '—'}</b>
                        <span>{dateObj ? dateObj.toLocaleDateString('ru-RU', { month: 'short' }) : ''}</span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
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
                            {appt.pet?.name || 'Питомец'}
                          </span>
                          {getStatusBadge(appt.status)}
                        </div>

                        <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2 mt-0.5">
                          <span>{appt.service?.name || 'Услуга'}</span>
                          <span>·</span>
                          <span>{appt.veterinarian?.user?.fullName || 'Врач Chiron'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Стоимость и кнопки действий */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--border)]">
                      <span className="font-mono text-sm font-bold text-[var(--foreground)]">
                        {formatPrice(appt.priceSnapshot || appt.service?.basePrice)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailsAppt(appt)}
                          className="btn btn-outline h-7 px-2.5 text-xs"
                        >
                          Детали
                        </button>

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingAppt(appt);
                              setCancelReason('');
                            }}
                            className="btn btn-destructive-outline h-7 px-2.5 text-xs"
                          >
                            Отменить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно деталей записи */}
      <Modal
        isOpen={!!detailsAppt}
        onClose={() => setDetailsAppt(null)}
        title="Информация о приёме"
        description="Детальные сведения о записи, питомце и рекомендациях врача"
      >
        {detailsAppt && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
              <div>
                <span className="font-bold text-sm block">{detailsAppt.service?.name}</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Питомец: {detailsAppt.pet?.name} ({detailsAppt.pet?.species?.name || 'Вид не указан'})
                </span>
              </div>
              {getStatusBadge(detailsAppt.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-[var(--border)] flex flex-col gap-0.5">
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase">Дата и время</span>
                <span className="font-mono font-semibold">
                  {detailsAppt.startAt ? new Date(detailsAppt.startAt).toLocaleString('ru-RU') : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--border)] flex flex-col gap-0.5">
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase">Стоимость</span>
                <span className="font-mono font-semibold text-[var(--foreground)]">
                  {formatPrice(detailsAppt.priceSnapshot || detailsAppt.service?.basePrice)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--border)] flex flex-col gap-0.5">
              <span className="text-[10px] text-[var(--muted-foreground)] uppercase">Врач</span>
              <span className="font-semibold">
                {detailsAppt.veterinarian?.user?.fullName || 'Врач клиники Chiron'}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {detailsAppt.veterinarian?.specialization?.name || 'Ветеринарный специалист'}
              </span>
            </div>

            {detailsAppt.clientComment && (
              <div className="p-2.5 rounded-lg border border-[var(--border)] flex flex-col gap-0.5">
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase">Ваш комментарий</span>
                <p className="text-[11px] italic text-[var(--foreground)]">{detailsAppt.clientComment}</p>
              </div>
            )}

            {detailsAppt.vetNotes && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase">Заключение и рекомендации врача</span>
                <p className="text-xs leading-relaxed">{detailsAppt.vetNotes}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                className="btn btn-outline h-8 px-4 text-xs"
                onClick={() => setDetailsAppt(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Модальное окно отмены приёма */}
      <Modal
        isOpen={!!cancellingAppt}
        onClose={() => setCancellingAppt(null)}
        title="Отмена записи на приём"
        description="Вы действительно хотите отменить эту запись?"
      >
        <div className="flex flex-col gap-3 text-xs">
          <p className="text-[var(--muted-foreground)]">
            Запись будет снята с расписания врача. Слот освободится для других пациентов.
          </p>

          <div className="field">
            <label className="field-label text-xs">Причина отмены (необязательно)</label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Например: изменились планы, питомец поправился..."
              className="textarea text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              className="btn btn-ghost h-8 px-3 text-xs"
              onClick={() => setCancellingAppt(null)}
            >
              Назад
            </button>
            <button
              type="button"
              disabled={cancelling}
              className="btn btn-destructive h-8 px-4 text-xs"
              onClick={handleCancel}
            >
              {cancelling ? 'Отмена...' : 'Подтвердить отмену'}
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
