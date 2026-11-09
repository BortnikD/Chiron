'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { AppShell } from '../../../components/layout/AppShell';
import { clientApi, clinicApi, notificationsApi } from '../../../api';
import { Pet, Appointment, Vaccination, AppNotification, Species, Service, Veterinarian } from '../../../types';
import {
  NextAppointmentBanner,
  ClientPetsCarousel,
  ClientAppointmentsIsland,
  ClientQuickActions,
  ClientVaccinationsIsland,
  ClientNotificationsIsland,
} from './_components';

/**
 * Главная страница личного кабинета клиента.
 * Компактный оркестратор: загрузка профиля питомцев, ближайших записей, вакцинаций и координация виджетов.
 */
export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);

  useEffect(() => {
    Promise.all([
      clientApi.getPets(),
      clientApi.getAppointments(0, 30),
      clinicApi.getSpecies(),
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
      notificationsApi.getNotifications(0, 5),
    ]).then(async ([petsData, apptsData, spData, svcData, vetsData, notifsData]) => {
      const safePets = Array.isArray(petsData) ? petsData : [];
      setPets(safePets);
      setAppointments(apptsData?.items ?? (Array.isArray(apptsData) ? apptsData : []));
      setSpeciesList(Array.isArray(spData) ? spData : []);
      setServices(Array.isArray(svcData) ? svcData : []);
      setVeterinarians(Array.isArray(vetsData) ? vetsData : []);
      setNotifications(Array.isArray(notifsData) ? notifsData : notifsData?.items || []);

      try {
        const vacResults = await Promise.all(safePets.map((p) => clientApi.getVaccinations(p.id).catch(() => [])));
        setVaccinations(vacResults.flat());
      } catch {
        setVaccinations([]);
      }
    }).catch((err) => {
      console.error('Failed to load dashboard data', err);
    });
  }, []);

  const speciesMap = useMemo(() => Object.fromEntries(speciesList.map((s) => [s.id, s.name])), [speciesList]);
  const servicesMap = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
  const vetsMap = useMemo(() => Object.fromEntries(veterinarians.map((v) => [v.id, v])), [veterinarians]);

  // Предстоящие записи и ближайший визит
  const upcomingAppts = useMemo(() => {
    return appointments
      .filter((a) => a && (a.status === 'PENDING' || a.status === 'CONFIRMED'))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointments]);

  const nextAppt = upcomingAppts[0] || null;

  // Форматирование сегодняшней даты
  const todayWord = useMemo(() => {
    const d = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    return d.charAt(0).toUpperCase() + d.slice(1);
  }, []);

  // Количество прививок к сроку (просроченные или требующие внимания в течение недели)
  const vacAttnCount = useMemo(() => {
    return vaccinations.filter((v) => v.nextDueOn && Math.ceil((new Date(v.nextDueOn).getTime() - Date.now()) / 86400000) <= 7).length;
  }, [vaccinations]);

  const unreadNotifsCount = notifications.filter((n) => !n.readAt).length;

  // Данные питомца и врача для следующего приёма
  const nextApptPet = nextAppt ? pets.find((p) => p.id === nextAppt.petId) : null;
  const nextApptService = nextAppt ? servicesMap[nextAppt.serviceId] : null;
  const nextApptVet = nextAppt ? vetsMap[nextAppt.veterinarianId] : null;

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

              <ClientQuickActions
                upcomingCount={upcomingAppts.length}
                petsCount={pets.length}
                vacAttnCount={vacAttnCount}
                unreadNotifsCount={unreadNotifsCount}
              />
            </div>

            <NextAppointmentBanner
              nextAppointment={nextAppt}
              pet={nextApptPet}
              service={nextApptService}
              veterinarian={nextApptVet}
              speciesMap={speciesMap}
            />
          </section>

          {/* СЕКЦИЯ: МОИ ПИТОМЦЫ */}
          <ClientPetsCarousel
            pets={pets}
            speciesMap={speciesMap}
            appointments={appointments}
            vaccinations={vaccinations}
          />

          {/* ДВЕ КОЛОНКИ: ЗАПИСИ (С ВКЛАДКАМИ) + БОКОВИК (ВАКЦИНАЦИЯ + УВЕДОМЛЕНИЯ) */}
          <div className="hm-grid">
            <ClientAppointmentsIsland
              appointments={appointments}
              pets={pets}
              servicesMap={servicesMap}
              veterinariansMap={vetsMap}
              speciesMap={speciesMap}
            />

            <div className="col hm-side" style={{ gap: '8px', minWidth: 0 }}>
              <ClientVaccinationsIsland vaccinations={vaccinations} pets={pets} />
              <ClientNotificationsIsland notifications={notifications} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
