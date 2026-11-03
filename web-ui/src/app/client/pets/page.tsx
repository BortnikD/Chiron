'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { clientApi, clinicApi } from '../../../api';
import { Pet, Species, Gender, Vaccination, Appointment } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { SpeciesIcon } from '../../../components/ui/SpeciesIcon';
import {
  PawPrint,
  Plus,
  Pencil,
  Trash2,
  Syringe,
  Calendar,
  CalendarPlus,
  Archive,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';

function PetsContent() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get('action');

  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтр по архиву: ACTIVE | ARCHIVED | ALL
  const [archiveFilter, setArchiveFilter] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ACTIVE');

  // Выбранный питомец для бокового острова детального просмотра
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'APPTS' | 'VACC'>('OVERVIEW');

  // Диалог создания/редактирования
  const [isDlgOpen, setIsDlgOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [dlgError, setDlgError] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formSpeciesId, setFormSpeciesId] = useState('');
  const [formGender, setFormGender] = useState<Gender>('MALE');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formWeightKg, setFormWeightKg] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [petsData, speciesData, apptsData] = await Promise.all([
        clientApi.getPets(),
        clinicApi.getSpecies(),
        clientApi.getAppointments(0, 50),
      ]);

      const safePets: Pet[] = Array.isArray(petsData) ? petsData : [];
      setPets(safePets);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      setAppointments(apptsData?.items ?? (Array.isArray(apptsData) ? apptsData : []));

      if (safePets.length > 0) {
        const vacResults = await Promise.all(
          safePets.map((p) => clientApi.getVaccinations(p.id).catch(() => []))
        );
        setVaccinations(vacResults.flat());
        if (!selectedPet && typeof window !== 'undefined' && window.innerWidth >= 1280) {
          setSelectedPet(safePets[0]);
        }
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
    if (actionParam === 'create') {
      openCreate();
    }
  }, [actionParam, speciesList]);

  const speciesMap = useMemo(() => {
    const map: Record<string, string> = {};
    speciesList.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [speciesList]);

  const getSpeciesTone = (speciesId?: string) => {
    const spName = speciesId ? speciesMap[speciesId] || '' : '';
    const norm = spName.toLowerCase();
    if (norm.includes('соб') || norm.includes('dog')) return 'dog';
    if (norm.includes('крол')) return 'rab';
    if (norm.includes('попуг') || norm.includes('птиц')) return 'par';
    return 'cat';
  };

  const getPetAge = (birthDate?: string | null) => {
    if (!birthDate) return 'возраст не указан';
    const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 86400000));
    if (years <= 0) return 'до года';
    if (years === 1) return '1 год';
    if (years < 5) return `${years} года`;
    return `${years} лет`;
  };

  const openCreate = () => {
    setEditingPet(null);
    setFormName('');
    setFormSpeciesId(speciesList[0]?.id || '');
    setFormGender('MALE');
    setFormBirthDate('');
    setFormWeightKg('');
    setFormNotes('');
    setDlgError(null);
    setIsDlgOpen(true);
  };

  const openEdit = (p: Pet) => {
    setEditingPet(p);
    setFormName(p.name);
    setFormSpeciesId(p.speciesId);
    setFormGender(p.gender);
    setFormBirthDate(p.birthDate ? p.birthDate.split('T')[0] : '');
    setFormWeightKg(p.weightKg ? String(p.weightKg) : '');
    setFormNotes(p.notes || '');
    setDlgError(null);
    setIsDlgOpen(true);
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setDlgError('Укажите кличку питомца');
      return;
    }
    if (!formSpeciesId) {
      setDlgError('Выберите вид животного');
      return;
    }

    setSaving(true);
    setDlgError(null);

    const payload = {
      name: formName.trim(),
      speciesId: formSpeciesId,
      gender: formGender,
      birthDate: formBirthDate || undefined,
      weightKg: formWeightKg ? parseFloat(formWeightKg) : undefined,
      notes: formNotes.trim() || undefined,
    };

    try {
      if (editingPet) {
        await clientApi.updatePet(editingPet.id, payload);
      } else {
        await clientApi.createPet(payload);
      }
      setIsDlgOpen(false);
      await loadAll();
    } catch (err: any) {
      setDlgError(err?.message || 'Не удалось сохранить данные питомца');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async (pet: Pet) => {
    try {
      await clientApi.updatePet(pet.id, { isArchived: !pet.isArchived });
      await loadAll();
      if (selectedPet?.id === pet.id) {
        setSelectedPet((prev) => (prev ? { ...prev, isArchived: !prev.isArchived } : null));
      }
    } catch (err: any) {
      alert(err?.message || 'Ошибка изменения статуса архива');
    }
  };

  const handleDeletePet = async (pet: Pet) => {
    if (!confirm(`Вы действительно хотите удалить профиль питомца ${pet.name}?`)) return;
    try {
      await clientApi.deletePet(pet.id);
      if (selectedPet?.id === pet.id) setSelectedPet(null);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || 'Не удалось удалить питомца');
    }
  };

  const filteredPets = pets.filter((p) => {
    if (archiveFilter === 'ACTIVE') return !p.isArchived;
    if (archiveFilter === 'ARCHIVED') return p.isArchived;
    return true;
  });

  const petAppts = selectedPet ? appointments.filter((a) => a.petId === selectedPet.id) : [];
  const petVaccs = selectedPet ? vaccinations.filter((v) => v.petId === selectedPet.id) : [];

  return (
    <AppShell title="Мои питомцы" currentSection="Питомцы">
      <div className="content-row">
        {/* Левая колонка: Список карточек питомцев */}
        <section className="island grow">
          <div className="island-head">
            <span className="island-title">
              <PawPrint className="ic" />
              Питомцы <span className="count">{filteredPets.length}</span>
            </span>

            <div className="row wrap" style={{ gap: '8px' }}>
              <div className="seg" role="group" aria-label="Фильтр по архиву">
                <button
                  type="button"
                  className={`seg-item ${archiveFilter === 'ACTIVE' ? 'on' : ''}`}
                  onClick={() => setArchiveFilter('ACTIVE')}
                >
                  Активные
                </button>
                <button
                  type="button"
                  className={`seg-item ${archiveFilter === 'ARCHIVED' ? 'on' : ''}`}
                  onClick={() => setArchiveFilter('ARCHIVED')}
                >
                  В архиве
                </button>
                <button
                  type="button"
                  className={`seg-item ${archiveFilter === 'ALL' ? 'on' : ''}`}
                  onClick={() => setArchiveFilter('ALL')}
                >
                  Все
                </button>
              </div>

              <button type="button" className="btn btn-primary" onClick={openCreate}>
                <Plus className="ic" />
                <span>Добавить питомца</span>
              </button>
            </div>
          </div>

          <div className="island-body">
            {filteredPets.length === 0 ? (
              <div className="empty" style={{ padding: '40px' }}>
                <span className="empty-title">Питомцы не найдены</span>
                <span>Добавьте первого питомца или смените фильтр архива</span>
              </div>
            ) : (
              <div className="cards">
                {filteredPets.map((p) => {
                  const isSel = selectedPet?.id === p.id;
                  const tone = getSpeciesTone(p.speciesId);
                  const spName = speciesMap[p.speciesId] || 'Питомец';
                  const age = getPetAge(p.birthDate);
                  const visitsCount = appointments.filter((a) => a.petId === p.id && a.status === 'COMPLETED').length;
                  const nextAppt = appointments.find(
                    (a) => a.petId === p.id && (a.status === 'PENDING' || a.status === 'CONFIRMED')
                  );
                  const nextVac = vaccinations.find((v) => v.petId === p.id && v.nextDueOn);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                      onClick={() => setSelectedPet(p)}
                      style={{ textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div className="tcard-head">
                        <span className="t-ava lg">
                          <SpeciesIcon species={tone} size={26} />
                        </span>
                        <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
                          <span className="tcard-title">{p.name}</span>
                          <span className="cell-sub">
                            {spName} · {p.gender === 'MALE' ? 'Самец' : 'Самка'}
                          </span>
                        </span>
                        {p.isArchived && (
                          <span className="badge">
                            <Archive className="ic" style={{ width: '12px', height: '12px' }} />
                            Архив
                          </span>
                        )}
                      </div>

                      <div className="tcard-stats">
                        <div>
                          <span>Возраст</span>
                          <b>{age}</b>
                        </div>
                        <div>
                          <span>Вес</span>
                          <b>{p.weightKg ? `${p.weightKg} кг` : '—'}</b>
                        </div>
                        <div>
                          <span>Приёмов</span>
                          <b>{visitsCount}</b>
                        </div>
                      </div>

                      <div className="col" style={{ gap: '6px' }}>
                        <div className={`tcard-line ${nextAppt ? 'ok' : 'muted'}`}>
                          <Calendar className="ic" />
                          <span>
                            {nextAppt
                              ? `Приём ${new Date(nextAppt.startAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
                              : 'Нет предстоящих приёмов'}
                          </span>
                        </div>
                        <div className={`tcard-line ${nextVac ? 'ok' : 'muted'}`}>
                          <Syringe className="ic" />
                          <span>
                            {nextVac ? `Прививка до ${nextVac.nextDueOn}` : 'Прививки по плану'}
                          </span>
                        </div>
                      </div>

                      {p.notes && <div className="note small">{p.notes}</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Правая колонка: Остров детальной карты питомца */}
        {selectedPet && (
          <section
            className="island detail-island"
            style={{ flex: 'none' }}
            aria-label="Карточка питомца"
          >
            <div className="island-head">
              <div className="row" style={{ gap: '10px' }}>
                <span className={`t-ava tone-${getSpeciesTone(selectedPet.speciesId)}`}>
                  <SpeciesIcon species={getSpeciesTone(selectedPet.speciesId)} size={20} />
                </span>
                <div className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span className="h2">{selectedPet.name}</span>
                  <span className="cell-sub">
                    {speciesMap[selectedPet.speciesId] || 'Питомец'} · {getPetAge(selectedPet.birthDate)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => setSelectedPet(null)}
              >
                <X className="ic" />
              </button>
            </div>

            {/* Панель быстрых действий */}
            <div className="row wrap" style={{ gap: '6px', padding: '0 16px 12px' }}>
              <Link
                href={`/client/book?petId=${selectedPet.id}`}
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <CalendarPlus className="ic" />
                <span>Записать</span>
              </Link>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => openEdit(selectedPet)}
              >
                <Pencil className="ic" />
                <span>Изменить</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleToggleArchive(selectedPet)}
              >
                <Archive className="ic" />
                <span>{selectedPet.isArchived ? 'Из архива' : 'В архив'}</span>
              </button>
              <button
                type="button"
                className="btn btn-destructive-outline btn-sm"
                onClick={() => handleDeletePet(selectedPet)}
              >
                <Trash2 className="ic" />
                <span>Удалить</span>
              </button>
            </div>

            {/* Вкладки: Обзор / Записи / Прививки */}
            <div className="tabs-line" role="tablist">
              <button
                type="button"
                className={`tab-line ${detailTab === 'OVERVIEW' ? 'on' : ''}`}
                onClick={() => setDetailTab('OVERVIEW')}
              >
                Обзор
              </button>
              <button
                type="button"
                className={`tab-line ${detailTab === 'APPTS' ? 'on' : ''}`}
                onClick={() => setDetailTab('APPTS')}
              >
                Записи <span className="small muted">{petAppts.length}</span>
              </button>
              <button
                type="button"
                className={`tab-line ${detailTab === 'VACC' ? 'on' : ''}`}
                onClick={() => setDetailTab('VACC')}
              >
                Прививки <span className="small muted">{petVaccs.length}</span>
              </button>
            </div>

            <div className="island-body" style={{ paddingTop: '14px' }}>
              {detailTab === 'OVERVIEW' && (
                <div className="col" style={{ gap: '14px' }}>
                  {selectedPet.isArchived && (
                    <div className="alert alert-info">
                      <Archive className="ic" />
                      <div>Питомец находится в архиве. Новые записи заблокированы.</div>
                    </div>
                  )}

                  <dl className="kv" style={{ margin: 0 }}>
                    <dt>Вид</dt>
                    <dd>{speciesMap[selectedPet.speciesId] || '—'}</dd>
                    <dt>Пол</dt>
                    <dd>{selectedPet.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
                    <dt>Дата рождения</dt>
                    <dd className="tnum">
                      {selectedPet.birthDate
                        ? `${new Date(selectedPet.birthDate).toLocaleDateString('ru-RU')} (${getPetAge(selectedPet.birthDate)})`
                        : '—'}
                    </dd>
                    <dt>Вес</dt>
                    <dd className="tnum">
                      {selectedPet.weightKg ? `${selectedPet.weightKg} кг` : 'не указан'}
                    </dd>
                    <dt>Особенности</dt>
                    <dd>{selectedPet.notes || 'Особых отметок нет'}</dd>
                  </dl>
                </div>
              )}

              {detailTab === 'APPTS' && (
                <div className="col" style={{ gap: '8px' }}>
                  {petAppts.length === 0 ? (
                    <span className="small muted">Записей на приём пока нет</span>
                  ) : (
                    petAppts.map((a) => (
                      <div
                        key={a.id}
                        className="lrow"
                        style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                      >
                        <span className="datebox">
                          <b>{new Date(a.startAt).getDate()}</b>
                          <span>
                            {new Date(a.startAt).toLocaleDateString('ru-RU', { month: 'short' })}
                          </span>
                        </span>
                        <span className="col" style={{ gap: 0, minWidth: 0, flex: 1 }}>
                          <span className="cell-main tnum">
                            {new Date(a.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="cell-sub">
                            {a.priceSnapshot ? `${a.priceSnapshot.toLocaleString('ru-RU')} ₽` : 'Приём'}
                          </span>
                        </span>
                        <span className={`badge st badge-${a.status}`}>{a.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === 'VACC' && (
                <div className="col" style={{ gap: '8px' }}>
                  {petVaccs.length === 0 ? (
                    <span className="small muted">Вакцинаций не зарегистрировано</span>
                  ) : (
                    petVaccs.map((v) => (
                      <div
                        key={v.id}
                        className="lrow"
                        style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                      >
                        <span className="t-ava sm tone-prev">
                          <Syringe className="ic" />
                        </span>
                        <span className="col" style={{ gap: 0, minWidth: 0, flex: 1 }}>
                          <span className="cell-main">{v.name}</span>
                          <span className="cell-sub tnum">
                            Сделана: {v.administeredOn}
                            {v.nextDueOn ? ` · След.: ${v.nextDueOn}` : ''}
                          </span>
                        </span>
                        <span className="badge badge-outline">
                          {v.nextDueOn ? 'По плану' : 'Выполнена'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Диалог создания / редактирования питомца */}
      {isDlgOpen && (
        <div className="dialog-backdrop">
          <div className="dialog" style={{ width: '480px', maxWidth: 'calc(100vw - 32px)' }}>
            <div className="dialog-head">
              <span className="dialog-title">
                {editingPet ? 'Редактировать питомца' : 'Новый питомец'}
              </span>
              <span className="dialog-desc">
                Укажите основные сведения о животном для оформления электронной медкарты
              </span>
            </div>

            <form onSubmit={handleSavePet}>
              <div className="dialog-body">
                {dlgError && (
                  <div className="alert alert-destructive">
                    <AlertCircle className="ic" />
                    <div>{dlgError}</div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="field span-2">
                    <label className="field-label" htmlFor="p-name">
                      Кличка <span className="req">*</span>
                    </label>
                    <input
                      id="p-name"
                      type="text"
                      className="input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Например: Барсик"
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="p-spec">
                      Вид животного <span className="req">*</span>
                    </label>
                    <select
                      id="p-spec"
                      className="select"
                      value={formSpeciesId}
                      onChange={(e) => setFormSpeciesId(e.target.value)}
                    >
                      {speciesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <span className="field-label">Пол</span>
                    <div className="seg">
                      <button
                        type="button"
                        className={`seg-item ${formGender === 'MALE' ? 'on' : ''}`}
                        onClick={() => setFormGender('MALE')}
                      >
                        Самец
                      </button>
                      <button
                        type="button"
                        className={`seg-item ${formGender === 'FEMALE' ? 'on' : ''}`}
                        onClick={() => setFormGender('FEMALE')}
                      >
                        Самка
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="p-birth">
                      Дата рождения
                    </label>
                    <input
                      id="p-birth"
                      type="date"
                      className="input"
                      value={formBirthDate}
                      onChange={(e) => setFormBirthDate(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="p-weight">
                      Вес (кг)
                    </label>
                    <input
                      id="p-weight"
                      type="number"
                      step="0.1"
                      className="input"
                      value={formWeightKg}
                      onChange={(e) => setFormWeightKg(e.target.value)}
                      placeholder="4.2"
                    />
                  </div>

                  <div className="field span-2">
                    <label className="field-label" htmlFor="p-notes">
                      Особенности здоровья, аллергии или чип
                    </label>
                    <textarea
                      id="p-notes"
                      className="textarea"
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Хронические заболевания, особенности поведения..."
                    />
                  </div>
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsDlgOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Сохранение...' : editingPet ? 'Сохранить изменения' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function PetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка питомцев...</div>}>
      <PetsContent />
    </Suspense>
  );
}
