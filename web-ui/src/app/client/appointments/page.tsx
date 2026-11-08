'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { clientApi, clinicApi } from '../../../api';
import { Appointment, Pet, Service, Veterinarian } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { SpeciesIcon } from '../../../components/ui/SpeciesIcon';
import {
  Calendar,
  CalendarPlus,
  Clock,
  X,
  XCircle,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';

const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [tab, setTab] = useState<'UPCOMING' | 'COMPLETED' | 'ALL'>('UPCOMING');
  const [selectedPetId, setSelectedPetId] = useState<string>('ALL');

  // Выбранная запись для бокового острова детального просмотра
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Отмена записи
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [apptsRes, petsRes, svcRes, vetsRes] = await Promise.all([
        clientApi.getAppointments(0, 100),
        clientApi.getPets(),
        clinicApi.getServices(),
        clinicApi.getVeterinarians(),
      ]);

      const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
      setAppointments(items);
      setPets(Array.isArray(petsRes) ? petsRes : []);
      setServices(Array.isArray(svcRes) ? svcRes : []);
      setVeterinarians(Array.isArray(vetsRes) ? vetsRes : []);

      if (items.length > 0 && !selectedAppt && typeof window !== 'undefined' && window.innerWidth >= 1280) {
        setSelectedAppt(items[0]);
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

  const petsMap = useMemo(() => {
    const map: Record<string, Pet> = {};
    pets.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [pets]);

  const servicesMap = useMemo(() => {
    const map: Record<string, Service> = {};
    services.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [services]);

  const handleCancelAppointment = async () => {
    if (!selectedAppt) return;
    setCancelling(true);
    setCancelError(null);

    try {
      await clientApi.cancelAppointment(selectedAppt.id, cancelReason.trim() || undefined);
      setIsCancelModalOpen(false);
      setCancelReason('');
      await loadAll();
      if (selectedAppt) {
        setSelectedAppt((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      }
    } catch (err: any) {
      setCancelError(err?.message || 'Не удалось отменить запись');
    } finally {
      setCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const isUpcoming = a.status === 'PENDING' || a.status === 'CONFIRMED';
    const isPast = a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW';

    if (tab === 'UPCOMING' && !isUpcoming) return false;
    if (tab === 'COMPLETED' && !isPast) return false;
    if (selectedPetId !== 'ALL' && a.petId !== selectedPetId) return false;

    return true;
  });

  return (
    <AppShell title="Записи на приём" currentSection="Записи">
      <div className="content-col grow">
        {/* Верхний остров фильтров */}
        <section className="island filters" aria-label="Фильтры">
          <div className="field" style={{ width: 'auto' }}>
            <span className="field-label">Показать</span>
            <div className="seg">
              <button
                type="button"
                className={`seg-item ${tab === 'UPCOMING' ? 'on' : ''}`}
                onClick={() => setTab('UPCOMING')}
              >
                Предстоящие
              </button>
              <button
                type="button"
                className={`seg-item ${tab === 'COMPLETED' ? 'on' : ''}`}
                onClick={() => setTab('COMPLETED')}
              >
                Прошедшие
              </button>
              <button
                type="button"
                className={`seg-item ${tab === 'ALL' ? 'on' : ''}`}
                onClick={() => setTab('ALL')}
              >
                Все
              </button>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Питомец</span>
            <select
              className="select"
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
            >
              <option value="ALL">Все питомцы</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="spacer" />

          <Link
            href="/client/book"
            className="btn btn-primary"
            style={{ textDecoration: 'none', alignSelf: 'flex-end', height: '34px' }}
          >
            <CalendarPlus className="ic" />
            <span>Записаться</span>
          </Link>
        </section>

        {/* Сетка: Таблица записей + Боковой остров детального просмотра */}
        <div className="content-row">
          {/* Левая колонка: Таблица записей */}
          <section className="island grow">
            <div className="island-head">
              <span className="island-title">
                <Calendar className="ic" />
                Записи <span className="count">Найдено: {filteredAppointments.length}</span>
              </span>
            </div>

            <div className="table-wrap">
              <div
                className="dtable"
                style={{
                  '--cols': '1.6fr 1fr 1.5fr 1fr 1.1fr 0.8fr',
                  minWidth: '760px',
                } as React.CSSProperties}
              >
                <div className="thead">
                  <span>Дата и время</span>
                  <span>Питомец</span>
                  <span>Услуга</span>
                  <span>Статус</span>
                  <span>Цена</span>
                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
                    Записей с выбранными фильтрами не найдено
                  </div>
                ) : (
                  filteredAppointments.map((a) => {
                    const isSel = selectedAppt?.id === a.id;
                    const pet = petsMap[a.petId];
                    const svc = servicesMap[a.serviceId];

                    const dateStr = new Date(a.startAt).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });
                    const timeStr = new Date(a.startAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Moscow',
                    });

                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`trow ${isSel ? 'sel' : ''}`}
                        onClick={() => setSelectedAppt(a)}
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                      >
                        <span className="row" style={{ gap: '6px' }}>
                          <span className="cell-main tnum">{dateStr}</span>
                          <span className="muted tnum">{timeStr}</span>
                        </span>
                        <span className="pet-cell">
                          <span className="t-ava xs tone-cat">
                            <SpeciesIcon species="cat" size={14} />
                          </span>
                          <span>{pet?.name || 'Питомец'}</span>
                        </span>
                        <span>{svc?.name || 'Услуга'}</span>
                        <span>
                          <span className={`badge st badge-${a.status}`}>
                            {STATUS_SHORT[a.status] || a.status}
                          </span>
                        </span>
                        <span className="right tnum">
                          {a.priceSnapshot ? `${a.priceSnapshot.toLocaleString('ru-RU')} ₽` : '—'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* Правая колонка: Остров детальной информации о записи */}
          {selectedAppt && (
            <section
              className="island detail-island"
              style={{ flex: 'none' }}
              aria-label="Детали записи"
            >
              <div className="island-head">
                <div className="col" style={{ gap: '2px', minWidth: 0 }}>
                  <span className="h2" style={{ wordBreak: 'break-word' }}>
                    {servicesMap[selectedAppt.serviceId]?.name || 'Приём'}
                  </span>
                  <span className="cell-sub">
                    {new Date(selectedAppt.startAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    , в{' '}
                    {new Date(selectedAppt.startAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Moscow',
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
                <div className="col" style={{ gap: '16px' }}>
                  <div className="row wrap">
                    <span className={`badge st badge-${selectedAppt.status}`}>
                      {STATUS_SHORT[selectedAppt.status] || selectedAppt.status}
                    </span>
                  </div>

                  <dl className="kv" style={{ margin: 0 }}>
                    <dt>Питомец</dt>
                    <dd>{petsMap[selectedAppt.petId]?.name || 'Питомец'}</dd>
                    <dt>Дата и время</dt>
                    <dd className="tnum">
                      {new Date(selectedAppt.startAt).toLocaleDateString('ru-RU')} в{' '}
                      {new Date(selectedAppt.startAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                    <dt>Стоимость</dt>
                    <dd className="cell-main tnum">
                      {selectedAppt.priceSnapshot
                        ? `${selectedAppt.priceSnapshot.toLocaleString('ru-RU')} ₽`
                        : '—'}
                    </dd>
                  </dl>

                  {selectedAppt.clientComment && (
                    <div className="col" style={{ gap: '6px' }}>
                      <span className="section-title">Ваш комментарий</span>
                      <div className="note">{selectedAppt.clientComment}</div>
                    </div>
                  )}

                  {selectedAppt.vetNotes && (
                    <div className="col" style={{ gap: '6px' }}>
                      <span className="section-title">Заметки врача</span>
                      <div className="note">{selectedAppt.vetNotes}</div>
                    </div>
                  )}

                  {selectedAppt.status === 'CANCELLED' && (
                    <div className="alert alert-info">
                      <AlertCircle className="ic" />
                      <div>
                        <b>Запись отменена.</b> {selectedAppt.cancelReason ? `Причина: ${selectedAppt.cancelReason}` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Возможность отмены записи */}
              {(selectedAppt.status === 'PENDING' || selectedAppt.status === 'CONFIRMED') && (
                <div className="island-foot">
                  <span className="small muted">Отмена доступна до начала приёма</span>
                  <button
                    type="button"
                    className="btn btn-destructive-outline"
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    <XCircle className="ic" />
                    <span>Отменить запись</span>
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Диалог подтверждения отмены записи */}
      {isCancelModalOpen && selectedAppt && (
        <div className="dialog-backdrop">
          <div className="dialog" style={{ width: '420px', maxWidth: 'calc(100vw - 32px)' }}>
            <div className="dialog-head">
              <span className="dialog-title">Отмена записи</span>
              <span className="dialog-desc">
                Вы уверены, что хотите отменить приём на{' '}
                {new Date(selectedAppt.startAt).toLocaleDateString('ru-RU')}?
              </span>
            </div>

            <div className="dialog-body">
              {cancelError && (
                <div className="alert alert-destructive">
                  <AlertCircle className="ic" />
                  <div>{cancelError}</div>
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="c-reason">
                  Причина отмены (необязательно)
                </label>
                <textarea
                  id="c-reason"
                  className="textarea"
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Изменились планы, питомец поправился..."
                />
              </div>
            </div>

            <div className="dialog-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Назад
              </button>
              <button
                type="button"
                className="btn btn-destructive"
                disabled={cancelling}
                onClick={handleCancelAppointment}
              >
                {cancelling ? 'Отмена...' : 'Подтвердить отмену'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
