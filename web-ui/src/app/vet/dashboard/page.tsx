'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { vetApi, clinicApi } from '../../../api';
import { Appointment, AppointmentStatus, Service, Pet } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  VetQueueSummary,
  VetQueueList,
  VetActiveAppointmentDrawer,
  VetQuickScheduleIsland,
} from './_components';

/**
 * Главная страница кабинета ветеринара (Дашборд смены).
 * Компактный оркестратор: координация очереди приёмов, ведения протокола и виджета расписания.
 */
export default function VetDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [apptsRes, svcRes, patientsRes] = await Promise.all([
        vetApi.getAppointments(0, 100),
        clinicApi.getServices(),
        vetApi.getPatients().catch(() => []),
      ]);

      const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
      items.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      setAppointments(items);
      setServices(Array.isArray(svcRes) ? svcRes : []);

      const pMap: Record<string, Pet> = {};
      if (Array.isArray(patientsRes)) {
        patientsRes.forEach((p) => { pMap[p.id] = p; });
      }
      setPetsMap(pMap);

      if (items.length > 0 && !selectedAppt && typeof window !== 'undefined' && window.innerWidth >= 1280) {
        setSelectedAppt(items[0]);
      }
    } catch (err) {
      console.error('Ошибка загрузки дашборда ветеринара', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAppt]);

  useEffect(() => {
    loadAll();
  }, []);

  const servicesMap = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [services]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAppts = useMemo(
    () => appointments.filter((a) => a.startAt.startsWith(todayStr)),
    [appointments, todayStr]
  );
  const pendingAppts = useMemo(
    () => appointments.filter((a) => a.status === 'PENDING'),
    [appointments]
  );
  const currentAppt = useMemo(
    () => appointments.find((a) => a.status === 'IN_PROGRESS') || null,
    [appointments]
  );
  const nextAppt = useMemo(
    () => appointments.find((a) => a.status === 'CONFIRMED' || a.status === 'PENDING') || null,
    [appointments]
  );

  const handleUpdateStatus = async (apptId: string, status: AppointmentStatus) => {
    try {
      await vetApi.updateAppointment(apptId, { status });
      await loadAll();
      if (selectedAppt?.id === apptId) {
        setSelectedAppt((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      alert(err?.message || 'Ошибка обновления статуса');
    }
  };

  return (
    <AppShell title="Кабинет ветеринара" currentSection="Сегодня">
      <div className="col" style={{ gap: 'var(--gap)', width: '100%', minHeight: 0 }}>
        {/* Сводка смены: текущий пациент, ожидающие в очереди, завершенные приемы */}
        <VetQueueSummary
          todayAppointments={todayAppts}
          nextAppointment={nextAppt}
          currentAppointment={currentAppt}
          servicesMap={servicesMap}
          petsMap={petsMap}
          onSelectAppointment={setSelectedAppt}
        />

        <div className="content-row">
          {/* Список приемов на сегодня (.trow / .timeline, действия) */}
          <VetQueueList
            appointments={appointments}
            todayAppointments={todayAppts}
            selectedAppointment={selectedAppt}
            nextAppointment={nextAppt}
            servicesMap={servicesMap}
            petsMap={petsMap}
            loading={loading}
            onSelectAppointment={setSelectedAppt}
            onUpdateStatus={handleUpdateStatus}
          />

          {/* Правая колонка: Протокол приёма + Компактное расписание */}
          <div className="content-col" style={{ width: '420px', flex: 'none' }}>
            <VetActiveAppointmentDrawer
              appointment={selectedAppt}
              services={services}
              servicesMap={servicesMap}
              petsMap={petsMap}
              onClose={() => setSelectedAppt(null)}
              onUpdateStatus={handleUpdateStatus}
              onRefresh={loadAll}
            />

            <VetQuickScheduleIsland
              appointments={appointments}
              pendingAppointments={pendingAppts}
              servicesMap={servicesMap}
              petsMap={petsMap}
              onSelectAppointment={setSelectedAppt}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
