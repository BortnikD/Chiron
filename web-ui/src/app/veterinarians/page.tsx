'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { AppShell } from '../../components/layout/AppShell';
import { clinicApi } from '../../api';
import { Veterinarian, Specialization } from '../../types';
import { getDoctorDisplay, SPECIALIZATION_NAMES_RU } from '../../utils/doctorHelpers';
import {
  Stethoscope,
  Award,
  Calendar,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';

export default function VeterinariansPage() {
  const { isAuthenticated } = useAuth();
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([clinicApi.getVeterinarians(), clinicApi.getSpecializations()])
      .then(([vetsData, specData]) => {
        setVets(Array.isArray(vetsData) ? vetsData : []);
        setSpecializations(Array.isArray(specData) ? specData : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const specsMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    specializations.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [specializations]);

  const filteredVets = vets.filter((v) => {
    const matchesSpec = selectedSpec === 'ALL' || v.specializationId === selectedSpec;
    const { name, specName } = getDoctorDisplay(v, specsMap);
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.bio && v.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSpec && matchesSearch;
  });

  const content = (
    <div className="flex flex-col gap-2 w-full flex-1 min-h-0">
      {/* Шапка раздела врачей */}
      <section className="island p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ветеринарные врачи клиники</h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Опытные специалисты Chiron: терапия, хирургия, кардиология, дерматология и диагностика
            </p>
          </div>
          <Link href="/client/book" className="btn btn-primary h-9 text-xs flex items-center gap-2 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>Записаться на приём</span>
          </Link>
        </div>

        {/* Поиск и фильтры по специализациям */}
        <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-[var(--border)]">
          <div className="input-icon flex-1" style={{ position: 'relative' }}>
            <Search
              className="ic"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Поиск по имени врача или специализации..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input text-xs"
              style={{ paddingLeft: '34px' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn btn-ghost btn-icon btn-sm"
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                }}
              >
                <X className="ic" style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedSpec('ALL')}
              className={`seg-item text-xs h-8 px-3 rounded-lg border border-[var(--border)] transition-colors ${
                selectedSpec === 'ALL'
                  ? 'on font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                  : 'bg-[var(--card)] text-[var(--muted-foreground)]'
              }`}
            >
              Все профили
            </button>
            {specializations.map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSpec(spec.id)}
                className={`seg-item text-xs h-8 px-3 rounded-lg border border-[var(--border)] transition-colors whitespace-nowrap ${
                  selectedSpec === spec.id
                    ? 'on font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                    : 'bg-[var(--card)] text-[var(--muted-foreground)]'
                }`}
              >
                {SPECIALIZATION_NAMES_RU[spec.name] || spec.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Сетка карточек ветеринаров */}
      <section className="island p-6 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pb-2 border-b border-[var(--border)]">
          <span>
            Врачей в штате: <strong className="font-mono text-[var(--foreground)]">{filteredVets.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка специалистов...
          </div>
        ) : filteredVets.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
            По заданным критериям специалисты не найдены
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredVets.map((v) => {
              const { name, initials, title } = getDoctorDisplay(v, specsMap);

              return (
                <div
                  key={v.id}
                  className="card p-5 flex flex-col justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="avatar w-12 h-12 text-sm font-bold bg-[var(--primary)]/15 text-[var(--primary-text)] shrink-0">
                        {initials}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-sm truncate" title={name}>{name}</h3>
                        <span className="text-xs text-[var(--muted-foreground)] font-medium truncate" title={title}>
                          {title}
                        </span>
                      </div>
                    </div>

                    {v.bio && (
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-3 leading-relaxed">
                        {v.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1.5 font-mono text-xs">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Стаж: <strong className="text-[var(--foreground)]">{v.experienceYears} лет</strong>
                    </span>
                    <Link
                      href={`/client/book?vetId=${v.id}`}
                      className="btn btn-primary h-7 px-3 text-[11px] font-medium flex items-center gap-1"
                    >
                      <span>Записаться</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );

  if (isAuthenticated) {
    return (
      <AppShell
        title="Врачи клиники"
        subtitle="Ветеринарные врачи и профильные специалисты"
      >
        {content}
      </AppShell>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full p-2 gap-2 bg-[var(--background)] text-[var(--foreground)]">
      <PublicHeader />
      <main className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
        {content}
      </main>
    </div>
  );
}
