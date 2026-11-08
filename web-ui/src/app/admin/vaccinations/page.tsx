'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api';
import { Vaccination, Pet } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Syringe,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  Trash2,
  Edit2,
  X,
  PawPrint,
  Save,
} from 'lucide-react';

export default function AdminVaccinationsPage() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'soon' | 'ok'>('all');

  // Модальное окно создания / редактирования
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [form, setForm] = useState({
    petId: '',
    name: '',
    administeredOn: new Date().toISOString().split('T')[0],
    nextDueOn: '',
    batchNumber: '',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [vaxRes, petsRes] = await Promise.all([
        adminApi.getVaccinations(undefined, 0, 100),
        adminApi.getPets(0, 100),
      ]);

      const vaxItems = Array.isArray(vaxRes) ? vaxRes : (vaxRes as any)?.items || [];
      const petItems = Array.isArray(petsRes) ? petsRes : (petsRes as any)?.items || [];

      setVaccinations(vaxItems);
      setPets(petItems);
    } catch (err) {
      console.error('Failed to load vaccinations or pets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const petMap = new Map<string, Pet>();
  pets.forEach((p) => petMap.set(p.id, p));

  const calculateStatus = (nextDueStr?: string | null) => {
    if (!nextDueStr) return { label: 'Выполнено', cls: 'badge-accent', tone: 'ok' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextDueStr);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Просрочена', cls: 'badge-danger', tone: 'overdue' };
    }
    if (diffDays <= 30) {
      return {
        label: diffDays === 0 ? 'Сегодня' : `Через ${diffDays} дн.`,
        cls: 'badge-warn',
        tone: 'soon',
      };
    }
    const months = Math.round(diffDays / 30);
    return {
      label: `Через ${months} мес.`,
      cls: 'badge-accent',
      tone: 'ok',
    };
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      petId: pets[0]?.id || '',
      name: '',
      administeredOn: new Date().toISOString().split('T')[0],
      nextDueOn: '',
      batchNumber: '',
      notes: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vaccination) => {
    setEditingId(v.id);
    setForm({
      petId: v.petId,
      name: v.name || v.vaccineName || '',
      administeredOn: v.administeredOn || v.administeredAt || '',
      nextDueOn: v.nextDueOn || v.validUntil || '',
      batchNumber: v.batchNumber || '',
      notes: v.notes || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.petId) {
      setModalError('Выберите питомца');
      return;
    }
    if (!form.name.trim()) {
      setModalError('Укажите название вакцины');
      return;
    }
    if (!form.administeredOn) {
      setModalError('Укажите дату введения');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      if (editingId) {
        await adminApi.updateVaccination(editingId, {
          name: form.name.trim(),
          administeredOn: form.administeredOn,
          nextDueOn: form.nextDueOn || undefined,
        });
      } else {
        await adminApi.createVaccination({
          petId: form.petId,
          name: form.name.trim(),
          administeredOn: form.administeredOn,
          nextDueOn: form.nextDueOn || null,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Не удалось сохранить запись о вакцинации');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись о вакцинации?')) return;
    try {
      await adminApi.deleteVaccination(id);
      setVaccinations((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Ошибка при удалении');
    }
  };

  // Фильтрация
  const filteredVaccinations = vaccinations.filter((v) => {
    const pet = petMap.get(v.petId);
    const petName = pet?.name || '';
    const vaxName = v.name || v.vaccineName || '';
    const matchesSearch =
      petName.toLowerCase().includes(search.toLowerCase()) ||
      vaxName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter !== 'all') {
      const status = calculateStatus(v.nextDueOn || v.validUntil);
      if (status.tone !== statusFilter) return false;
    }

    return true;
  });

  const overdueTotal = vaccinations.filter(
    (v) => calculateStatus(v.nextDueOn || v.validUntil).tone === 'overdue'
  ).length;
  const soonTotal = vaccinations.filter(
    (v) => calculateStatus(v.nextDueOn || v.validUntil).tone === 'soon'
  ).length;

  return (
    <AppShell crumbGroup="Клиника" crumb="Прививки">
      <div className="content-col grow">
        {/* Верхняя аналитическая панель */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <span className="small muted">Всего записей в реестре</span>
            <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
              <span className="title-md font-mono">{vaccinations.length}</span>
              <Syringe className="ic muted" style={{ width: '20px', height: '20px' }} />
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <span className="small muted">Просрочено</span>
            <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
              <span className="title-md font-mono" style={{ color: overdueTotal > 0 ? '#ef4444' : undefined }}>
                {overdueTotal}
              </span>
              <AlertTriangle className="ic" style={{ width: '20px', height: '20px', color: overdueTotal > 0 ? '#ef4444' : 'var(--muted-foreground)' }} />
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <span className="small muted">Срок в ближайшие 30 дней</span>
            <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
              <span className="title-md font-mono" style={{ color: soonTotal > 0 ? '#f59e0b' : undefined }}>
                {soonTotal}
              </span>
              <Clock className="ic" style={{ width: '20px', height: '20px', color: soonTotal > 0 ? '#f59e0b' : 'var(--muted-foreground)' }} />
            </div>
          </div>
        </div>

        {/* Панель фильтров и действий */}
        <section className="island filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '14px' }}>
          <div className="field" style={{ minWidth: '220px', flex: 1 }}>
            <label className="field-label" htmlFor="vx-search">
              Поиск вакцины или питомца
            </label>
            <div className="input-icon">
              <Search className="ic" />
              <input
                id="vx-search"
                className="input"
                placeholder="Поиск по названию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Статус ревакцинации</label>
            <div className="seg" role="tablist">
              <button
                type="button"
                className={`seg-item ${statusFilter === 'all' ? 'on font-semibold' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Все
              </button>
              <button
                type="button"
                className={`seg-item ${statusFilter === 'overdue' ? 'on font-semibold' : ''}`}
                onClick={() => setStatusFilter('overdue')}
              >
                Просрочено
              </button>
              <button
                type="button"
                className={`seg-item ${statusFilter === 'soon' ? 'on font-semibold' : ''}`}
                onClick={() => setStatusFilter('soon')}
              >
                Скоро
              </button>
              <button
                type="button"
                className={`seg-item ${statusFilter === 'ok' ? 'on font-semibold' : ''}`}
                onClick={() => setStatusFilter('ok')}
              >
                В норме
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus className="ic" style={{ width: '16px', height: '16px' }} />
            <span>Вакцинация</span>
          </button>
        </section>

        {/* Таблица записей вакцинации */}
        <section className="island grow">
          <div className="island-head">
            <span className="island-title">
              <Syringe className="ic" />
              Вакцинации
              <span className="count">Найдено: {filteredVaccinations.length}</span>
            </span>
          </div>

          <div className="table-wrap">
            <div className="dtable" style={{ '--cols': '1.4fr 1.6fr 1fr 1fr 1fr 80px', minWidth: '760px' } as any}>
              <div className="thead">
                <span>Питомец</span>
                <span>Вакцина</span>
                <span>Введено</span>
                <span>Следующая</span>
                <span>Срок</span>
                <span></span>
              </div>

              {loading ? (
                <div style={{ padding: '36px', textAlign: 'center', gridColumn: '1 / -1' }} className="muted text-xs">
                  Загрузка данных реестра...
                </div>
              ) : filteredVaccinations.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', gridColumn: '1 / -1' }} className="muted text-xs">
                  Записей по заданным критериям не найдено
                </div>
              ) : (
                filteredVaccinations.map((v) => {
                  const pet = petMap.get(v.petId);
                  const petName = pet?.name || 'Питомец';
                  const vaxName = v.name || v.vaccineName || 'Вакцинация';
                  const adminDate = v.administeredOn || v.administeredAt || '—';
                  const nextDue = v.nextDueOn || v.validUntil;
                  const status = calculateStatus(nextDue);

                  return (
                    <div key={v.id} className="trow static">
                      <span className="pet-cell">
                        <span className="avatar sm font-bold bg-[var(--primary)] text-[var(--primary-foreground)]">
                          {petName.charAt(0).toUpperCase()}
                        </span>
                        <span className="cell-main">{petName}</span>
                      </span>

                      <span className="font-semibold">{vaxName}</span>
                      <span className="tnum font-mono">{adminDate}</span>
                      <span className="tnum font-mono">{nextDue || '—'}</span>

                      <span>
                        <span className={`badge ${status.cls}`}>{status.label}</span>
                      </span>

                      <span className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleOpenEdit(v)}
                          title="Редактировать"
                        >
                          <Edit2 className="ic" style={{ width: '13px', height: '13px' }} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleDelete(v.id)}
                          title="Удалить"
                          style={{ color: 'var(--destructive)' }}
                        >
                          <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                        </button>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Модальное окно создания / редактирования */}
        {isModalOpen && (
          <div className="overlay" onClick={() => setIsModalOpen(false)}>
            <div
              className="dialog"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '480px', width: '100%' }}
            >
              <div className="dialog-head">
                <span className="dialog-title">
                  {editingId ? 'Редактирование вакцинации' : 'Новая запись о вакцинации'}
                </span>
                <span className="dialog-desc">
                  Внесение данных о введённом биопрепарате в электронный паспорт питомца
                </span>
              </div>

              {modalError && (
                <div
                  className="alert"
                  style={{
                    margin: '16px 20px 0',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: '12px',
                  }}
                >
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="dialog-body col" style={{ gap: '12px' }}>
                  <div className="field">
                    <label className="field-label" htmlFor="m-pet">
                      Питомец <span className="req">*</span>
                    </label>
                    <select
                      id="m-pet"
                      className="select"
                      value={form.petId}
                      onChange={(e) => setForm({ ...form, petId: e.target.value })}
                      disabled={!!editingId}
                      required
                    >
                      <option value="">Выберите питомца...</option>
                      {pets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.species?.name || 'Питомец'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="m-name">
                      Название вакцины <span className="req">*</span>
                    </label>
                    <input
                      id="m-name"
                      className="input"
                      placeholder="Например, Нобивак DHPPi + L"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="field">
                      <label className="field-label" htmlFor="m-date">
                        Дата введения <span className="req">*</span>
                      </label>
                      <input
                        id="m-date"
                        type="date"
                        className="input"
                        value={form.administeredOn}
                        onChange={(e) => setForm({ ...form, administeredOn: e.target.value })}
                        required
                      />
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="m-next">
                        Следующая доза
                      </label>
                      <input
                        id="m-next"
                        type="date"
                        className="input"
                        value={form.nextDueOn}
                        onChange={(e) => setForm({ ...form, nextDueOn: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="m-batch">
                      Серия партии (опционально)
                    </label>
                    <input
                      id="m-batch"
                      className="input"
                      placeholder="Номер серии вакцины"
                      value={form.batchNumber}
                      onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="dialog-foot">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Добавить вакцинацию'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
