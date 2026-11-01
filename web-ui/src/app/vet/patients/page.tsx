'use client';

import React, { useEffect, useState } from 'react';
import { vetApi } from '../../../api';
import { Pet, Vaccination, CreateVaccinationRequest } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { Modal } from '../../../components/ui/Modal';
import {
  PawPrint,
  Syringe,
  Search,
  Plus,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
} from 'lucide-react';

export default function VetPatientsPage() {
  const [patients, setPatients] = useState<Pet[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Модальное окно внесения вакцинации
  const [selectedPetForVac, setSelectedPetForVac] = useState<Pet | null>(null);
  const [vacForm, setVacForm] = useState({
    name: '',
    administeredOn: new Date().toISOString().split('T')[0],
    nextDueOn: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    notes: '',
  });
  const [savingVac, setSavingVac] = useState(false);
  const [vacError, setVacError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([vetApi.getPatients(), vetApi.getVaccinations(0, 100)])
      .then(([patientsData, vacsData]) => {
        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setVaccinations(vacsData?.items ?? (Array.isArray(vacsData) ? vacsData : []));
      })
      .catch((err) => {
        console.error(err);
        setPatients([]);
        setVaccinations([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetForVac) return;
    setVacError(null);

    if (!vacForm.name.trim()) {
      setVacError('Укажите название вакцины');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (vacForm.administeredOn > today) {
      setVacError('Дата вакцинации не может быть в будущем');
      return;
    }

    setSavingVac(true);
    try {
      const payload: CreateVaccinationRequest = {
        petId: selectedPetForVac.id,
        name: vacForm.name.trim(),
        administeredOn: vacForm.administeredOn,
        nextDueOn: vacForm.nextDueOn || null,
        notes: vacForm.notes.trim() || null,
      };

      await vetApi.createVaccination(payload);
      setSelectedPetForVac(null);
      setVacForm({
        name: '',
        administeredOn: today,
        nextDueOn: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setVacError(err?.message || 'Не удалось сохранить запись вакцинации');
    } finally {
      setSavingVac(false);
    }
  };

  const filteredPatients = patients.filter((pet) => {
    const q = search.toLowerCase();
    const nameMatch = pet.name.toLowerCase().includes(q);
    const specMatch = pet.species?.name?.toLowerCase().includes(q);
    return nameMatch || specMatch;
  });

  return (
    <AppShell
      title="Пациенты клиники"
      subtitle="Электронные карты, история вакцинаций и анамнез"
    >
      <div className="flex flex-col gap-2 p-1">
        {/* Шапка и поиск по пациентам */}
        <section className="island p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-[var(--primary-text)]" />
              <h2 className="text-sm font-bold">Картотека пациентов</h2>
              <span className="badge text-[10px] font-mono">{patients.length}</span>
            </div>

            <div className="w-full sm:w-72 input-icon" style={{ position: 'relative' }}>
              <Search className="ic" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Поиск по кличке или виду..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input text-xs"
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
              Загрузка картотеки...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
              Пациенты не найдены
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPatients.map((pet) => {
                const petVacs = vaccinations.filter((v) => v.petId === pet.id);
                const today = new Date().toISOString().split('T')[0];
                const hasOverdue = petVacs.some((v) => v.nextDueOn && v.nextDueOn <= today);

                return (
                  <div
                    key={pet.id}
                    className="card p-5 flex flex-col justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)]"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/15 text-[var(--primary-text)] flex items-center justify-center font-bold text-base shrink-0">
                            {pet.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{pet.name}</h3>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {pet.species?.name || 'Вид не указан'}
                            </span>
                          </div>
                        </div>

                        {pet.isArchived && (
                          <span className="badge badge-CANCELLED text-[10px]">В архиве</span>
                        )}
                      </div>

                      <div className="p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] text-xs flex flex-col gap-1.5">
                        <div className="flex justify-between text-[var(--muted-foreground)]">
                          <span>Пол:</span>
                          <span className="font-medium text-[var(--foreground)]">
                            {pet.gender === 'MALE' ? 'Самец' : 'Самка'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[var(--muted-foreground)]">
                          <span>Вес:</span>
                          <span className="font-mono text-[var(--foreground)]">
                            {pet.weightKg ? `${pet.weightKg} кг` : '—'}
                          </span>
                        </div>
                        {pet.birthDate && (
                          <div className="flex justify-between text-[var(--muted-foreground)]">
                            <span>Дата рождения:</span>
                            <span className="font-mono text-[var(--foreground)]">{pet.birthDate}</span>
                          </div>
                        )}
                        {pet.notes && (
                          <div className="pt-1 border-t border-[var(--border)]/60 text-[11px] text-[var(--muted-foreground)] italic">
                            {pet.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] text-xs">
                      {hasOverdue ? (
                        <span className="badge due-over text-[10px]">Нужна прививка</span>
                      ) : petVacs.length > 0 ? (
                        <span className="badge due-later text-[10px]">{petVacs.length} вакцин</span>
                      ) : (
                        <span className="badge text-[10px]">Нет записей</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedPetForVac(pet)}
                        className="btn btn-outline h-7 px-3 text-xs flex items-center gap-1.5"
                      >
                        <Syringe className="w-3.5 h-3.5 text-teal-500" />
                        <span>Вакцинация</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно внесения вакцинации */}
      <Modal
        isOpen={!!selectedPetForVac}
        onClose={() => setSelectedPetForVac(null)}
        title={`Вакцинация: ${selectedPetForVac?.name || ''}`}
        description="Внесите запись о сделанной прививке в ветеринарный паспорт"
      >
        <form onSubmit={handleAddVaccination} className="flex flex-col gap-3 text-xs">
          {vacError && (
            <div className="alert p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{vacError}</span>
            </div>
          )}

          <div className="field">
            <label className="field-label text-xs">
              Наименование вакцины <span className="req">*</span>
            </label>
            <input
              type="text"
              required
              value={vacForm.name}
              onChange={(e) => setVacForm({ ...vacForm, name: e.target.value })}
              placeholder="Например: Нобивак DHPPi + Рабиес"
              className="input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="field">
              <label className="field-label text-xs">
                Дата введения <span className="req">*</span>
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={vacForm.administeredOn}
                onChange={(e) => setVacForm({ ...vacForm, administeredOn: e.target.value })}
                className="input text-xs font-mono"
              />
            </div>

            <div className="field">
              <label className="field-label text-xs">Дата ревакцинации</label>
              <input
                type="date"
                value={vacForm.nextDueOn}
                onChange={(e) => setVacForm({ ...vacForm, nextDueOn: e.target.value })}
                className="input text-xs font-mono"
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label text-xs">Серия / Заметки</label>
            <textarea
              rows={2}
              value={vacForm.notes}
              onChange={(e) => setVacForm({ ...vacForm, notes: e.target.value })}
              placeholder="Серия препарата, реакция питомца..."
              className="textarea text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              className="btn btn-ghost h-8 px-3 text-xs"
              onClick={() => setSelectedPetForVac(null)}
            >
              Отмена
            </button>
            <button type="submit" disabled={savingVac} className="btn btn-primary h-8 px-4 text-xs">
              {savingVac ? 'Сохранение...' : 'Записать в паспорт'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
