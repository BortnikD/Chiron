'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { clinicApi } from '../../api';
import {
  Veterinarian,
  Specialization,
  Species,
  WorkSchedule,
  ScheduleException,
  VeterinarianSpeciesPermission,
} from '../../types';
import { getDoctorDisplay } from '../../utils/doctorHelpers';
import { SpeciesIcon } from '../../components/ui/SpeciesIcon';
import {
  Stethoscope,
  Search,
  X,
  CalendarPlus,
  ChevronDown,
  Inbox,
} from 'lucide-react';

const SPEC_TONES: Record<string, string> = {
  '5eed0002-0000-0000-0000-000000000001': 'ther',
  '5eed0002-0000-0000-0000-000000000002': 'surg',
  '5eed0002-0000-0000-0000-000000000003': 'dent',
  '5eed0002-0000-0000-0000-000000000004': 'derm',
  '5eed0002-0000-0000-0000-000000000005': 'opht',
  '5eed0002-0000-0000-0000-000000000006': 'prev',
};

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Пн',
  TUESDAY: 'Вт',
  WEDNESDAY: 'Ср',
  THURSDAY: 'Чт',
  FRIDAY: 'Пт',
  SATURDAY: 'Сб',
  SUNDAY: 'Вс',
};

function VeterinariansContent() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const specParam = searchParams.get('spec');
  const { isAuthenticated } = useAuth();

  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vetPermissions, setVetPermissions] = useState<Record<string, string[]>>({});
  const [selectedSpec, setSelectedSpec] = useState<string>('ALL');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);

  // Данные для острова врача
  const [vetSchedules, setVetSchedules] = useState<WorkSchedule[]>([]);
  const [vetExceptions, setVetExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
    ])
      .then(async ([vetsData, specData, spList]) => {
        const safeVets = Array.isArray(vetsData) ? vetsData : [];
        const safeSpec = Array.isArray(specData) ? specData : [];
        const safeSp = Array.isArray(spList) ? spList : [];

        setVets(safeVets);
        setSpecializations(safeSpec);
        setSpeciesList(safeSp);

        if (specParam) {
          const matchSpec = safeSpec.find((s) => s.id === specParam || SPEC_TONES[s.id] === specParam);
          if (matchSpec) setSelectedSpec(matchSpec.id);
        }

        // Загружаем разрешения по видам животных для каждого врача
        const permMap: Record<string, string[]> = {};
        for (const v of safeVets) {
          try {
            const perms = await clinicApi.getVetSpeciesPermissions(v.id);
            if (Array.isArray(perms)) {
              permMap[v.id] = perms.map((p) => p.speciesId);
            }
          } catch {
            permMap[v.id] = [];
          }
        }
        setVetPermissions(permMap);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [specParam]);

  // Загрузка расписания и исключений врача при клике на карточку
  useEffect(() => {
    if (selectedVet) {
      Promise.all([
        clinicApi.getWorkSchedules(selectedVet.id),
        clinicApi.getScheduleExceptions(selectedVet.id),
      ])
        .then(([schedRes, excRes]) => {
          setVetSchedules(Array.isArray(schedRes) ? schedRes : []);
          setVetExceptions(Array.isArray(excRes) ? excRes : []);
        })
        .catch(() => {
          setVetSchedules([]);
          setVetExceptions([]);
        });
    } else {
      setVetSchedules([]);
      setVetExceptions([]);
    }
  }, [selectedVet?.id]);

  const specsMap = useMemo(() => {
    const map: Record<string, string> = {};
    specializations.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [specializations]);

  const speciesMap = useMemo(() => {
    const map: Record<string, string> = {};
    speciesList.forEach((sp) => {
      map[sp.id] = sp.name;
    });
    return map;
  }, [speciesList]);

  const hasFilters = selectedSpec !== 'ALL' || selectedSpecies !== 'ALL' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedSpec('ALL');
    setSelectedSpecies('ALL');
    setSearchQuery('');
  };

  const filteredVets = vets.filter((v) => {
    const matchesSpec = selectedSpec === 'ALL' || v.specializationId === selectedSpec;
    const matchesSpecies =
      selectedSpecies === 'ALL' || (vetPermissions[v.id] && vetPermissions[v.id].includes(selectedSpecies));
    const { name, specName } = getDoctorDisplay(v, specsMap);
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.bio && v.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSpec && matchesSpecies && matchesSearch;
  });

  const selectedVetDisplay = selectedVet ? getDoctorDisplay(selectedVet, specsMap) : null;

  return (
    <div className="app" data-theme={resolvedTheme} style={{ flexDirection: 'column' }}>
      {/* Шапка гостевого интерфейса */}
      <PublicHeader />

      <div className="scroll-col grow" style={{ gap: '12px' }}>
        {/* Остров фильтров врачей */}
        <section className="island filters" aria-label="Фильтры">
          <div className="field">
            <span className="field-label">Специализация</span>
            <div className="dd" style={{ position: 'relative' }}>
              <select
                className="select dd-btn"
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                style={{ appearance: 'none', paddingRight: '28px', cursor: 'pointer' }}
              >
                <option value="ALL">Все специализации</option>
                {specializations.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="ic"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  width: '14px',
                  height: '14px',
                }}
              />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Вид животного</span>
            <div className="dd" style={{ position: 'relative' }}>
              <select
                className="select dd-btn"
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                style={{ appearance: 'none', paddingRight: '28px', cursor: 'pointer' }}
              >
                <option value="ALL">Все виды</option>
                {speciesList.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="ic"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  width: '14px',
                  height: '14px',
                }}
              />
            </div>
          </div>

          <div className="field" style={{ flex: 1, minWidth: '220px' }}>
            <span className="field-label">Поиск</span>
            <div className="input-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                className="ic"
                style={{
                  position: 'absolute',
                  left: '10px',
                  width: '15px',
                  height: '15px',
                  color: 'var(--muted-foreground)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Поиск по имени врача..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: '34px', width: '100%' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    width: '24px',
                    height: '24px',
                  }}
                >
                  <X className="ic" style={{ width: '12px', height: '12px' }} />
                </button>
              )}
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={resetFilters}
              style={{ alignSelf: 'flex-end', height: '34px' }}
            >
              Сбросить
            </button>
          )}
        </section>

        {/* Сетка: Список врачей + Боковой остров детального просмотра */}
        <div className="content-row">
          {/* Левая колонка: Карточки врачей */}
          <section className="island grow">
            <div className="island-head">
              <span className="island-title">
                <Stethoscope className="ic" />
                Врачи <span className="count">{filteredVets.length}</span>
              </span>
            </div>
            <div className="island-body">
              {filteredVets.length === 0 ? (
                <div className="empty">
                  <div className="empty-art">
                    <Inbox className="ic ic-40" />
                  </div>
                  <span className="empty-title">Врачи не найдены</span>
                  <span>Попробуйте изменить фильтры</span>
                </div>
              ) : (
                <div className="cards">
                  {filteredVets.map((v) => {
                    const isSel = selectedVet?.id === v.id;
                    const tone = SPEC_TONES[v.specializationId] || 'ther';
                    const { name, initials, specName } = getDoctorDisplay(v, specsMap);
                    const perms = vetPermissions[v.id] || [];

                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                        onClick={() => setSelectedVet(v)}
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div className="tcard-head">
                          <span className="t-ava lg round">{initials}</span>
                          <span className="col" style={{ gap: '4px', minWidth: 0 }}>
                            <span className="tcard-title">{name}</span>
                            <span className="cell-sub">стаж {v.experienceYears} лет</span>
                          </span>
                        </div>

                        <div className="row" style={{ gap: '6px' }}>
                          <span className="t-badge">{specName}</span>
                        </div>

                        {v.bio && <span className="tcard-desc">{v.bio}</span>}

                        <div className="tcard-foot" style={{ justifyContent: 'flex-start' }}>
                          <div className="chips">
                            {perms.length > 0 ? (
                              perms.map((spId) => {
                                const spName = speciesMap[spId] || 'Животное';
                                const spTone =
                                  spName.toLowerCase().includes('соб') || spName.toLowerCase().includes('dog')
                                    ? 'dog'
                                    : spName.toLowerCase().includes('крол')
                                    ? 'rab'
                                    : spName.toLowerCase().includes('попуг') || spName.toLowerCase().includes('птиц')
                                    ? 'par'
                                    : 'cat';

                                return (
                                  <span key={spId} className={`sp-chip tone-${spTone}`}>
                                    <SpeciesIcon species={spTone} size={14} />
                                    {spName}
                                  </span>
                                );
                              })
                            ) : (
                              <>
                                <span className="sp-chip tone-cat">
                                  <SpeciesIcon species="cat" size={14} />
                                  Кошка
                                </span>
                                <span className="sp-chip tone-dog">
                                  <SpeciesIcon species="dog" size={14} />
                                  Собака
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Правая колонка: Остров детального профиля врача */}
          {selectedVet && selectedVetDisplay && (
            <section
              className="island detail-island"
              style={{ flex: 'none' }}
              aria-label="Профиль врача"
            >
              <div className="island-head">
                <div className="row" style={{ gap: '12px' }}>
                  <span className="avatar avatar-lg">{selectedVetDisplay.initials}</span>
                  <div className="col" style={{ gap: '2px', minWidth: 0 }}>
                    <span className="h2">{selectedVetDisplay.name}</span>
                    <span className="cell-sub">
                      {selectedVetDisplay.specName} · стаж {selectedVet.experienceYears} лет
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label="Закрыть"
                  onClick={() => setSelectedVet(null)}
                >
                  <X className="ic" />
                </button>
              </div>

              <div className="island-body">
                <div className="col" style={{ gap: '18px' }}>
                  {selectedVet.bio && <p>{selectedVet.bio}</p>}

                  {/* Кого лечит врач */}
                  <div className="col" style={{ gap: '8px' }}>
                    <span className="section-title">Лечит</span>
                    <div className="chips">
                      {(vetPermissions[selectedVet.id] || []).map((spId) => (
                        <span key={spId} className="badge badge-outline">
                          {speciesMap[spId] || 'Животное'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Недельный график работы */}
                  <div className="col" style={{ gap: '8px' }}>
                    <span className="section-title">Недельный график</span>
                    <div className="dtable" style={{ '--cols': '44px 1fr 1.4fr' } as React.CSSProperties}>
                      {DAY_ORDER.map((dow) => {
                        const sched = vetSchedules.find((s) => s.dayOfWeek === dow);
                        const dayLabel = DAY_SHORT[dow] || dow;

                        if (!sched) {
                          return (
                            <div key={dow} className="trow static compact">
                              <span className="cell-main">{dayLabel}</span>
                              <span className="small muted">Выходной</span>
                              <span />
                            </div>
                          );
                        }

                        const formatTime = (t: string) => t.slice(0, 5);
                        const workRange = `${formatTime(sched.startTime)}–${formatTime(sched.endTime)}`;
                        const breakText =
                          sched.breakStart && sched.breakEnd
                            ? `перерыв ${formatTime(sched.breakStart)}–${formatTime(sched.breakEnd)}`
                            : 'без перерыва';

                        return (
                          <div key={dow} className="trow static compact">
                            <span className="cell-main">{dayLabel}</span>
                            <span className="tnum">{workRange}</span>
                            <span className="small muted">{breakText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Отсутствия и особые часы */}
                  <div className="col" style={{ gap: '8px' }}>
                    <span className="section-title">Отсутствия и особые часы</span>
                    {vetExceptions.length > 0 ? (
                      vetExceptions.map((exc) => (
                        <div
                          key={exc.id}
                          className="row between"
                          style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}
                        >
                          <div className="col" style={{ gap: 0 }}>
                            <span className="cell-main tnum">
                              {exc.startDate} {exc.endDate && exc.endDate !== exc.startDate ? `— ${exc.endDate}` : ''}
                            </span>
                            <span className="cell-sub">
                              {exc.reason || (exc.type === 'ABSENCE' ? 'Отсутствие' : 'Особый график')}
                            </span>
                          </div>
                          <span className={`badge ${exc.type === 'ABSENCE' ? 'badge-destructive' : 'badge-accent'}`}>
                            {exc.type === 'ABSENCE' ? 'Отпуск / больничный' : 'Особые часы'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="small muted">В ближайшие 60 дней график без изменений</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="island-foot">
                <span className="small muted">
                  {isAuthenticated ? 'Выберите удобное время' : 'Для записи нужен вход'}
                </span>
                <Link
                  href={isAuthenticated ? `/client/book?vetId=${selectedVet.id}` : '/login'}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <CalendarPlus className="ic" />
                  <span>Записаться</span>
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VeterinariansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка каталога врачей...</div>}>
      <VeterinariansContent />
    </Suspense>
  );
}
