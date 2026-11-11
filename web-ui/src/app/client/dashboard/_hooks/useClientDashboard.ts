'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import { notificationsApi } from '@/shared/api';
import type { Pet, Appointment, Vaccination, ClientSummary } from '@/modules/client/types';
import type { Species, Service, Veterinarian } from '@/modules/clinic/types';
import type { AppNotification } from '@/shared/types';
import { formatApiError, formatDateRu, toIdNameMap } from '@/shared/lib';
import { isVaccinationDueSoonOrOverdue } from '../_components/utils';

export function useClientDashboard() {
  const [summary, setSummary] = useState<ClientSummary | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async (isCancelled?: () => boolean, silent = false) => {
    const reqId = ++requestIdRef.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const [
        summaryData,
        petsData,
        upcomingRes,
        vacData,
        spData,
        svcData,
        vetsData,
        notifsData,
      ] = await Promise.all([
        clientApi.getSummary().catch(() => null),
        clientApi.getPets({ isArchived: false, withSummary: true }),
        clientApi.getAppointments({
          status: ['PENDING', 'CONFIRMED'],
          direction: 'ASC',
          page: 0,
          size: 30,
        }),
        clientApi.getVaccinations(),
        clinicApi.getSpecies(),
        clinicApi.getServices(),
        clinicApi.getVeterinarians(),
        notificationsApi.getNotifications(0, 5),
      ]);

      if (!isMountedRef.current || isCancelled?.() || reqId !== requestIdRef.current) return;

      const safePets = Array.isArray(petsData) ? petsData : [];
      const upcomingItems = upcomingRes?.items ?? (Array.isArray(upcomingRes) ? upcomingRes : []);

      setSummary(summaryData);
      setPets(safePets);
      setAppointments(upcomingItems);
      setVaccinations(Array.isArray(vacData) ? vacData : []);
      setSpeciesList(Array.isArray(spData) ? spData : []);
      setServices(Array.isArray(svcData) ? svcData : []);
      setVeterinarians(Array.isArray(vetsData) ? vetsData : []);
      setNotifications(Array.isArray(notifsData) ? notifsData : notifsData?.items || []);
    } catch (err: unknown) {
      if (!isMountedRef.current || isCancelled?.() || reqId !== requestIdRef.current) return;
      if (!silent) {
        setError(formatApiError(err, 'Не удалось загрузить данные кабинета'));
      }
    } finally {
      if (isMountedRef.current && !isCancelled?.() && reqId === requestIdRef.current && !silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadData(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useEffect(() => {
    const handleSilentRefresh = () => {
      void loadData(undefined, true);
    };
    window.addEventListener('chiron:notification-received', handleSilentRefresh);
    window.addEventListener('chiron:notifications-updated', handleSilentRefresh);
    return () => {
      window.removeEventListener('chiron:notification-received', handleSilentRefresh);
      window.removeEventListener('chiron:notifications-updated', handleSilentRefresh);
    };
  }, [loadData]);

  const reload = useCallback(() => {
    void loadData();
  }, [loadData]);

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);
  const servicesMap = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
  const vetsMap = useMemo(() => Object.fromEntries(veterinarians.map((v) => [v.id, v])), [veterinarians]);

  const upcomingAppts = useMemo(() => {
    return appointments
      .filter((a) => a && (a.status === 'PENDING' || a.status === 'CONFIRMED'))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointments]);

  const nextAppt = summary?.nextAppointment ?? upcomingAppts[0] ?? null;

  const todayWord = useMemo(() => {
    const d = formatDateRu(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' });
    return d.charAt(0).toUpperCase() + d.slice(1);
  }, []);

  const derivedVacAttnCount = useMemo(() => {
    const activeIds = new Set(pets.filter((p) => !p.isArchived).map((p) => p.id));
    return vaccinations.filter(
      (v) =>
        (activeIds.size === 0 || activeIds.has(v.petId)) &&
        isVaccinationDueSoonOrOverdue(v.nextDueOn || v.validUntil)
    ).length;
  }, [vaccinations, pets]);

  const upcomingCount = summary?.upcomingAppointments ?? upcomingAppts.length;
  const petsCount = summary?.activePets ?? pets.length;
  const vacAttnCount = summary?.vaccinationsDue ?? derivedVacAttnCount;
  const unreadNotifsCount =
    summary?.unreadNotifications ?? notifications.filter((n) => !n.readAt).length;

  const nextApptPet = nextAppt ? pets.find((p) => p.id === nextAppt.petId) ?? null : null;
  const nextApptService = nextAppt ? servicesMap[nextAppt.serviceId] ?? null : null;
  const nextApptVet = nextAppt ? vetsMap[nextAppt.veterinarianId] ?? null : null;

  return {
    summary,
    pets,
    appointments: upcomingAppts,
    vaccinations,
    notifications,
    loading,
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
  };
}
