'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, clinicApi } from '../../../api';
import {
  Appointment,
  AppointmentStatus,
  Veterinarian,
  Service,
  Pet,
  User,
  AdminCreateAppointmentRequest,
  AdminUpdateAppointmentRequest,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Check,
  Repeat,
} from 'lucide-react';

const STATUS_MAP: Record<AppointmentStatus, { label: string; short: string; cls: string }> = {
  PENDING: { label: 'В ожидании', short: 'Ожидает', cls: 'badge-PENDING' },
  CONFIRMED: { label: 'Подтверждена', short: 'Подтверждена', cls: 'badge-CONFIRMED' },
  IN_PROGRESS: { label: 'В процессе', short: 'В процессе', cls: 'badge-CONFIRMED' },
  COMPLETED: { label: 'Завершена', short: 'Завершена', cls: 'badge-COMPLETED' },
  CANCELLED: { label: 'Отменена', short: 'Отменена', cls: 'badge-CANCELLED' },
  NO_SHOW: { label: 'Неявка', short: 'Неявка', cls: 'badge-NO_SHOW' },
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [vetFilter, setVetFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Master-Detail selected appointment
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    veterinarianId: '',
    date: '',
    start: '',
    status: 'CONFIRMED' as AppointmentStatus,
    cancelledBy: '',
    cancelledAt: '',
    cancelReason: '',
    clientComment: '',
    vetNotes: '',
  });
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [availStatus, setAvailStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [availMsg, setAvailMsg] = useState<string>('');
  const [savingAppt, setSavingAppt] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Create Modal `na`
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    veterinarianId: '',
    petId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    start: '10:00',
    end: '10:30',
    price: 1500,
    status: 'CONFIRMED' as AppointmentStatus,
    clientComment: '',
  });
  const [createAvailStatus, setCreateAvailStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [createAvailMsg, setCreateAvailMsg] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsRes, vetsRes, svcsRes, petsRes, usersRes] = await Promise.all([
        adminApi.getAppointments(0, 100, {
          status: statusFilter !== 'ALL' ? (statusFilter as AppointmentStatus) : undefined,
          veterinarianId: vetFilter !== 'ALL' ? vetFilter : undefined,
        }).catch(() => ({ items: [] })),
        adminApi.getVeterinarians().catch(() => [] as Veterinarian[]),
        clinicApi.getServices().catch(() => [] as Service[]),
        adminApi.getPets(0, 100).catch(() => ({ items: [] })),
        adminApi.getUsers(0, 100).catch(() => ({ items: [] })),
      ]);

      const appts = apptsRes?.items || [];
      const safeVets = Array.isArray(vetsRes) ? vetsRes : [];
      const safeSvcs = Array.isArray(svcsRes) ? svcsRes : [];
      const safePets = petsRes?.items || [];
      const safeUsers = usersRes?.items || [];

      setAppointments(appts);
      setVeterinarians(safeVets);
      setServices(safeSvcs);
      setPets(safePets);
      setUsers(safeUsers);

      if (selectedAppt) {
        const updated = appts.find((a: Appointment) => a.id === selectedAppt.id);
        if (updated) setSelectedAppt(updated);
      }
    } catch (err) {
      console.error('Failed to load appointments data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, vetFilter]);

  // When selected appointment changes, populate edit form
  useEffect(() => {
    if (!selectedAppt) {
      setIsEditing(false);
      return;
    }
    const d = new Date(selectedAppt.startAt);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().slice(0, 5);

    setEditForm({
      veterinarianId: selectedAppt.veterinarianId,
      date: dateStr,
      start: timeStr,
      status: selectedAppt.status,
      cancelledBy: selectedAppt.cancelledBy || '',
      cancelledAt: selectedAppt.cancelledAt ? selectedAppt.cancelledAt.slice(0, 16).replace('T', ' ') : '',
      cancelReason: selectedAppt.cancelReason || selectedAppt.cancellationReason || '',
      clientComment: selectedAppt.clientComment || '',
      vetNotes: selectedAppt.vetNotes || selectedAppt.notes || '',
    });
    setAvailStatus('idle');
    setAvailMsg('');
    setSaveError(null);
  }, [selectedAppt]);

  const getVetName = (vetId: string) => {
    const vet = veterinarians.find((v) => v.id === vetId);
    if (!vet) return 'Врач клиники';
    if (vet.user?.fullName) return vet.user.fullName;
    const user = users.find((u) => u.id === vet.userId);
    return user?.fullName || `Врач (${vetId.slice(0, 6)})`;
  };

  const getServiceName = (svcId: string) => {
    const svc = services.find((s) => s.id === svcId);
    return svc?.name || 'Услуга клиники';
  };

  const getPet = (petId: string) => {
    return pets.find((p) => p.id === petId);
  };

  const getOwnerName = (ownerId?: string) => {
    if (!ownerId) return '—';
    const user = users.find((u) => u.id === ownerId);
    return user ? user.fullName : '—';
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return { date, time, rawDate: d.toISOString().split('T')[0] };
  };

  const formatPrice = (price?: number) => {
    if (price == null) return '0 ₽';
    return `${price.toLocaleString('ru-RU')} ₽`;
  };

  // Check slot availability for edit form
  const handleCheckEditSlot = async () => {
    if (!editForm.veterinarianId || !editForm.date || !editForm.start || !selectedAppt) return;
    setCheckingSlot(true);
    setAvailStatus('idle');
    try {
      const selectedSvc = services.find((s) => s.id === selectedAppt.serviceId);
      const dur = selectedSvc?.baseDurationMin ?? 30;
      const startIso = new Date(`${editForm.date}T${editForm.start}:00`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + dur * 60000).toISOString();

      const isAvailable = await clinicApi.checkAvailability({
        veterinarianId: editForm.veterinarianId,
        startAt: startIso,
        endAt: endIso,
        excludeAppointmentId: selectedAppt.id,
      });

      if (isAvailable) {
        setAvailStatus('ok');
        setAvailMsg('Слот свободен');
      } else {
        setAvailStatus('err');
        setAvailMsg('Слот занят другим приёмом или перерывом врача');
      }
    } catch (err: any) {
      setAvailStatus('err');
      setAvailMsg(err?.response?.data?.message || err?.message || 'Ошибка проверки доступности слота');
    } finally {
      setCheckingSlot(false);
    }
  };

  // Save updated appointment
  const handleSaveAppt = async () => {
    if (!selectedAppt) return;
    setSavingAppt(true);
    setSaveError(null);
    try {
      let startAt = selectedAppt.startAt;
      let endAt = selectedAppt.endAt;

      if (editForm.date && editForm.start) {
        const selectedSvc = services.find((s) => s.id === selectedAppt.serviceId);
        const dur = selectedSvc?.baseDurationMin ?? 30;
        startAt = new Date(`${editForm.date}T${editForm.start}:00`).toISOString();
        endAt = new Date(new Date(startAt).getTime() + dur * 60000).toISOString();
      }

      const payload: AdminUpdateAppointmentRequest = {
        veterinarianId: editForm.veterinarianId,
        status: editForm.status,
        vetNotes: editForm.vetNotes || null,
        cancelReason: editForm.status === 'CANCELLED' ? editForm.cancelReason || 'Отменено администратором' : null,
      };

      await adminApi.updateAppointment(selectedAppt.id, payload);
      setIsEditing(false);
      await loadData();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Ошибка при сохранении записи');
    } finally {
      setSavingAppt(false);
    }
  };

  // Delete appointment
  const handleDeleteAppt = async () => {
    if (!selectedAppt) return;
    setDeleting(true);
    try {
      await adminApi.deleteAppointment(selectedAppt.id);
      setIsDeleteConfirmOpen(false);
      setSelectedAppt(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении записи');
    } finally {
      setDeleting(false);
    }
  };

  // Check slot for new appointment
  const handleCheckCreateSlot = async () => {
    if (!createForm.veterinarianId || !createForm.date || !createForm.start) return;
    setCreateAvailStatus('idle');
    try {
      const selectedSvc = services.find((s) => s.id === createForm.serviceId);
      const dur = selectedSvc?.baseDurationMin ?? 30;
      const startIso = new Date(`${createForm.date}T${createForm.start}:00`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + dur * 60000).toISOString();

      const isAvailable = await clinicApi.checkAvailability({
        veterinarianId: createForm.veterinarianId,
        startAt: startIso,
        endAt: endIso,
      });

      if (isAvailable) {
        setCreateAvailStatus('ok');
        setCreateAvailMsg('Слот свободен — можно создавать');
      } else {
        setCreateAvailStatus('err');
        setCreateAvailMsg('Слот недоступен в рабочем графике врача');
      }
    } catch (err: any) {
      setCreateAvailStatus('err');
      setCreateAvailMsg(err?.response?.data?.message || err?.message || 'Ошибка проверки слота');
    }
  };

  // Create new appointment
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.petId || !createForm.serviceId || !createForm.veterinarianId) {
      setCreateError('Заполните все обязательные поля');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const selectedSvc = services.find((s) => s.id === createForm.serviceId);
      const dur = selectedSvc?.baseDurationMin ?? 30;
      const startIso = new Date(`${createForm.date}T${createForm.start}:00`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + dur * 60000).toISOString();

      const payload: AdminCreateAppointmentRequest = {
        veterinarianId: createForm.veterinarianId,
        petId: createForm.petId,
        serviceId: createForm.serviceId,
        startAt: startIso,
        endAt: endIso,
        priceSnapshot: createForm.price,
        clientComment: createForm.clientComment || null,
      };

      const created = await adminApi.createAppointment(payload);
      setIsCreateOpen(false);
      await loadData();
      if (created) setSelectedAppt(created);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || 'Ошибка при создании записи');
    } finally {
      setCreating(false);
    }
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      const sName = getServiceName(a.serviceId).toLowerCase();
      const vName = getVetName(a.veterinarianId).toLowerCase();
      const p = getPet(a.petId);
      const pName = (p?.name || '').toLowerCase();
      const oName = getOwnerName(p?.ownerId).toLowerCase();
      if (!sName.includes(q) && !vName.includes(q) && !pName.includes(q) && !oName.includes(q)) {
        return false;
      }
    }
    if (dateFrom) {
      const aDate = a.startAt.split('T')[0];
      if (aDate < dateFrom) return false;
    }
    if (dateTo) {
      const aDate = a.startAt.split('T')[0];
      if (aDate > dateTo) return false;
    }
    return true;
  });

  return (
    <AppShell crumbGroup="Клиника" crumb="Записи">
      <div className="content-row">
        {/* Left Column: Filters + Table */}
        <div className="content-col grow">
          <section className="island filters" aria-label="Фильтры записей">
            <div className="field">
              <span className="field-label">Статус</span>
              <div className="dd">
                <select
                  className="select dd-btn"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Все статусы</option>
                  <option value="PENDING">Ожидает</option>
                  <option value="CONFIRMED">Подтверждена</option>
                  <option value="IN_PROGRESS">В процессе</option>
                  <option value="COMPLETED">Завершена</option>
                  <option value="CANCELLED">Отменена</option>
                  <option value="NO_SHOW">Неявка</option>
                </select>
              </div>
            </div>

            <div className="field">
              <span className="field-label">Врач</span>
              <div className="dd">
                <select
                  className="select dd-btn"
                  value={vetFilter}
                  onChange={(e) => setVetFilter(e.target.value)}
                >
                  <option value="ALL">Все врачи</option>
                  {veterinarians.map((v) => (
                    <option key={v.id} value={v.id}>
                      {getVetName(v.id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field" style={{ width: 140 }}>
              <label className="field-label" htmlFor="filter-from">
                С
              </label>
              <input
                id="filter-from"
                type="date"
                className="input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="field" style={{ width: 140 }}>
              <label className="field-label" htmlFor="filter-to">
                По
              </label>
              <input
                id="filter-to"
                type="date"
                className="input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="field" style={{ width: 180 }}>
              <span className="field-label">Поиск</span>
              <div className="input-icon">
                <Search size={14} className="ic" />
                <input
                  type="text"
                  className="input"
                  placeholder="Питомец, услуга…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="spacer" />

            <button
              className="btn btn-primary"
              onClick={() => {
                setCreateError(null);
                setCreateAvailStatus('idle');
                if (veterinarians.length > 0 && !createForm.veterinarianId) {
                  setCreateForm((prev) => ({
                    ...prev,
                    veterinarianId: veterinarians[0].id,
                    serviceId: services[0]?.id || '',
                    petId: pets[0]?.id || '',
                    price: services[0]?.basePrice || 1500,
                  }));
                }
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} />
              Новая запись
            </button>
          </section>

          <section className="island grow">
            <div className="island-head">
              <span className="island-title">
                <Calendar size={18} />
                Записи <span className="count">Найдено: {filteredAppointments.length}</span>
              </span>
            </div>

            <div className="table-wrap">
              <div
                className="dtable"
                style={
                  {
                    '--cols': '1.5fr 1fr 1fr 1.4fr 1fr 1.2fr 0.7fr',
                    minWidth: '900px',
                  } as React.CSSProperties
                }
              >
                <div className="thead">
                  <span>Дата и время ↑</span>
                  <span>Питомец</span>
                  <span>Владелец</span>
                  <span>Услуга</span>
                  <span>Врач</span>
                  <span>Статус</span>
                  <span className="right">Цена</span>
                </div>

                {filteredAppointments.map((a) => {
                  const isSelected = selectedAppt?.id === a.id;
                  const dt = formatDateTime(a.startAt);
                  const p = getPet(a.petId);
                  const sInfo = STATUS_MAP[a.status] || {
                    label: a.status,
                    short: a.status,
                    cls: 'badge-outline',
                  };

                  return (
                    <button
                      key={a.id}
                      className={`trow ${isSelected ? 'sel' : ''}`}
                      onClick={() => {
                        setSelectedAppt(a);
                        setIsEditing(false);
                      }}
                    >
                      <span className="row" style={{ gap: 6 }}>
                        <span className="cell-main tnum">{dt.date}</span>
                        <span className="muted tnum">{dt.time}</span>
                        {a.followUpOf && (
                          <Repeat
                            size={14}
                            style={{ color: 'var(--primary)' }}
                            aria-label="Повторный приём"
                          />
                        )}
                      </span>
                      <span className="pet-cell">
                        <span className={`t-ava xs tone-${p?.speciesId || 'default'}`}>
                          {p?.name ? p.name.slice(0, 2).toUpperCase() : 'ПТ'}
                        </span>
                        <span>{p?.name || 'Питомец'}</span>
                      </span>
                      <span className="muted">{getOwnerName(p?.ownerId)}</span>
                      <span>{getServiceName(a.serviceId)}</span>
                      <span>{getVetName(a.veterinarianId)}</span>
                      <span>
                        <span className={`badge st ${sInfo.cls}`}>{sInfo.short}</span>
                      </span>
                      <span className="right tnum">{formatPrice(a.priceSnapshot || a.price)}</span>
                    </button>
                  );
                })}
              </div>

              {filteredAppointments.length === 0 && !loading && (
                <div className="empty">
                  <span className="empty-title">Записи не найдены</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Master-Detail Island (440px) */}
        {selectedAppt && (
          <section className="island detail-island" style={{ width: 440 }} aria-label="Запись">
            <div className="island-head">
              <div className="col" style={{ gap: 2 }}>
                <span className="h2">
                  {getPet(selectedAppt.petId)?.name || 'Питомец'} — {getServiceName(selectedAppt.serviceId)}
                </span>
                <span className="cell-sub tnum">
                  {formatDateTime(selectedAppt.startAt).date},{' '}
                  {formatDateTime(selectedAppt.startAt).time}–{formatDateTime(selectedAppt.endAt).time}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => setSelectedAppt(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="island-body" style={{ paddingTop: 14 }}>
              {/* View Mode */}
              {!isEditing && (
                <div className="col" style={{ gap: 16 }}>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <span className={`badge st ${STATUS_MAP[selectedAppt.status]?.cls}`}>
                      {STATUS_MAP[selectedAppt.status]?.label}
                    </span>
                    {selectedAppt.followUpOf && (
                      <span className="badge badge-accent">Повторный приём</span>
                    )}
                  </div>

                  <dl className="kv" style={{ margin: 0 }}>
                    <dt>Питомец</dt>
                    <dd>{getPet(selectedAppt.petId)?.name || 'Питомец'}</dd>
                    <dt>Владелец</dt>
                    <dd>{getOwnerName(getPet(selectedAppt.petId)?.ownerId)}</dd>
                    <dt>Врач</dt>
                    <dd>{getVetName(selectedAppt.veterinarianId)}</dd>
                    <dt>Услуга</dt>
                    <dd>{getServiceName(selectedAppt.serviceId)}</dd>
                    <dt>Время</dt>
                    <dd className="tnum">
                      {formatDateTime(selectedAppt.startAt).date},{' '}
                      {formatDateTime(selectedAppt.startAt).time}–{formatDateTime(selectedAppt.endAt).time}
                    </dd>
                    <dt>Цена</dt>
                    <dd className="tnum">
                      {formatPrice(selectedAppt.priceSnapshot || selectedAppt.price)}
                    </dd>
                    {selectedAppt.followUpOf && (
                      <>
                        <dt>Повторный к</dt>
                        <dd className="tnum">{selectedAppt.followUpOf.slice(0, 8)}…</dd>
                      </>
                    )}
                  </dl>

                  <div className="col" style={{ gap: 6 }}>
                    <span className="section-title">Комментарий клиента</span>
                    <div className="note">{selectedAppt.clientComment || '—'}</div>
                  </div>

                  <div className="col" style={{ gap: 6 }}>
                    <span className="section-title">Заметки врача</span>
                    <div className="note">
                      {selectedAppt.vetNotes || selectedAppt.notes || '—'}
                    </div>
                  </div>

                  {selectedAppt.status === 'CANCELLED' && (
                    <dl className="kv" style={{ margin: 0 }}>
                      <dt>Отменил</dt>
                      <dd>{selectedAppt.cancelledBy || '—'}</dd>
                      <dt>Когда</dt>
                      <dd className="tnum">
                        {selectedAppt.cancelledAt
                          ? selectedAppt.cancelledAt.slice(0, 16).replace('T', ' ')
                          : '—'}
                      </dd>
                      <dt>Причина</dt>
                      <dd>
                        {selectedAppt.cancelReason || selectedAppt.cancellationReason || '—'}
                      </dd>
                    </dl>
                  )}
                </div>
              )}

              {/* Edit Mode */}
              {isEditing && (
                <div className="col" style={{ gap: 14 }}>
                  <div className="field">
                    <span className="field-label">Врач</span>
                    <select
                      className="select"
                      value={editForm.veterinarianId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, veterinarianId: e.target.value })
                      }
                    >
                      {veterinarians.map((v) => (
                        <option key={v.id} value={v.id}>
                          {getVetName(v.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label" htmlFor="ae-date">
                        Дата
                      </label>
                      <input
                        id="ae-date"
                        type="date"
                        className="input"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="ae-start">
                        Начало
                      </label>
                      <input
                        id="ae-start"
                        type="time"
                        step="900"
                        className="input"
                        value={editForm.start}
                        onChange={(e) => setEditForm({ ...editForm, start: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row between">
                    <span className="small muted">Перенос проверяется с excludeAppointmentId</span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleCheckEditSlot}
                      disabled={checkingSlot}
                    >
                      {checkingSlot ? 'Проверка…' : 'Проверить слот'}
                    </button>
                  </div>

                  {availStatus === 'ok' && (
                    <div
                      className="alert alert-info"
                      style={{ borderColor: 'var(--st-completed-fg, #22c55e)' }}
                    >
                      <Check size={16} style={{ color: 'var(--st-completed-fg, #22c55e)' }} />
                      <div>Слот свободен</div>
                    </div>
                  )}

                  {availStatus === 'err' && (
                    <div className="alert" role="alert">
                      <AlertCircle size={16} />
                      <div>{availMsg}</div>
                    </div>
                  )}

                  <div className="field">
                    <span className="field-label">Статус</span>
                    <div className="chips">
                      {(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as AppointmentStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`chip ${editForm.status === st ? 'on' : ''}`}
                          onClick={() => setEditForm({ ...editForm, status: st })}
                        >
                          {STATUS_MAP[st]?.short || st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editForm.status === 'CANCELLED' && (
                    <div className="form-grid">
                      <div className="field">
                        <label className="field-label" htmlFor="ae-cby">
                          Кем отменена
                        </label>
                        <input
                          id="ae-cby"
                          className="input"
                          value={editForm.cancelledBy}
                          onChange={(e) =>
                            setEditForm({ ...editForm, cancelledBy: e.target.value })
                          }
                          placeholder="Администратор"
                        />
                      </div>
                      <div className="field">
                        <label className="field-label" htmlFor="ae-cr">
                          Причина
                        </label>
                        <input
                          id="ae-cr"
                          className="input"
                          value={editForm.cancelReason}
                          onChange={(e) =>
                            setEditForm({ ...editForm, cancelReason: e.target.value })
                          }
                          placeholder="Причина отмены"
                        />
                      </div>
                    </div>
                  )}

                  <div className="field">
                    <label className="field-label" htmlFor="ae-notes">
                      Заметки врача
                    </label>
                    <textarea
                      id="ae-notes"
                      className="textarea"
                      maxLength={4000}
                      rows={3}
                      value={editForm.vetNotes}
                      onChange={(e) => setEditForm({ ...editForm, vetNotes: e.target.value })}
                    />
                  </div>

                  {saveError && (
                    <div className="alert" role="alert">
                      <AlertCircle size={16} />
                      <div>{saveError}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="island-foot">
              {!isEditing ? (
                <>
                  <button
                    className="btn btn-destructive-outline btn-sm"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                  >
                    <Trash2 size={14} />
                    Удалить
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 size={14} />
                    Изменить
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Отмена
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveAppt}
                    disabled={savingAppt}
                  >
                    {savingAppt ? 'Сохранение…' : 'Сохранить'}
                  </button>
                </>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Modal: New Appointment `na` */}
      {isCreateOpen && (
        <div
          className="overlay"
          onClick={() => setIsCreateOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="dialog dialog-lg"
            style={{ width: 620 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Новая запись</span>
              <span className="dialog-desc">
                Создание записи на приём с проверкой доступности слота
              </span>
            </div>

            <form onSubmit={handleCreateSubmit} className="col" style={{ gap: 14 }}>
              <div className="field">
                <span className="field-label">
                  Питомец <span className="req">*</span>
                </span>
                <select
                  className="select"
                  value={createForm.petId}
                  onChange={(e) => setCreateForm({ ...createForm, petId: e.target.value })}
                  required
                >
                  <option value="">Выберите питомца…</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({getOwnerName(p.ownerId)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <span className="field-label">
                  Услуга <span className="req">*</span>
                </span>
                <select
                  className="select"
                  value={createForm.serviceId}
                  onChange={(e) => {
                    const svc = services.find((s) => s.id === e.target.value);
                    setCreateForm({
                      ...createForm,
                      serviceId: e.target.value,
                      price: svc?.basePrice || 1500,
                    });
                  }}
                  required
                >
                  <option value="">Выберите услугу…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.basePrice} ₽, {s.baseDurationMin} мин)
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <span className="field-label">
                  Врач <span className="req">*</span>
                </span>
                <select
                  className="select"
                  value={createForm.veterinarianId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, veterinarianId: e.target.value })
                  }
                  required
                >
                  <option value="">Выберите врача…</option>
                  {veterinarians.map((v) => (
                    <option key={v.id} value={v.id}>
                      {getVetName(v.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                <div className="field">
                  <label className="field-label" htmlFor="na-date">
                    Дата <span className="req">*</span>
                  </label>
                  <input
                    id="na-date"
                    type="date"
                    className="input"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="na-start">
                    Начало <span className="req">*</span>
                  </label>
                  <input
                    id="na-start"
                    type="time"
                    step="900"
                    className="input"
                    value={createForm.start}
                    onChange={(e) => setCreateForm({ ...createForm, start: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="na-end">
                    Конец <span className="req">*</span>
                  </label>
                  <input
                    id="na-end"
                    type="time"
                    step="900"
                    className="input"
                    value={createForm.end}
                    onChange={(e) => setCreateForm({ ...createForm, end: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="na-price">
                    Цена, ₽ <span className="req">*</span>
                  </label>
                  <input
                    id="na-price"
                    type="number"
                    min="0"
                    className="input"
                    value={createForm.price}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, price: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <div className="row between">
                <span className="small muted">Проверка доступности слота перед сохранением</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCheckCreateSlot}
                >
                  Проверить слот
                </button>
              </div>

              {createAvailStatus === 'ok' && (
                <div
                  className="alert alert-info"
                  style={{ borderColor: 'var(--st-completed-fg, #22c55e)' }}
                >
                  <Check size={16} style={{ color: 'var(--st-completed-fg, #22c55e)' }} />
                  <div>{createAvailMsg}</div>
                </div>
              )}

              {createAvailStatus === 'err' && (
                <div className="alert" role="alert">
                  <AlertCircle size={16} />
                  <div>{createAvailMsg}</div>
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="na-comm">
                  Комментарий клиента
                </label>
                <textarea
                  id="na-comm"
                  className="textarea"
                  rows={2}
                  maxLength={1000}
                  value={createForm.clientComment}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, clientComment: e.target.value })
                  }
                />
              </div>

              {createError && (
                <div className="alert" role="alert">
                  <AlertCircle size={16} />
                  <div>{createError}</div>
                </div>
              )}

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Создание…' : 'Создать запись'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && selectedAppt && (
        <div
          className="overlay"
          onClick={() => setIsDeleteConfirmOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="dialog dialog-sm"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Удалить запись на приём?</span>
              <span className="dialog-desc">
                Запись #{selectedAppt.id.slice(0, 8)} ({getPet(selectedAppt.petId)?.name || 'Питомец'} —{' '}
                {getServiceName(selectedAppt.serviceId)}) будет безвозвратно удалена.
              </span>
            </div>
            <div className="dialog-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-destructive"
                onClick={handleDeleteAppt}
                disabled={deleting}
              >
                {deleting ? 'Удаление…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
