'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientApi, clinicApi } from '../../../api';
import { Pet, Species, Gender, CreatePetRequest, Vaccination } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { Modal } from '../../../components/ui/Modal';
import {
  PawPrint,
  Plus,
  Edit2,
  Trash2,
  Syringe,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CalendarPlus,
  Clock,
} from 'lucide-react';

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояние модальных окон
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [selectedPetForVac, setSelectedPetForVac] = useState<Pet | null>(null);

  // Состояние полей формы
  const [formData, setFormData] = useState<{
    name: string;
    speciesId: string;
    gender: Gender;
    birthDate: string;
    weightKg: string;
    notes: string;
  }>({
    name: '',
    speciesId: '',
    gender: 'MALE',
    birthDate: '',
    weightKg: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [petsData, speciesData] = await Promise.all([
        clientApi.getPets(),
        clinicApi.getSpecies(),
      ]);

      const safePets: Pet[] = Array.isArray(petsData) ? petsData : [];
      setPets(safePets);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);

      if (safePets.length > 0) {
        const vacResults = await Promise.all(
          safePets.map((p: Pet) => clientApi.getVaccinations(p.id).catch(() => []))
        );
        setVaccinations(vacResults.flat());
      } else {
        setVaccinations([]);
      }
    } catch (err) {
      console.error(err);
      setPets([]);
      setVaccinations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingPet(null);
    setFormError(null);
    setFormData({
      name: '',
      speciesId: speciesList[0]?.id || '',
      gender: 'MALE',
      birthDate: '',
      weightKg: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pet: Pet) => {
    setEditingPet(pet);
    setFormError(null);
    setFormData({
      name: pet.name,
      speciesId: pet.speciesId,
      gender: pet.gender,
      birthDate: pet.birthDate || '',
      weightKg: pet.weightKg ? pet.weightKg.toString() : '',
      notes: pet.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError('Укажите кличку питомца');
      return;
    }
    if (!formData.speciesId) {
      setFormError('Выберите вид животного');
      return;
    }

    setSaving(true);
    try {
      const payload: CreatePetRequest = {
        name: formData.name.trim(),
        speciesId: formData.speciesId,
        gender: formData.gender,
        birthDate: formData.birthDate || null,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        notes: formData.notes.trim() || null,
      };

      if (editingPet) {
        await clientApi.updatePet(editingPet.id, payload);
      } else {
        await clientApi.createPet(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Не удалось сохранить питомца');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить карточку питомца?')) return;
    try {
      await clientApi.deletePet(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const petVaccinations = selectedPetForVac
    ? vaccinations.filter((v) => v.petId === selectedPetForVac.id)
    : [];

  return (
    <AppShell
      title="Мои питомцы"
      subtitle="Электронные ветеринарные карты и история прививок"
      actions={
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="btn btn-primary h-8 px-3 text-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Добавить питомца</span>
        </button>
      }
    >
      <div className="flex flex-col gap-2 p-1">
        {/* Список питомцев клиента */}
        <section className="island p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-[var(--primary-text)]" />
              <h2 className="text-sm font-bold">Карточки питомцев</h2>
              <span className="badge text-[10px] font-mono">{pets.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
              Загрузка питомцев...
            </div>
          ) : pets.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)] flex flex-col items-center gap-3">
              <PawPrint className="w-10 h-10 opacity-20" />
              <span>У вас пока нет зарегистрированных питомцев</span>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="btn btn-primary h-8 px-4 text-xs mt-1"
              >
                + Зарегистрировать первого питомца
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pets.map((pet) => {
                const specName = speciesList.find((s) => s.id === pet.speciesId)?.name || 'Питомец';
                const petVacs = vaccinations.filter((v) => v.petId === pet.id);
                const today = new Date().toISOString().substring(0, 10);
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
                            <h3 className="font-bold text-sm text-[var(--foreground)]">{pet.name}</h3>
                            <span className="text-xs text-[var(--muted-foreground)]">{specName}</span>
                          </div>
                        </div>

                        {pet.isArchived && (
                          <span className="badge badge-CANCELLED text-[10px]">В архиве</span>
                        )}
                      </div>

                      {/* Детальная информация о питомце */}
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

                    {/* Панель действий */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPetForVac(pet)}
                        className="btn btn-outline h-7 px-2.5 text-[11px] flex items-center gap-1.5"
                      >
                        <Syringe className="w-3.5 h-3.5 text-teal-500" />
                        <span>Прививки ({petVacs.length})</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/client/book?petId=${pet.id}`}
                          className="btn btn-primary h-7 px-2.5 text-[11px] flex items-center gap-1"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>Запись</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(pet)}
                          className="btn btn-ghost btn-icon h-7 w-7 text-[var(--muted-foreground)]"
                          title="Редактировать"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pet.id)}
                          className="btn btn-ghost btn-icon h-7 w-7 text-rose-500 hover:bg-rose-500/10"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно добавления / редактирования питомца */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPet ? 'Редактирование питомца' : 'Добавление питомца'}
        description="Заполните информацию о вашем питомце для оформления медицинской карты"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {formError && (
            <div className="alert p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="field">
            <label className="field-label text-xs">
              Кличка <span className="req">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Барсик"
              className="input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="field">
              <label className="field-label text-xs">
                Вид животного <span className="req">*</span>
              </label>
              <select
                value={formData.speciesId}
                onChange={(e) => setFormData({ ...formData, speciesId: e.target.value })}
                className="select text-xs"
              >
                {speciesList.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label text-xs">Пол</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="select text-xs"
              >
                <option value="MALE">Самец</option>
                <option value="FEMALE">Самка</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="field">
              <label className="field-label text-xs">Дата рождения</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="input text-xs"
              />
            </div>

            <div className="field">
              <label className="field-label text-xs">Вес (кг)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                placeholder="4.5"
                className="input text-xs font-mono"
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label text-xs">Особые приметы или аллергии</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Аллергия на курицу, пуглив..."
              className="textarea text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              className="btn btn-ghost h-8 px-3 text-xs"
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary h-8 px-4 text-xs">
              {saving ? 'Сохранение...' : editingPet ? 'Сохранить изменения' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно паспорта вакцинаций */}
      <Modal
        isOpen={!!selectedPetForVac}
        onClose={() => setSelectedPetForVac(null)}
        title={`Ветеринарный паспорт: ${selectedPetForVac?.name || ''}`}
        description="История прививок питомца и контроль сроков ревакцинации"
      >
        <div className="flex flex-col gap-4">
          {petVaccinations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted-foreground)] flex flex-col items-center gap-2 bg-[var(--muted)]/40 rounded-xl p-4">
              <Syringe className="w-8 h-8 opacity-25" />
              <span>Записей о вакцинации для этого питомца пока нет</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {petVaccinations.map((vac) => {
                const today = new Date().toISOString().substring(0, 10);
                const isOverdue = vac.nextDueOn && vac.nextDueOn <= today;

                return (
                  <div
                    key={vac.id}
                    className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-xs">{vac.name || vac.vaccineName}</span>
                      <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-3">
                        <span>Введено: {vac.administeredOn || vac.administeredAt || '—'}</span>
                        {vac.nextDueOn && <span>Повторить: {vac.nextDueOn}</span>}
                      </div>
                    </div>

                    {vac.nextDueOn && (
                      <span
                        className={`badge text-[10px] ${
                          isOverdue ? 'due-over' : 'due-later'
                        }`}
                      >
                        {isOverdue ? 'Просрочена' : 'Действует'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              className="btn btn-outline h-8 px-4 text-xs"
              onClick={() => setSelectedPetForVac(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
