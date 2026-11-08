'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { AppShell } from '../../../components/layout/AppShell';
import { clientApi, clinicApi, notificationsApi } from '../../../api';
import { Pet, Appointment, Vaccination, AppNotification, Species, Service, Veterinarian } from '../../../types';
import { SpeciesIcon } from '../../../components/ui/SpeciesIcon';
import { getDoctorDisplay } from '../../../utils/doctorHelpers';
import {
  Calendar,
  CalendarPlus,
  PawPrint,
  Clock,
  ChevronRight,
  Plus,
  Syringe,
  Bell,
} from 'lucide-react';

const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

const ST_COL: Record<string, string> = {
  PENDING: 'var(--st-pending-fg)',
  CONFIRMED: 'var(--st-confirmed-fg)',
  COMPLETED: 'var(--st-completed-fg)',
  CANCELLED: 'var(--st-cancelled-fg)',
  NO_SHOW: 'var(--st-noshow-fg)',
};

const SP_TONE: Record<string, string> = {
  cat: 'var(--chart-3)',
  dog: 'var(--chart-2)',
  rab: 'var(--chart-4)',
  par: 'var(--chart-1)',
};

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clientApi.getPets(),
      clientApi.getAppointments(0, 30),
      clinicApi.getSpecies(),
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
      notificationsApi.getNotifications(0, 5),
    ])
      .then(async ([petsData, apptsData, spData, svcData, vetsData, notifsData]) => {
        const safePets = Array.isArray(petsData) ? petsData : [];
        setPets(safePets);

        const items = apptsData?.items ?? (Array.isArray(apptsData) ? apptsData : []);
        setAppointments(items);
        setSpeciesList(Array.isArray(spData) ? spData : []);
        setServices(Array.isArray(svcData) ? svcData : []);
        setVeterinarians(Array.isArray(vetsData) ? vetsData : []);

        const notifItems = Array.isArray(notifsData) ? notifsData : notifsData?.items || [];
        setNotifications(notifItems);

        try {
          const vacPromises = safePets.map((p) =>
            clientApi.getVaccinations(p.id).catch(() => [])
          );
          const vacResults = await Promise.all(vacPromises);
          setVaccinations(vacResults.flat());
        } catch {
          setVaccinations([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard data', err);
        setPets([]);
        setAppointments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const speciesMap = useMemo(() => {
    const map: Record<string, string> = {};
    speciesList.forEach((sp) => {
      map[sp.id] = sp.name;
    });
    return map;
  }, [speciesList]);

  const servicesMap = useMemo(() => {
    const map: Record<string, Service> = {};
    services.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [services]);

  const vetsMap = useMemo(() => {
    const map: Record<string, Veterinarian> = {};
    veterinarians.forEach((v) => {
      map[v.id] = v;
    });
    return map;
  }, [veterinarians]);

  // Предстоящие записи
  const upcomingAppts = useMemo(() => {
    return appointments
      .filter((a) => a && (a.status === 'PENDING' || a.status === 'CONFIRMED'))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointments]);

  const nextAppt = upcomingAppts[0] || null;

  // Форматирование даты
  const todayFormatted = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const todayWord = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Расчет возраста питомца
  const getPetAge = (birthDate?: string | null) => {
    if (!birthDate) return 'возраст не указан';
    const years = Math.floor(
      (Date.now() - new Date(birthDate).getTime()) / (365.25 * 86400000)
    );
    if (years <= 0) return 'до года';
    if (years === 1) return '1 год';
    if (years < 5) return `${years} года`;
    return `${years} лет`;
  };

  // Определение тональности вида животного
  const getSpeciesTone = (speciesId?: string) => {
    const spName = speciesId ? speciesMap[speciesId] || '' : '';
    const norm = spName.toLowerCase();
    if (norm.includes('соб') || norm.includes('dog')) return 'dog';
    if (norm.includes('крол')) return 'rab';
    if (norm.includes('попуг') || norm.includes('птиц')) return 'par';
    return 'cat';
  };

  // Расчет обратного отсчета для ближайшего приёма
  const getCountdown = (iso: string) => {
    const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
    if (diffMin <= 0) return 'сейчас';
    if (diffMin < 60) return `через ${diffMin} мин`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `через ${diffHours} ч`;
    const diffDays = Math.round(diffHours / 24);
    return `через ${diffDays} дн`;
  };

  // Расчет статуса вакцинации
  const getDueInfo = (dateStr?: string | null) => {
    if (!dateStr) return { text: 'не задана', cls: '', label: '—' };
    const target = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const label = target.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (diffDays < 0) return { text: 'просрочена', cls: 'due-over', label };
    if (diffDays <= 7) {
      return { text: diffDays === 0 ? 'сегодня' : `через ${diffDays} дн.`, cls: 'due-soon', label };
    }
    const months = Math.round(diffDays / 30);
    return { text: `через ${months} мес.`, cls: 'due-later', label };
  };

  // Количество прививок к сроку (просроченные или требующие внимания в течение недели)
  const vacAttnCount = useMemo(() => {
    return vaccinations.filter((v) => {
      if (!v.nextDueOn) return false;
      const diffDays = Math.ceil((new Date(v.nextDueOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
  }, [vaccinations]);

  // Группировка предстоящих записей по дням
  const groupedAppointments = useMemo(() => {
    const groups: { dateKey: string; dayLabel: string; countText: string; items: Appointment[] }[] = [];
    const map: Record<string, Appointment[]> = {};

    upcomingAppts.forEach((a) => {
      const key = new Date(a.startAt).toISOString().split('T')[0];
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(a);
    });

    Object.keys(map).sort().forEach((key) => {
      const items = map[key];
      const date = new Date(`${key}T12:00:00`);
      const dayLabel = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
      const countText = `${items.length} ${items.length === 1 ? 'запись' : items.length < 5 ? 'записи' : 'записей'}`;
      groups.push({ dateKey: key, dayLabel, countText, items });
    });

    return groups;
  }, [upcomingAppts]);

  const unreadNotifsCount = notifications.filter((n) => !n.readAt).length;

  // Данные питомца и врача для следующего приёма в Hero
  const nextApptPet = nextAppt ? pets.find((p) => p.id === nextAppt.petId) : null;
  const nextApptService = nextAppt ? servicesMap[nextAppt.serviceId] : null;
  const nextApptVet = nextAppt ? vetsMap[nextAppt.veterinarianId] : null;
  const nextApptVetName = nextApptVet ? getDoctorDisplay(nextApptVet).name : 'Врач клиники';

  return (
    <AppShell title="Главная" currentSection="Главная">
      <div className="content-row">
        <div className="scroll-col grow">
          {/* HERO БЛОК С БЛИЖАЙШИМ ПРИЁМОМ И СТАТИСТИКОЙ */}
          <section className="island hm-hero" style={{ flex: 'none' }}>
            <div className="hm-hero-main">
              <div className="col" style={{ gap: '4px' }}>
                <span className="hm-date">{todayWord}</span>
                <h1 className="h1 hm-title">Здравствуйте, {user?.firstName || 'клиент'}</h1>
                <span className="muted">Вот что ждёт ваших питомцев в ближайшее время</span>
              </div>

              {/* 4 МЕТРИКИ СТАТИСТИКИ СОГЛАСНО ПРОТОТИПУ */}
              <div className="hm-stats">
                <Link
                  href="/client/appointments"
                  className="hm-stat"
                  style={{ '--tone': 'var(--primary)', textDecoration: 'none' } as React.CSSProperties}
                >
                  <span className="hm-stat-ic">
                    <Calendar className="ic" />
                  </span>
                  <span className="hm-stat-txt">
                    <b>{upcomingAppts.length}</b>
                    <span>
                      {upcomingAppts.length === 1
                        ? 'запись впереди'
                        : upcomingAppts.length < 5
                        ? 'записи впереди'
                        : 'записей впереди'}
                    </span>
                  </span>
                </Link>

                <Link
                  href="/client/pets"
                  className="hm-stat"
                  style={{ '--tone': 'var(--chart-2)', textDecoration: 'none' } as React.CSSProperties}
                >
                  <span className="hm-stat-ic">
                    <PawPrint className="ic" />
                  </span>
                  <span className="hm-stat-txt">
                    <b>{pets.length}</b>
                    <span>{pets.length === 1 ? 'питомец' : pets.length < 5 ? 'питомца' : 'питомцев'}</span>
                  </span>
                </Link>

                <Link
                  href="/client/appointments?tab=VACC"
                  className="hm-stat"
                  style={{
                    '--tone': vacAttnCount > 0 ? 'var(--st-noshow-fg)' : 'var(--muted-foreground)',
                    textDecoration: 'none',
                  } as React.CSSProperties}
                >
                  <span className="hm-stat-ic">
                    <Syringe className="ic" />
                  </span>
                  <span className="hm-stat-txt">
                    <b>{vacAttnCount}</b>
                    <span>прививки к сроку</span>
                  </span>
                </Link>

                <Link
                  href="/client/dashboard#notifs"
                  className="hm-stat"
                  style={{ '--tone': 'var(--chart-3)', textDecoration: 'none' } as React.CSSProperties}
                >
                  <span className="hm-stat-ic">
                    <Bell className="ic" />
                  </span>
                  <span className="hm-stat-txt">
                    <b>{unreadNotifsCount}</b>
                    <span>
                      {unreadNotifsCount === 1
                        ? 'новое событие'
                        : unreadNotifsCount < 5
                        ? 'новых события'
                        : 'новых событий'}
                    </span>
                  </span>
                </Link>
              </div>

              <div className="row wrap" style={{ gap: '8px' }}>
                <Link href="/client/book" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
                  <CalendarPlus className="ic" />
                  <span>Записаться на приём</span>
                </Link>
              </div>
            </div>

            {/* ВИДЖЕТ СЛЕДУЮЩЕГО ПРИЁМА В HERO С ТОЧНЫМИ СТИЛЯМИ И ЦВЕТОМ СТАТУСА */}
            {nextAppt ? (
              <div
                className="hm-next"
                style={{ '--st': ST_COL[nextAppt.status] || 'var(--border)' } as React.CSSProperties}
              >
                <div className="row between">
                  <span className="hm-kicker">
                    <Clock className="ic" />
                    Следующий приём
                  </span>
                  <span className={`badge st badge-${nextAppt.status}`}>
                    {STATUS_SHORT[nextAppt.status] || nextAppt.status}
                  </span>
                </div>

                <div className="hm-next-when">
                  <b>
                    {new Date(nextAppt.startAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Moscow',
                    })}
                  </b>
                  <span className="col" style={{ gap: 0 }}>
                    <span className="hm-next-day">
                      {new Date(nextAppt.startAt).toLocaleDateString('ru-RU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'Europe/Moscow',
                      })}
                    </span>
                    <span className="hm-next-cd">
                      {getCountdown(nextAppt.startAt)}
                    </span>
                  </span>
                </div>

                <div className="hm-next-who">
                  <span
                    className="hm-ava sm"
                    style={{ '--tone': SP_TONE[getSpeciesTone(nextApptPet?.speciesId)] } as React.CSSProperties}
                  >
                    <SpeciesIcon species={getSpeciesTone(nextApptPet?.speciesId)} size={20} />
                  </span>
                  <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                    <span className="hm-next-pet">
                      {nextApptPet?.name || 'Питомец'} — {nextApptService?.name || 'Приём'}
                    </span>
                    <span className="cell-sub">
                      {nextApptVetName} · {nextAppt.priceSnapshot ? `${nextAppt.priceSnapshot.toLocaleString('ru-RU')} ₽` : '1 500 ₽'}
                    </span>
                  </span>
                </div>

                <div className="row" style={{ gap: '8px' }}>
                  <Link
                    href="/client/appointments"
                    className="btn btn-outline btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>Подробнее</span>
                    <ChevronRight className="ic" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hm-next hm-next-empty">
                <span className="hm-kicker">Следующий приём</span>
                <span className="muted">Предстоящих записей нет</span>
                <Link href="/client/book" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                  <span>Выбрать время</span>
                </Link>
              </div>
            )}
          </section>

          {/* СЕКЦИЯ: МОИ ПИТОМЦЫ С ГРАДИЕНТАМИ ТОНАЛЬНОСТИ И ДЕТАЛЯМИ */}
          <section className="island" style={{ flex: 'none' }}>
            <div className="island-head">
              <span className="island-title">
                <PawPrint className="ic" />
                Мои питомцы <span className="count">{pets.length}</span>
              </span>
              <Link href="/client/pets" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                <span>Все питомцы</span>
                <ChevronRight className="ic" />
              </Link>
            </div>
            <div className="island-body" style={{ paddingTop: 0 }}>
              <div className="hm-pets">
                {pets.map((p) => {
                  const tone = getSpeciesTone(p.speciesId);
                  const toneColor = SP_TONE[tone] || 'var(--primary)';
                  const spName = speciesMap[p.speciesId] || 'Питомец';
                  const age = getPetAge(p.birthDate);
                  const petAppt = appointments.find(
                    (a) => a.petId === p.id && (a.status === 'PENDING' || a.status === 'CONFIRMED')
                  );

                  return (
                    <div
                      key={p.id}
                      className="hm-pet"
                      style={{ '--tone': toneColor } as React.CSSProperties}
                    >
                      <div className="hm-pet-top">
                        <span
                          className="hm-ava"
                          style={{ '--tone': toneColor } as React.CSSProperties}
                        >
                          <SpeciesIcon species={tone} size={20} />
                        </span>
                        <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                          <Link href="/client/pets" className="linkish hm-pet-name">
                            {p.name}
                          </Link>
                          <span className="cell-sub">
                            {spName} · {age}
                          </span>
                        </span>
                      </div>

                      <div className={`hm-pet-next ${petAppt ? 'has' : ''}`}>
                        <Calendar className="ic" />
                        <span>
                          {petAppt
                            ? `Приём ${new Date(petAppt.startAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} в ${new Date(petAppt.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })}`
                            : 'Нет активных записей'}
                        </span>
                      </div>

                      <Link
                        href={`/client/book?petId=${p.id}`}
                        className="btn btn-outline btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <CalendarPlus className="ic" />
                        <span>Записать</span>
                      </Link>
                    </div>
                  );
                })}

                <Link
                  href="/client/pets?action=create"
                  className="hm-pet hm-pet-add"
                  style={{ textDecoration: 'none' }}
                >
                  <Plus className="ic ic-20" />
                  <span>Добавить питомца</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ДВЕ КОЛОНКИ: БЛИЖАЙШИЕ ЗАПИСИ (С ГРУППИРОВКОЙ ПО ДНЯМ) + БОКОВИК (ВАКЦИНАЦИЯ + УВЕДОМЛЕНИЯ) */}
          <div className="hm-grid">
            {/* Левая колонка: Записи, сгруппированные по дням */}
            <section className="island">
              <div className="island-head">
                <span className="island-title">
                  <Calendar className="ic" />
                  Ближайшие записи
                </span>
                <Link href="/client/appointments" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                  <span>Все записи</span>
                  <ChevronRight className="ic" />
                </Link>
              </div>
              <div className="island-body" style={{ paddingTop: 0 }}>
                {groupedAppointments.length === 0 ? (
                  <div className="empty" style={{ padding: '24px' }}>
                    <span className="small muted">Нет предстоящих записей</span>
                  </div>
                ) : (
                  groupedAppointments.map((group) => (
                    <React.Fragment key={group.dateKey}>
                      <div className="hm-day">
                        <span className="hm-day-label">{group.dayLabel}</span>
                        <span className="hm-day-line" />
                        <span className="cell-sub">{group.countText}</span>
                      </div>
                      {group.items.map((a) => {
                        const pet = pets.find((p) => p.id === a.petId);
                        const tone = getSpeciesTone(pet?.speciesId);
                        const toneColor = SP_TONE[tone] || 'var(--primary)';
                        const svc = servicesMap[a.serviceId];
                        const vet = vetsMap[a.veterinarianId];
                        const vetName = vet ? getDoctorDisplay(vet).name : 'Врач клиники';

                        return (
                          <Link
                            key={a.id}
                            href="/client/appointments"
                            className="hm-appt"
                            style={{
                              '--st': ST_COL[a.status] || 'var(--border)',
                              textDecoration: 'none',
                            } as React.CSSProperties}
                          >
                            <span className="hm-appt-time">
                              {new Date(a.startAt).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Europe/Moscow',
                              })}
                            </span>
                            <span
                              className="hm-ava sm"
                              style={{ '--tone': toneColor } as React.CSSProperties}
                            >
                              <SpeciesIcon species={tone} size={16} />
                            </span>
                            <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                              <span className="cell-main hm-ell">
                                {pet?.name || 'Питомец'} — {svc?.name || 'Приём'}
                              </span>
                              <span className="cell-sub hm-ell">
                                {vetName} · {a.priceSnapshot ? `${a.priceSnapshot.toLocaleString('ru-RU')} ₽` : '1 500 ₽'}
                              </span>
                            </span>
                            <span className={`badge st badge-${a.status}`}>
                              {STATUS_SHORT[a.status] || a.status}
                            </span>
                          </Link>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </div>
            </section>

            {/* Правая колонка: Вакцинация + Уведомления */}
            <div className="col hm-side" style={{ gap: '8px', minWidth: 0 }}>
              {/* Остров «Вакцинация» с раскраской сроков (due-over / due-soon) */}
              <section className="island" style={{ flex: 'none' }}>
                <div className="island-head">
                  <span className="island-title">
                    <Syringe className="ic" />
                    Вакцинация
                  </span>
                  <Link href="/client/appointments?tab=VACC" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                    <span>Все</span>
                    <ChevronRight className="ic" />
                  </Link>
                </div>
                <div className="island-body hm-list" style={{ paddingTop: 0 }}>
                  {vaccinations.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--muted-foreground)]">
                      Данных о прививках нет
                    </div>
                  ) : (
                    vaccinations.slice(0, 4).map((v) => {
                      const pet = pets.find((p) => p.id === v.petId);
                      const dueInfo = getDueInfo(v.nextDueOn);

                      return (
                        <div
                          key={v.id}
                          className={`hm-vac ${dueInfo.cls}`}
                        >
                          <span className="hm-vac-ic">
                            <Syringe className="ic" />
                          </span>
                          <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                            <span className="cell-main hm-ell">
                              {pet?.name || 'Питомец'} — {v.name}
                            </span>
                            <span className="cell-sub">
                              Следующая доза {dueInfo.label}
                            </span>
                          </span>
                          <span className={`badge ${dueInfo.cls}`}>
                            {dueInfo.text}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Остров «Уведомления» */}
              <section className="island hm-notifs" id="notifs">
                <div className="island-head">
                  <span className="island-title">
                    <Bell className="ic" />
                    Уведомления {unreadNotifsCount > 0 && <span className="count">{unreadNotifsCount} новых</span>}
                  </span>
                  <Link href="/client/dashboard" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                    <span>Все</span>
                    <ChevronRight className="ic" />
                  </Link>
                </div>
                <div className="island-body" style={{ padding: '0 6px 8px' }}>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--muted-foreground)]">
                      Новых уведомлений нет
                    </div>
                  ) : (
                    notifications.slice(0, 3).map((n) => (
                      <div key={n.id} className={`notif ${!n.readAt ? 'unread' : ''}`}>
                        <span
                          className="notif-ic"
                          style={{
                            background: 'var(--primary-soft)',
                            color: 'var(--primary-text)',
                          }}
                        >
                          <Bell className="ic" />
                        </span>
                        <span className="col" style={{ gap: '2px', textAlign: 'left', minWidth: 0 }}>
                          <span className="notif-title">{n.title || 'Оповещение'}</span>
                          <span className="notif-body">{n.body || ''}</span>
                        </span>
                        {n.createdAt && (
                          <span className="notif-time">
                            {new Date(n.createdAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Europe/Moscow',
                            })}
                            {!n.readAt && <span className="dot accent" />}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
