'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, clinicApi } from '../../../api';
import {
  Appointment,
  AppointmentStatus,
  Veterinarian,
  Service,
  Pet,
  AdminCreateAppointmentRequest,
  AdminUpdateAppointmentRequest,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры записей
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [vetFilter, setVetFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Модальное окно создания записи
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    veterinarianId: '',
    petId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    clientComment: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Модальное окно редактирования записи
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'PENDING' as AppointmentStatus,
    veterinarianId: '',
    vetNotes: '',
    cancelReason: '',
  });
  const [updating, setUpdating] = useState(false);

  // Модальное окно подтверждения удаления
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsRes, vetsRes, svcsRes, petsRes] = await Promise.all([
        adminApi.getAppointments(0, 100, {
          status: statusFilter || undefined,
          veterinarianId: vetFilter || undefined,
        }),
        adminApi.getVeterinarians().catch(() => []),
        clinicApi.getServices().catch(() => []),
        adminApi.getPets(0, 100).catch(() => ({ items: [] })),
      ]);

      setAppointments(apptsRes?.items ?? []);
      const safeVets = Array.isArray(vetsRes) ? vetsRes : [];
      const safeSvcs = Array.isArray(svcsRes) ? svcsRes : [];
      const safePets = petsRes?.items ?? (Array.isArray(petsRes) ? petsRes : []);

      setVeterinarians(safeVets);
      setServices(safeSvcs);
      setPets(safePets);

      if (safeVets.length > 0 && !createForm.veterinarianId) {
        setCreateForm((prev) => ({
          ...prev,
          veterinarianId: safeVets[0].id,
          serviceId: safeSvcs[0]?.id || '',
          petId: safePets[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, vetFilter]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const selectedSvc = services.find((s) => s.id === createForm.serviceId);
      const durationMin = selectedSvc?.baseDurationMin ?? selectedSvc?.durationMin ?? 30;
      const priceSnapshot = selectedSvc?.basePrice ?? selectedSvc?.price ?? 1500;

      const [year, month, day] = createForm.date.split('-').map(Number);
      const [hour, minute] = createForm.time.split(':').map(Number);

      const startDate = new Date(year, month - 1, day, hour, minute);
      const endDate = new Date(startDate.getTime() + durationMin * 60000);

      const payload: AdminCreateAppointmentRequest = {
        veterinarianId: createForm.veterinarianId,
        petId: createForm.petId,
        serviceId: createForm.serviceId,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        priceSnapshot,
        clientComment: createForm.clientComment || null,
      };

      await adminApi.createAppointment(payload);
      setIsCreateOpen(false);
      setCreateForm({
        ...createForm,
        clientComment: '',
      });
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Ошибка при создании записи');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (appt: Appointment) => {
    setEditingAppt(appt);
    setEditForm({
      status: appt.status,
      veterinarianId: appt.veterinarianId,
      vetNotes: appt.vetNotes || appt.notes || '',
      cancelReason: appt.cancelReason || appt.cancellationReason || '',
    });
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;
    setUpdating(true);

    try {
      const payload: AdminUpdateAppointmentRequest = {
        status: editForm.status,
        veterinarianId: editForm.veterinarianId,
        vetNotes: editForm.vetNotes || null,
        cancelReason: editForm.status === 'CANCELLED' ? editForm.cancelReason || 'Отменено администратором' : null,
      };

      await adminApi.updateAppointment(editingAppt.id, payload);
      setEditingAppt(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await adminApi.deleteAppointment(deletingId);
      setDeletingId(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getVetName = (vetId: string) => {
    const vet = veterinarians.find((v) => v.id === vetId);
    return vet?.user?.fullName || 'Врач клиники';
  };

  const getServiceName = (svcId: string) => {
    const svc = services.find((s) => s.id === svcId);
    return svc?.name || 'Ветеринарная услуга';
  };

  const getPetName = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    return pet ? `${pet.name}` : `Питомец`;
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge b-pending">В ожидании</span>;
      case 'CONFIRMED':
        return <span className="badge b-confirmed">Подтверждён</span>;
      case 'COMPLETED':
        return <span className="badge b-completed">Завершён</span>;
      case 'CANCELLED':
        return <span className="badge b-cancelled">Отменён</span>;
      case 'NO_SHOW':
        return <span className="badge b-noshow">Неявка</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const svc = getServiceName(a.serviceId).toLowerCase();
    const vet = getVetName(a.veterinarianId).toLowerCase();
    const pet = getPetName(a.petId).toLowerCase();
    return svc.includes(q) || vet.includes(q) || pet.includes(q) || a.id.toLowerCase().includes(q);
  });

  return (
    <AppShell
      title="Журнал записей"
      subtitle="Реестр консультаций, управление статусами и назначение врачей"
      actions={
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="ic" />
          <span>Создать запись</span>
        </button>
      }
    >
      <div className="content-col grow" style={{ gap: '8px' }}>
        {/* Панель фильтрации записей */}
        <section className="island filters" aria-label="Фильтры записей">
          <div className="field" style={{ minWidth: '240px', flex: 1 }}>
            <span className="field-label">Поиск</span>
            <div className="input-icon">
              <Search className="ic" />
              <input
                className="input input-sm"
                placeholder="Питомец, врач, услуга, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Специалист</span>
            <select
              className="select input-sm"
              value={vetFilter}
              onChange={(e) => setVetFilter(e.target.value)}
            >
              <option value="">Все врачи</option>
              {veterinarians.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.user?.fullName || `Врач (${v.id.substring(0, 6)})`}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <span className="field-label">Статус</span>
            <div className="chips">
              {[
                { val: '', label: 'Все' },
                { val: 'PENDING', label: 'Ожидают' },
                { val: 'CONFIRMED', label: 'Подтверждены' },
                { val: 'COMPLETED', label: 'Завершены' },
                { val: 'CANCELLED', label: 'Отменены' },
                { val: 'NO_SHOW', label: 'Неявка' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  className={`chip ${statusFilter === chip.val ? 'on' : ''}`}
                  onClick={() => setStatusFilter(chip.val)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {(statusFilter || vetFilter || search) && (
            <div className="field" style={{ justifyContent: 'flex-end', marginLeft: 'auto' }}>
              <span className="field-label">&nbsp;</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setStatusFilter('');
                  setVetFilter('');
                  setSearch('');
                }}
              >
                <X className="ic" style={{ width: '13px', height: '13px' }} />
                <span>Сбросить</span>
              </button>
            </div>
          )}
        </section>

        {/* Таблица записей клиники */}
        <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="island-head">
            <span className="island-title">
              <Calendar className="ic" />
              <span>Записи на приём</span>
              <span className="count">Найдено: {filteredAppointments.length}</span>
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={loadData}
              title="Обновить"
            >
              <RefreshCw className={`ic ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px' }} />
              ))}
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="table-wrap">
              <table className="table" aria-label="Журнал записей">
                <thead>
                  <tr>
                    <th style={{ width: '140px' }}>Дата и время</th>
                    <th>Питомец</th>
                    <th>Услуга</th>
                    <th>Врач</th>
                    <th>Статус</th>
                    <th style={{ textAlign: 'right', width: '110px' }}>Стоимость</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => {
                    const startDate = new Date(appt.startAt);
                    const endDate = new Date(appt.endAt);
                    const dateStr = startDate.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    });
                    const timeStr = `${startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}–${endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <tr key={appt.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="tnum font-semibold text-sm">{dateStr}</span>
                            <span className="tnum muted text-xs">{timeStr}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="font-semibold text-sm">{getPetName(appt.petId)}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="text-sm font-medium">{getServiceName(appt.serviceId)}</span>
                            {appt.clientComment && (
                              <span className="muted text-xs italic line-clamp-1" title={appt.clientComment}>
                                «{appt.clientComment}»
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="text-sm">{getVetName(appt.veterinarianId)}</span>
                        </td>
                        <td>
                          {getStatusBadge(appt.status)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="tnum font-semibold text-sm">
                            {(appt.priceSnapshot ?? appt.price ?? 0).toLocaleString('ru-RU')} ₽
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => openEditModal(appt)}
                              title="Изменить статус и заметки"
                            >
                              <Edit2 className="ic" style={{ width: '14px', height: '14px' }} />
                              <span>Статус</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                              onClick={() => setDeletingId(appt.id)}
                              title="Удалить запись"
                            >
                              <Trash2 className="ic" style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty" style={{ padding: '48px 16px' }}>
              <div className="empty-art">
                <Calendar className="ic" style={{ width: '40px', height: '40px', opacity: 0.4 }} />
              </div>
              <span className="empty-title">Записи не найдены</span>
              <p className="muted text-xs text-center max-w-sm mt-1">
                По заданным критериям фильтрации записей нет. Попробуйте сбросить фильтры или создать новую запись.
              </p>
              {(statusFilter || vetFilter || search) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm mt-3"
                  onClick={() => {
                    setStatusFilter('');
                    setVetFilter('');
                    setSearch('');
                  }}
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно создания записи */}
      {isCreateOpen && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="create-appt-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="create-appt-title">Создать запись на приём</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {createError && (
                <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle className="ic shrink-0" />
                  <span className="text-xs">{createError}</span>
                </div>
              )}

              <div className="field">
                <label className="field-label">Питомец</label>
                <select
                  className="select"
                  required
                  value={createForm.petId}
                  onChange={(e) => setCreateForm({ ...createForm, petId: e.target.value })}
                >
                  <option value="" disabled>Выберите питомца...</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender === 'MALE' ? 'самец' : 'самка'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Услуга</label>
                <select
                  className="select"
                  required
                  value={createForm.serviceId}
                  onChange={(e) => setCreateForm({ ...createForm, serviceId: e.target.value })}
                >
                  <option value="" disabled>Выберите услугу...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.basePrice ?? s.price ?? 1500} ₽, {s.baseDurationMin ?? s.durationMin ?? 30} мин)
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Врач</label>
                <select
                  className="select"
                  required
                  value={createForm.veterinarianId}
                  onChange={(e) => setCreateForm({ ...createForm, veterinarianId: e.target.value })}
                >
                  <option value="" disabled>Выберите врача...</option>
                  {veterinarians.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.user?.fullName || `Врач (${v.id.substring(0, 6)})`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Дата</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Время начала</label>
                  <input
                    type="time"
                    className="input font-mono"
                    required
                    value={createForm.time}
                    onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Комментарий клиента</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Жалобы или пожелания клиента..."
                  value={createForm.clientComment}
                  onChange={(e) => setCreateForm({ ...createForm, clientComment: e.target.value })}
                />
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Создание...' : 'Создать запись'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования записи */}
      {editingAppt && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="edit-appt-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="edit-appt-title">
                Изменить запись #{editingAppt.id.substring(0, 8)}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setEditingAppt(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleUpdateAppointment} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Статус записи</label>
                <select
                  className="select"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AppointmentStatus })}
                >
                  <option value="PENDING">Ожидает (PENDING)</option>
                  <option value="CONFIRMED">Подтверждён (CONFIRMED)</option>
                  <option value="COMPLETED">Завершён (COMPLETED)</option>
                  <option value="CANCELLED">Отменён (CANCELLED)</option>
                  <option value="NO_SHOW">Неявка (NO_SHOW)</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Лечащий врач</label>
                <select
                  className="select"
                  value={editForm.veterinarianId}
                  onChange={(e) => setEditForm({ ...editForm, veterinarianId: e.target.value })}
                >
                  {veterinarians.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.user?.fullName || `Врач (${v.id.substring(0, 6)})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Заключение / Заметки врача</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Медицинское заключение, назначенное лечение..."
                  value={editForm.vetNotes}
                  onChange={(e) => setEditForm({ ...editForm, vetNotes: e.target.value })}
                />
              </div>

              {editForm.status === 'CANCELLED' && (
                <div className="field">
                  <label className="field-label">Причина отмены</label>
                  <input
                    className="input"
                    placeholder="Укажите причину отмены..."
                    value={editForm.cancelReason}
                    onChange={(e) => setEditForm({ ...editForm, cancelReason: e.target.value })}
                  />
                </div>
              )}

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingAppt(null)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deletingId && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="del-appt-title" style={{ maxWidth: '420px' }}>
            <div className="dialog-head">
              <span className="dialog-title text-[var(--accent-red)]" id="del-appt-title">
                Удаление записи
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setDeletingId(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p className="text-sm">
                Вы действительно хотите удалить данную запись из системы?
              </p>
              <p className="text-xs muted">
                Запись будет безвозвратно удалена из базы данных клиники. Это действие нельзя отменить.
              </p>

              <div className="dialog-foot" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setDeletingId(null)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteAppointment}
                  disabled={deleting}
                >
                  <Trash2 className="ic" />
                  <span>{deleting ? 'Удаление...' : 'Удалить'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
