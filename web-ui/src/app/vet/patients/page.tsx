'use client';

import React, { useEffect, useState } from 'react';
import { vetApi, clinicApi } from '../../../api';
import { Pet, Vaccination, Appointment, Species, CreateVaccinationRequest } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  PawPrint,
  Syringe,
  Search,
  Plus,
  AlertCircle,
  Clock,
  Calendar,
  X,
  Check,
} from 'lucide-react';

export default function VetPatientsPage() {
  const [patients, setPatients] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Patient for Master-Detail panel
  const [selectedPatient, setSelectedPatient] = useState<Pet | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'vaccinations'>('overview');
  const [patientVacs, setPatientVacs] = useState<Vaccination[]>([]);

  // Modal: Add Vaccination
  const [isAddVacOpen, setIsAddVacOpen] = useState(false);
  const [vacForm, setVacForm] = useState({
    name: '',
    administeredOn: new Date().toISOString().substring(0, 10),
    nextDueOn: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
    notes: '',
  });
  const [savingVac, setSavingVac] = useState(false);
  const [vacError, setVacError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsData, apptsData, speciesData] = await Promise.all([
        vetApi.getPatients().catch(() => [] as Pet[]),
        vetApi.getAppointments(0, 100).catch(() => ({ items: [] as Appointment[] })),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);

      const safePatients = Array.isArray(patientsData) ? patientsData : [];
      const safeAppts = apptsData?.items || [];
      const safeSpecies = Array.isArray(speciesData) ? speciesData : [];

      setPatients(safePatients);
      setAppointments(safeAppts);
      setSpeciesList(safeSpecies);

      if (selectedPatient) {
        const updated = safePatients.find((p: Pet) => p.id === selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    } catch (err) {
      console.error('Failed to load vet patients data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When patient selected, load their vaccinations
  useEffect(() => {
    if (!selectedPatient) return;
    vetApi
      .getVaccinations(0, 50, selectedPatient.id)
      .then((res) => {
        setPatientVacs(res?.items || []);
      })
      .catch(() => {
        setPatientVacs([]);
      });
  }, [selectedPatient]);

  const getSpeciesName = (spId?: string) => {
    if (!spId) return '—';
    const s = speciesList.find((sp) => sp.id === spId);
    return s ? s.name : '—';
  };

  const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '—';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) return `${years} г. ${months > 0 ? `${months} м.` : ''}`.trim();
    if (months > 0) return `${months} мес.`;
    return 'Меньше месяца';
  };

  const getPatientAppointments = (petId: string) => {
    return appointments.filter((a) => a.petId === petId);
  };

  const getLastAppointment = (petId: string) => {
    const list = getPatientAppointments(petId)
      .filter((a) => new Date(a.startAt) <= new Date())
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    if (list.length === 0) return '—';
    return list[0].startAt.slice(0, 10);
  };

  const getNextAppointment = (petId: string) => {
    const list = getPatientAppointments(petId)
      .filter((a) => new Date(a.startAt) > new Date() && a.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    if (list.length === 0) return '—';
    const d = new Date(list[0].startAt);
    const today = new Date().toISOString().slice(0, 10);
    const dateStr = list[0].startAt.slice(0, 10);
    if (dateStr === today) {
      return `сегодня ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return dateStr;
  };

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !vacForm.name.trim()) return;
    setVacError(null);
    setSavingVac(true);
    try {
      const payload: CreateVaccinationRequest = {
        petId: selectedPatient.id,
        name: vacForm.name.trim(),
        administeredOn: vacForm.administeredOn,
        nextDueOn: vacForm.nextDueOn || null,
        notes: vacForm.notes.trim() || null,
      };
      await vetApi.createVaccination(payload);
      setIsAddVacOpen(false);
      setVacForm({
        name: '',
        administeredOn: new Date().toISOString().substring(0, 10),
        nextDueOn: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
        notes: '',
      });
      const res = await vetApi.getVaccinations(0, 50, selectedPatient.id);
      setPatientVacs(res?.items || []);
    } catch (err: any) {
      setVacError(err?.response?.data?.message || err?.message || 'Ошибка сохранения прививки');
    } finally {
      setSavingVac(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const pName = p.name.toLowerCase();
    const sName = getSpeciesName(p.speciesId).toLowerCase();
    return pName.includes(q) || sName.includes(q);
  });

  return (
    <AppShell crumbGroup="Пациенты" crumb="Список">
      <div className="content-row">
        {/* Left Column: Table */}
        <div className="content-col grow">
          <section className="island grow">
            <div className="island-head">
              <span className="island-title">
                <PawPrint size={18} />
                Пациенты <span className="count">{filteredPatients.length}</span>
              </span>
              <div className="input-icon" style={{ width: 260 }}>
                <Search size={14} className="ic" />
                <input
                  type="text"
                  className="input input-sm"
                  placeholder="Кличка…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="row" style={{ padding: '0 16px 10px' }}>
              <span className="dev-note">
                Отдельного списка пациентов в API нет — список собран из уникальных petId ваших записей
              </span>
            </div>

            <div className="table-wrap">
              <div
                className="dtable keep-table"
                style={
                  {
                    '--cols': '1.3fr 0.8fr 0.8fr 1.1fr 1.1fr 0.6fr',
                    minWidth: '720px',
                  } as React.CSSProperties
                }
              >
                <div className="thead">
                  <span>Пациент</span>
                  <span>Вид</span>
                  <span>Возраст</span>
                  <span>Последний приём</span>
                  <span>Следующий</span>
                  <span className="right">Приёмов</span>
                </div>

                {filteredPatients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  const age = calculateAge(p.birthDate);
                  const last = getLastAppointment(p.id);
                  const next = getNextAppointment(p.id);
                  const count = getPatientAppointments(p.id).length;

                  return (
                    <button
                      key={p.id}
                      className={`trow ${isSelected ? 'sel' : ''}`}
                      onClick={() => setSelectedPatient(p)}
                    >
                      <span className="row" style={{ gap: 10 }}>
                        <span className={`t-ava sm tone-${p.speciesId}`}>
                          <PawPrint size={14} />
                        </span>
                        <span className="cell-main">{p.name}</span>
                        {p.isArchived && <span className="badge">Архив</span>}
                      </span>
                      <span>{getSpeciesName(p.speciesId)}</span>
                      <span className="tnum">{age}</span>
                      <span className="tnum">{last}</span>
                      <span className="tnum">
                        {next.startsWith('сегодня') ? (
                          <span className="t-badge tone-prev">{next}</span>
                        ) : (
                          next
                        )}
                      </span>
                      <span className="right tnum">{count}</span>
                    </button>
                  );
                })}
              </div>

              {filteredPatients.length === 0 && !loading && (
                <div className="empty">
                  <span className="empty-title">Пациент не найден</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Master-Detail Island (460px) */}
        {selectedPatient && (
          <section className="island detail-island" style={{ width: 460 }} aria-label="Карточка пациента">
            <div className="island-head">
              <div className="row">
                <span className="pet-ava">
                  <PawPrint size={20} />
                </span>
                <div className="col" style={{ gap: 0 }}>
                  <span className="h2">{selectedPatient.name}</span>
                  <span className="cell-sub">
                    {getSpeciesName(selectedPatient.speciesId)} ·{' '}
                    {selectedPatient.gender === 'MALE' ? 'Самец' : 'Самка'} ·{' '}
                    {calculateAge(selectedPatient.birthDate)}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => setSelectedPatient(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="tabs-line" role="tablist">
              <button
                className={`tab-line ${activeTab === 'overview' ? 'on' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Обзор
              </button>
              <button
                className={`tab-line ${activeTab === 'appointments' ? 'on' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                Приёмы у меня{' '}
                <span className="small muted">
                  {getPatientAppointments(selectedPatient.id).length}
                </span>
              </button>
              <button
                className={`tab-line ${activeTab === 'vaccinations' ? 'on' : ''}`}
                onClick={() => setActiveTab('vaccinations')}
              >
                Прививки <span className="small muted">{patientVacs.length}</span>
              </button>
            </div>

            <div className="island-body" style={{ paddingTop: 14 }}>
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="col" style={{ gap: 14 }}>
                  <dl className="kv" style={{ margin: 0 }}>
                    <dt>Вид</dt>
                    <dd>{getSpeciesName(selectedPatient.speciesId)}</dd>
                    <dt>Пол</dt>
                    <dd>{selectedPatient.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
                    <dt>Дата рождения</dt>
                    <dd className="tnum">{selectedPatient.birthDate || 'Не указана'}</dd>
                    <dt>Вес</dt>
                    <dd className="tnum">
                      {selectedPatient.weightKg != null
                        ? `${String(selectedPatient.weightKg).replace('.', ',')} кг`
                        : '—'}
                    </dd>
                    <dt>Заметки</dt>
                    <dd>{selectedPatient.notes || '—'}</dd>
                  </dl>

                  <span className="small muted">Контакты владельца врачу недоступны.</span>

                  <button
                    className="btn btn-outline"
                    onClick={() => setIsAddVacOpen(true)}
                  >
                    <Syringe size={14} />
                    Внести прививку
                  </button>
                </div>
              )}

              {/* Tab 2: My Appointments */}
              {activeTab === 'appointments' && (
                <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
                  {getPatientAppointments(selectedPatient.id).map((a) => {
                    const d = new Date(a.startAt);
                    const dd = d.getDate();
                    const mon = d.toLocaleDateString('ru-RU', { month: 'short' });
                    const time = d.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={a.id} className="lrow">
                        <span className="datebox">
                          <b>{dd}</b>
                          <span>{mon}</span>
                        </span>
                        <span className="col" style={{ gap: 1 }}>
                          <span className="cell-main">{a.service?.name || 'Приём'}</span>
                          <span className="cell-sub">
                            {time} · {a.priceSnapshot || a.price || 0} ₽
                          </span>
                        </span>
                        <span className={`badge st badge-${a.status}`}>{a.status}</span>
                      </div>
                    );
                  })}

                  {getPatientAppointments(selectedPatient.id).length === 0 && (
                    <div className="empty" style={{ padding: 24 }}>
                      Приёмов нет
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Vaccinations */}
              {activeTab === 'vaccinations' && (
                <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
                  {patientVacs.map((v) => (
                    <div key={v.id} className="lrow">
                      <span
                        className="pet-ava"
                        style={{ width: 36, height: 36, borderRadius: 10 }}
                      >
                        <Syringe size={16} />
                      </span>
                      <span className="col" style={{ gap: 1 }}>
                        <span className="cell-main">{v.name}</span>
                        <span className="cell-sub">Введена {v.administeredOn}</span>
                      </span>
                      {v.nextDueOn && (
                        <span className="badge badge-accent">до {v.nextDueOn}</span>
                      )}
                    </div>
                  ))}

                  {patientVacs.length === 0 && (
                    <div className="empty" style={{ padding: 24 }}>
                      Прививок нет
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Modal: Add Vaccination */}
      {isAddVacOpen && selectedPatient && (
        <div
          className="overlay"
          onClick={() => setIsAddVacOpen(false)}
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
            style={{ width: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Внести прививку</span>
              <span className="dialog-desc">Запись вакцинации для «{selectedPatient.name}»</span>
            </div>

            <form onSubmit={handleAddVaccination} className="col" style={{ gap: 14 }}>
              <div className="field">
                <label className="field-label" htmlFor="vet-vac-name">
                  Название вакцины <span className="req">*</span>
                </label>
                <input
                  id="vet-vac-name"
                  className="input"
                  placeholder="Нобивак DHPPi…"
                  value={vacForm.name}
                  onChange={(e) => setVacForm({ ...vacForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="vet-vac-adm">
                    Дата введения <span className="req">*</span>
                  </label>
                  <input
                    id="vet-vac-adm"
                    type="date"
                    className="input"
                    value={vacForm.administeredOn}
                    onChange={(e) =>
                      setVacForm({ ...vacForm, administeredOn: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="vet-vac-due">
                    Следующая дата
                  </label>
                  <input
                    id="vet-vac-due"
                    type="date"
                    className="input"
                    value={vacForm.nextDueOn}
                    onChange={(e) => setVacForm({ ...vacForm, nextDueOn: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="vet-vac-notes">
                  Заметки
                </label>
                <textarea
                  id="vet-vac-notes"
                  className="textarea"
                  rows={2}
                  value={vacForm.notes}
                  onChange={(e) => setVacForm({ ...vacForm, notes: e.target.value })}
                />
              </div>

              {vacError && (
                <div className="alert" role="alert">
                  <AlertCircle size={16} />
                  <div>{vacError}</div>
                </div>
              )}

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddVacOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingVac}
                >
                  {savingVac ? 'Сохранение…' : 'Внести'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
