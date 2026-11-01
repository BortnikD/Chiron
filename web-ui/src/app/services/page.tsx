'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { AppShell } from '../../components/layout/AppShell';
import { clinicApi } from '../../api';
import { Service, Specialization, Species } from '../../types';
import {
  Clock,
  Search,
  Calendar,
  ClipboardList,
  Filter,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';

export default function ServicesPage() {
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      clinicApi.getServices(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
    ])
      .then(([svcData, specData, spList]) => {
        setServices(Array.isArray(svcData) ? svcData : []);
        setSpecializations(Array.isArray(specData) ? specData : []);
        setSpeciesList(Array.isArray(spList) ? spList : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredServices = services.filter((svc) => {
    const matchesSpec = selectedSpec === 'ALL' || svc.specializationId === selectedSpec;
    const matchesSearch =
      svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (svc.description && svc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSpec && matchesSearch;
  });

  const content = (
    <div className="flex flex-col gap-2 w-full flex-1 min-h-0">
      {/* Шапка раздела услуг */}
      <section className="island p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Услуги и прейскурант</h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Прозрачные фиксированные цены, квалифицированные ветеринарные врачи и современное оснащение
            </p>
          </div>
          <Link href="/client/book" className="btn btn-primary h-9 text-xs flex items-center gap-2 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>Записаться онлайн</span>
          </Link>
        </div>

        {/* Панель поиска и фильтрации */}
        <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-[var(--border)]">
          <div className="input-icon flex-1" style={{ position: 'relative' }}>
            <Search className="ic" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Поиск по названию или описанию процедуры..."
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
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px' }}
              >
                <X className="ic" style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>

          {/* Фильтры по специализациям */}
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
              Все специализации
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
                {spec.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Сетка карточек услуг */}
      <section className="island p-6 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pb-2 border-b border-[var(--border)]">
          <span>
            Найдено услуг: <strong className="font-mono text-[var(--foreground)]">{filteredServices.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка прейскуранта...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
            По заданным критериям услуг не найдено
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredServices.map((svc) => (
              <div
                key={svc.id}
                className="card p-4 flex flex-col justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)]"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-sm leading-snug">{svc.name}</h3>
                    <span className="badge font-mono text-xs font-bold shrink-0 bg-[var(--primary)]/10 text-[var(--primary-text)] border border-[var(--primary)]/20 px-2 py-0.5">
                      {svc.basePrice?.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>

                  {svc.description && (
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-3 leading-relaxed">
                      {svc.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {svc.baseDurationMin ?? svc.durationMin ?? 30} минут
                  </span>
                  <Link
                    href={`/client/book?serviceId=${svc.id}`}
                    className="btn btn-primary h-7 px-3 text-[11px] font-medium flex items-center gap-1"
                  >
                    <span>Выбрать</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  if (isAuthenticated) {
    return (
      <AppShell
        title="Услуги и прейскурант"
        subtitle="Прозрачные фиксированные цены и каталог процедур"
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
