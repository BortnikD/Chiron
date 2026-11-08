'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { AppShell } from '../../components/layout/AppShell';
import { clinicApi } from '../../api';
import { Service, Specialization, Species, ServiceSpecies, AvailableSlotResponse } from '../../types';
import {
  ClipboardList,
  Clock,
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

function ServicesContent() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const openParam = searchParams.get('open');
  const { isAuthenticated, role } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>('ALL');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSpeciesList, setServiceSpeciesList] = useState<ServiceSpecies[]>([]);
  const [activeSpeciesTab, setActiveSpeciesTab] = useState<string>('');
  const [nearestSlots, setNearestSlots] = useState<AvailableSlotResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    Promise.all([
      clinicApi.getServices(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
    ])
      .then(([svcData, specData, spList]) => {
        const safeSvc = Array.isArray(svcData) ? svcData : [];
        const safeSpec = Array.isArray(specData) ? specData : [];
        const safeSp = Array.isArray(spList) ? spList : [];

        setServices(safeSvc);
        setSpecializations(safeSpec);
        setSpeciesList(safeSp);

        if (openParam) {
          const found = safeSvc.find((s) => s.id === openParam);
          if (found) setSelectedService(found);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [openParam]);

  // Загрузка цен по видам животных при выборе услуги
  useEffect(() => {
    if (selectedService) {
      clinicApi
        .getServiceSpecies(selectedService.id)
        .then((res) => {
          const list = Array.isArray(res) ? res : [];
          setServiceSpeciesList(list);
          if (list.length > 0) {
            setActiveSpeciesTab(list[0].speciesId);
          } else if (speciesList.length > 0) {
            setActiveSpeciesTab(speciesList[0].id);
          }
        })
        .catch(() => setServiceSpeciesList([]));
    } else {
      setServiceSpeciesList([]);
    }
  }, [selectedService?.id, speciesList]);

  // Загрузка ближайших окон для выбранного вида
  useEffect(() => {
    if (selectedService && activeSpeciesTab) {
      const today = new Date().toISOString().split('T')[0];
      const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

      clinicApi
        .findAvailableSlots({
          serviceId: selectedService.id,
          speciesId: activeSpeciesTab,
          from: today,
          to: in3Days,
        })
        .then((res) => {
          setNearestSlots(Array.isArray(res) ? res.slice(0, 8) : []);
        })
        .catch(() => setNearestSlots([]));
    }
  }, [selectedService?.id, activeSpeciesTab]);

  const hasFilters = selectedSpec !== 'ALL' || selectedSpecies !== 'ALL' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedSpec('ALL');
    setSelectedSpecies('ALL');
    setSearchQuery('');
  };

  const filteredServices = services.filter((svc) => {
    const matchesSpec = selectedSpec === 'ALL' || svc.specializationId === selectedSpec;
    const matchesSearch =
      svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (svc.description && svc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSpec && matchesSearch;
  });

  const content = (
    <div className="scroll-col grow">
        {/* Остров фильтров каталога */}
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
                placeholder="Поиск по названию услуги..."
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

        {/* Сетка: Список услуг + Боковой остров детального просмотра */}
        <div className="content-row">
          {/* Левая колонка: Карточки услуг */}
          <section className="island grow">
            <div className="island-head">
              <span className="island-title">
                <ClipboardList className="ic" />
                Услуги <span className="count">{filteredServices.length}</span>
              </span>
            </div>
            <div className="island-body">
              {filteredServices.length === 0 ? (
                <div className="empty">
                  <div className="empty-art">
                    <Inbox className="ic ic-40" />
                  </div>
                  <span className="empty-title">Услуги не найдены</span>
                  <span>Попробуйте изменить параметры фильтрации</span>
                </div>
              ) : (
                <div className="cards">
                  {filteredServices.map((svc) => {
                    const isSel = selectedService?.id === svc.id;
                    const tone = SPEC_TONES[svc.specializationId] || 'ther';
                    const specName = specsMap[svc.specializationId] || 'Терапия';
                    const duration = svc.baseDurationMin || svc.durationMin || 30;

                    return (
                      <button
                        key={svc.id}
                        type="button"
                        className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                        onClick={() => setSelectedService(svc)}
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                      >
                        <span className="t-badge" style={{ alignSelf: 'flex-start' }}>
                          {specName}
                        </span>
                        <span className="col" style={{ gap: '4px' }}>
                          <span className="tcard-title">{svc.name}</span>
                          <span className="tcard-desc">{svc.description}</span>
                        </span>
                        <div className="tcard-foot">
                          <span className="tcard-meta">
                            <Clock className="ic" />
                            {duration} мин
                          </span>
                          <span className="tcard-price">
                            от {svc.basePrice?.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Правая колонка: Остров детального просмотра услуги */}
          {selectedService && (
            <section
              className="island detail-island"
              style={{ flex: 'none' }}
              aria-label="Карточка услуги"
            >
              <div className="island-head">
                <div className="col" style={{ gap: '2px', minWidth: 0 }}>
                  <span className="h2" style={{ wordBreak: 'break-word' }}>
                    {selectedService.name}
                  </span>
                  <span className="cell-sub">
                    {specsMap[selectedService.specializationId] || 'Общий профиль'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label="Закрыть"
                  onClick={() => setSelectedService(null)}
                >
                  <X className="ic" />
                </button>
              </div>

              <div className="island-body">
                <div className="col" style={{ gap: '18px' }}>
                  {selectedService.description && <p>{selectedService.description}</p>}

                  {/* Характеристики услуги */}
                  <dl className="kv" style={{ margin: 0 }}>
                    <dt>Базовая цена</dt>
                    <dd className="tnum">
                      {selectedService.basePrice?.toLocaleString('ru-RU')} ₽
                    </dd>
                    <dt>Длительность</dt>
                    <dd className="tnum">
                      {selectedService.baseDurationMin || 30} мин
                    </dd>
                    <dt>Буфер после</dt>
                    <dd className="tnum">
                      {selectedService.bufferAfterMin || 10} мин
                    </dd>
                  </dl>

                  {/* Таблица цен по видам животных */}
                  <div className="col" style={{ gap: '8px' }}>
                    <span className="section-title">Цена и длительность по видам</span>
                    <div className="dtable" style={{ '--cols': '1fr 1.2fr 1.2fr' } as React.CSSProperties}>
                      <div className="thead" style={{ padding: 0 }}>
                        <span>Вид</span>
                        <span>Длительность</span>
                        <span className="right">Цена</span>
                      </div>
                      {serviceSpeciesList.length > 0 ? (
                        serviceSpeciesList.map((ss) => (
                          <div key={ss.speciesId} className="trow static compact">
                            <span>{speciesMap[ss.speciesId] || 'Животное'}</span>
                            <span className="tnum">
                              {ss.durationMin || selectedService.baseDurationMin || 30} мин
                            </span>
                            <span className="right tnum">
                              {(ss.price || selectedService.basePrice)?.toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        ))
                      ) : (
                        speciesList.map((sp) => (
                          <div key={sp.id} className="trow static compact">
                            <span>{sp.name}</span>
                            <span className="tnum">
                              {selectedService.baseDurationMin || 30} мин
                            </span>
                            <span className="right tnum">
                              {selectedService.basePrice?.toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Ближайшие свободные окна */}
                  <div className="col" style={{ gap: '10px' }}>
                    <div className="row between wrap">
                      <span className="section-title">Ближайшие свободные окна</span>
                      <div className="seg">
                        {speciesList.map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            className={`seg-item ${activeSpeciesTab === sp.id ? 'on' : ''}`}
                            onClick={() => setActiveSpeciesTab(sp.id)}
                          >
                            {sp.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col" style={{ gap: '6px' }}>
                      <span className="small">
                        <b style={{ fontWeight: 600 }}>На ближайшие 3 дня</b>
                      </span>
                      {nearestSlots.length > 0 ? (
                        <div className="chips">
                          {nearestSlots.map((slot) => {
                            const timeStr = new Date(slot.startAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Europe/Moscow',
                            });
                            if (!isAuthenticated) {
                              return (
                                <Link
                                  key={slot.startAt}
                                  href="/login"
                                  className="slot"
                                  title="Войдите для записи"
                                >
                                  {timeStr}
                                </Link>
                              );
                            }
                            if (role === 'CLIENT') {
                              return (
                                <Link
                                  key={slot.startAt}
                                  href={`/client/book?serviceId=${selectedService.id}&slot=${slot.startAt}`}
                                  className="slot"
                                  title="Записаться на это время"
                                >
                                  {timeStr}
                                </Link>
                              );
                            }
                            return (
                              <span key={slot.startAt} className="slot" title="Свободное окно">
                                {timeStr}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="small muted">
                          Свободные окна не найдены на ближайшие дни
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="island-foot">
                <span className="small muted">
                  {!isAuthenticated
                    ? 'Для записи нужен вход'
                    : role === 'CLIENT'
                    ? 'Выберите врача и время'
                    : role === 'VETERINARIAN'
                    ? 'Справочник услуг клиники'
                    : 'Справочник услуг'}
                </span>
                {!isAuthenticated ? (
                  <Link
                    href="/login"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <CalendarPlus className="ic" />
                    <span>Записаться</span>
                  </Link>
                ) : role === 'CLIENT' ? (
                  <Link
                    href={`/client/book?serviceId=${selectedService.id}`}
                    className="btn btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <CalendarPlus className="ic" />
                    <span>Записаться</span>
                  </Link>
                ) : role === 'ADMIN' ? (
                  <Link
                    href="/admin/services"
                    className="btn btn-outline btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>Управление в админке</span>
                  </Link>
                ) : (
                  <span className="badge badge-accent">Услуга клиники</span>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
  );

  if (isAuthenticated) {
    return (
      <AppShell
        crumbGroup={role === 'VETERINARIAN' ? 'Клиника' : role === 'ADMIN' ? 'Справочники' : 'Кабинет'}
        crumb={role === 'VETERINARIAN' ? 'Услуги клиники' : 'Услуги'}
      >
        {content}
      </AppShell>
    );
  }

  return (
    <div className="app" data-theme={resolvedTheme} style={{ flexDirection: 'column' }}>
      <PublicHeader />
      {content}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка каталога услуг...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
