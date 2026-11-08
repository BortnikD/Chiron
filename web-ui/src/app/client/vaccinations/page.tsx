'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { clientApi } from '../../../api';
import { Pet, Vaccination } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Syringe,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  PawPrint,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface PetVaccines {
  pet: Pet;
  vaccines: Vaccination[];
}

export default function ClientVaccinationsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petVaccines, setPetVaccines] = useState<PetVaccines[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApi
      .getPets()
      .then(async (fetchedPets) => {
        setPets(fetchedPets || []);
        const results: PetVaccines[] = [];

        for (const pet of fetchedPets || []) {
          try {
            const vax = await clientApi.getVaccinations(pet.id);
            results.push({ pet, vaccines: vax || [] });
          } catch (err) {
            console.error(`Failed to load vaccines for pet ${pet.id}:`, err);
            results.push({ pet, vaccines: [] });
          }
        }
        setPetVaccines(results);
      })
      .catch((err) => console.error('Failed to load pets:', err))
      .finally(() => setLoading(false));
  }, []);

  const calculateStatus = (nextDueStr?: string | null) => {
    if (!nextDueStr) return { label: 'Выполнено', cls: 'badge-accent', tone: 'normal' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextDueStr);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Просрочена', cls: 'badge-danger', tone: 'danger' };
    }
    if (diffDays <= 30) {
      return {
        label: diffDays === 0 ? 'Сегодня' : `Через ${diffDays} дн.`,
        cls: 'badge-warn',
        tone: 'warn',
      };
    }
    const months = Math.round(diffDays / 30);
    return {
      label: `Через ${months} мес.`,
      cls: 'badge-accent',
      tone: 'normal',
    };
  };

  const allVaccines = petVaccines.flatMap((pv) => pv.vaccines);
  const overdueCount = allVaccines.filter((v) => {
    const nextDue = v.nextDueOn || v.validUntil;
    return nextDue && calculateStatus(nextDue).tone === 'danger';
  }).length;
  const soonCount = allVaccines.filter((v) => {
    const nextDue = v.nextDueOn || v.validUntil;
    return nextDue && calculateStatus(nextDue).tone === 'warn';
  }).length;

  const filteredData =
    selectedPetId === 'all'
      ? petVaccines
      : petVaccines.filter((pv) => pv.pet.id === selectedPetId);

  return (
    <AppShell
      crumbGroup="Кабинет"
      crumb="Прививки"
    >
      <div className="scroll-col grow" style={{ maxWidth: '1000px', width: '100%' }}>
        {/* Сводные показатели */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <span className="small muted">Всего прививок</span>
            <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
              <span className="title-md font-mono">{allVaccines.length}</span>
              <Syringe className="ic muted" style={{ width: '20px', height: '20px' }} />
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <span className="small muted">Требуют внимания</span>
            <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
              <span className="title-md font-mono" style={{ color: overdueCount > 0 ? '#ef4444' : undefined }}>
                {overdueCount + soonCount}
              </span>
              <AlertTriangle className="ic" style={{ width: '20px', height: '20px', color: overdueCount > 0 ? '#ef4444' : '#f59e0b' }} />
            </div>
            <span className="small muted" style={{ fontSize: '11px' }}>
              {overdueCount} просрочено, {soonCount} скоро
            </span>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <span className="small muted">Питомцев в картотеке</span>
            <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
              <span className="title-md font-mono">{pets.length}</span>
              <PawPrint className="ic muted" style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
        </div>

        {/* Панель фильтрации по питомцам и кнопка записи */}
        <section className="island" style={{ padding: '16px 20px' }}>
          <div className="row between wrap" style={{ alignItems: 'center', gap: '12px' }}>
            <div className="seg" role="tablist">
              <button
                type="button"
                className={`seg-item ${selectedPetId === 'all' ? 'on font-semibold' : ''}`}
                onClick={() => setSelectedPetId('all')}
              >
                <span>Все питомцы</span>
                <span className="small muted font-mono">({pets.length})</span>
              </button>
              {pets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`seg-item ${selectedPetId === p.id ? 'on font-semibold' : ''}`}
                  onClick={() => setSelectedPetId(p.id)}
                >
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            <Link
              href="/client/book"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <Calendar className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Записаться на прививку</span>
            </Link>
          </div>
        </section>

        {/* Карточки ветпаспортов */}
        {loading ? (
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка данных о вакцинации питомцев...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="island empty" style={{ padding: '48px 16px', textAlign: 'center' }}>
            <Syringe className="ic muted" style={{ width: '36px', height: '36px', margin: '0 auto 12px', opacity: 0.5 }} />
            <span className="empty-title">Питомцы не найдены</span>
            <p className="small muted">Добавьте питомца в разделе «Питомцы», чтобы отслеживать график вакцинации</p>
          </div>
        ) : (
          <div className="col" style={{ gap: '16px' }}>
            {filteredData.map(({ pet, vaccines }) => (
              <section key={pet.id} className="island" style={{ padding: '20px' }}>
                <div className="island-head" style={{ marginBottom: '14px' }}>
                  <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                    <span
                      className="avatar"
                      style={{
                        width: '38px',
                        height: '38px',
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                      }}
                    >
                      {pet.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="col" style={{ gap: '1px' }}>
                      <span className="island-title" style={{ fontSize: '15px', fontWeight: 600 }}>
                        {pet.name}
                      </span>
                      <span className="small muted">
                        {pet.species?.name || 'Питомец'}{pet.breed ? ` · ${pet.breed}` : ''}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/client/book?petId=${pet.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <Plus className="ic" style={{ width: '14px', height: '14px' }} />
                    <span>Записать на вакцинацию</span>
                  </Link>
                </div>

                {vaccines.length === 0 ? (
                  <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'var(--card)' }}>
                    <span className="small muted">Вакцинаций в электронной медкарте пока нет</span>
                    <div style={{ marginTop: '8px' }}>
                      <Link href={`/client/book?petId=${pet.id}`} className="linkish small">
                        Записаться на первичную вакцинацию
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <div className="dtable" style={{ '--cols': '1.8fr 1.2fr 1.2fr 1.2fr', minWidth: '550px' } as any}>
                      <div className="thead">
                        <span>Вакцина</span>
                        <span>Дата введения</span>
                        <span>Следующая доза</span>
                        <span>Статус</span>
                      </div>
                      {vaccines.map((v) => {
                        const name = v.name || v.vaccineName || 'Вакцинация';
                        const adminDate = v.administeredOn || v.administeredAt || '—';
                        const nextDue = v.nextDueOn || v.validUntil;
                        const status = calculateStatus(nextDue);

                        return (
                          <div key={v.id} className="trow static">
                            <span className="row" style={{ gap: '8px', alignItems: 'center' }}>
                              <Syringe className="ic muted" style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                              <span className="cell-main font-semibold">{name}</span>
                            </span>
                            <span className="tnum font-mono">{adminDate}</span>
                            <span className="tnum font-mono">{nextDue || 'По показаниям'}</span>
                            <span>
                              <span className={`badge ${status.cls}`}>
                                {status.label}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
