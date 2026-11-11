'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useShellHeader } from '@/components/layout/AppShell';
import { useClientDashboard } from './_hooks/useClientDashboard';
import { NextAppointmentBanner } from './_components/NextAppointmentBanner';
import { ClientPetsCarousel } from './_components/ClientPetsCarousel';
import { ClientAppointmentsIsland } from './_components/ClientAppointmentsIsland';
import { ClientQuickActions } from './_components/ClientQuickActions';
import { ClientVaccinationsIsland } from './_components/ClientVaccinationsIsland';
import { ClientNotificationsIsland } from './_components/ClientNotificationsIsland';

export default function ClientDashboardPage() {
  useShellHeader({ crumbGroup: 'Кабинет', crumb: 'Главная' });
  const { user } = useAuth();
  const {
    pets,
    appointments,
    vaccinations,
    notifications,
    error,
    reload,
    speciesMap,
    servicesMap,
    vetsMap,
    upcomingCount,
    petsCount,
    vacAttnCount,
    unreadNotifsCount,
    nextAppt,
    todayWord,
    nextApptPet,
    nextApptService,
    nextApptVet,
  } = useClientDashboard();

  return (
    <div className="content-row">
      <div className="scroll-col grow">
        {error && (
          <div className="alert alert-destructive" role="alert">
            <AlertCircle className="ic" />
            <div className="row between wrap grow" style={{ gap: '8px', alignItems: 'center' }}>
              <span>{error}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
                Повторить
              </button>
            </div>
          </div>
        )}

        <section className="island hm-hero" style={{ flex: 'none' }}>
          <div className="hm-hero-main">
            <div className="col" style={{ gap: '4px' }}>
              <span className="hm-date">{todayWord}</span>
              <h1 className="h1 hm-title">Здравствуйте, {user?.firstName || 'клиент'}</h1>
              <span className="muted">Вот что ждёт ваших питомцев в ближайшее время</span>
            </div>

            <ClientQuickActions
              upcomingCount={upcomingCount}
              petsCount={petsCount}
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

        <ClientPetsCarousel
          pets={pets}
          speciesMap={speciesMap}
          appointments={appointments}
        />

        <div className="hm-grid">
          <ClientAppointmentsIsland
            appointments={appointments}
            pets={pets}
            servicesMap={servicesMap}
            veterinariansMap={vetsMap}
            speciesMap={speciesMap}
            nextAppointmentId={nextAppt?.id}
          />

          <div className="col hm-side" style={{ gap: '8px', minWidth: 0 }}>
            <ClientVaccinationsIsland vaccinations={vaccinations} pets={pets} />
            <ClientNotificationsIsland
              notifications={notifications}
              unreadCount={unreadNotifsCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
