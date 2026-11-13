'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian, Species } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import { useToast } from '@/shared/components';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import {
  type AppointmentsFilterTab,
  toMoscowDayStartIso,
  toMoscowDayEndExclusiveIso,
} from '../_components/utils';
import { useAppointmentCancel } from './useAppointmentCancel';

export type FilterTab = AppointmentsFilterTab;
export type PageSizeOption = 10 | 20 | 50;

export function useClientAppointments(initialSelectedId?: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [parentApptsMap, setParentApptsMap] = useState<Record<string, Appointment>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTabState] = useState<AppointmentsFilterTab>(() =>
    initialSelectedId ? 'ALL' : 'UPCOMING'
  );
  const [selectedPetId, setSelectedPetIdState] = useState<string>('ALL');
  const [statusChips, setStatusChipsState] = useState<AppointmentStatus[]>([]);
  const [fromDate, setFromDateState] = useState<string>('');
  const [toDate, setToDateState] = useState<string>('');
  const [direction, setDirection] = useState<'ASC' | 'DESC'>(() =>
    initialSelectedId ? 'DESC' : 'ASC'
  );
  const [page, setPage] = useState<number>(0);
  const [size, setSizeState] = useState<PageSizeOption>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const didApplyInitialSelRef = useRef<string | null>(null);
  const apptsReqIdRef = useRef(0);
  const refsReqIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setTab = useCallback((nextTab: AppointmentsFilterTab) => {
    setPage(0);
    setTabState(nextTab);
    setDirection(nextTab === 'UPCOMING' ? 'ASC' : 'DESC');
  }, []);

  const setSelectedPetId = useCallback((nextPetId: string) => {
    setPage(0);
    setSelectedPetIdState(nextPetId);
  }, []);

  const toggleStatusChip = useCallback((status: AppointmentStatus) => {
    setPage(0);
    setStatusChipsState((prev) =>
      prev.includes(status) ? prev.filter((x) => x !== status) : [...prev, status]
    );
  }, []);

  const setFromDate = useCallback((iso: string) => {
    setPage(0);
    setFromDateState(iso);
  }, []);

  const setToDate = useCallback((iso: string) => {
    setPage(0);
    setToDateState(iso);
  }, []);

  const setSize = useCallback((nextSize: PageSizeOption) => {
    setPage(0);
    setSizeState(nextSize);
  }, []);

  const toggleDirection = useCallback(() => {
    setPage(0);
    setDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
  }, []);

  const resetFilters = useCallback(() => {
    setPage(0);
    setTabState('ALL');
    setDirection('DESC');
    setSelectedPetIdState('ALL');
    setStatusChipsState([]);
    setFromDateState('');
    setToDateState('');
  }, []);

  const loadReferences = useCallback(async (isCancelled?: () => boolean) => {
    const reqId = ++refsReqIdRef.current;
    try {
      const [petsRes, svcRes, vetsRes, speciesRes] = await Promise.all([
        clientApi.getPets(),
        clinicApi.getServices(),
        clinicApi.getVeterinarians(),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);
      if (!isMountedRef.current || isCancelled?.() || reqId !== refsReqIdRef.current) return;
      setPets(Array.isArray(petsRes) ? petsRes : []);
      setServices(Array.isArray(svcRes) ? svcRes : []);
      setVeterinarians(Array.isArray(vetsRes) ? vetsRes : []);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
    } catch (err: unknown) {
      if (!isMountedRef.current || isCancelled?.() || reqId !== refsReqIdRef.current) return;
      setError((prev) => prev || formatApiError(err, 'Не удалось загрузить справочники записей'));
    }
  }, []);

  const loadAppointments = useCallback(
    async (isCancelled?: () => boolean, silent = false): Promise<Appointment[] | null> => {
      const reqId = ++apptsReqIdRef.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const defaultStatuses: AppointmentStatus[] | undefined =
        tab === 'UPCOMING'
          ? ['PENDING', 'CONFIRMED']
          : tab === 'HISTORY'
          ? ['COMPLETED', 'CANCELLED', 'NO_SHOW']
          : undefined;
      const effectiveStatuses = statusChips.length > 0 ? statusChips : defaultStatuses;

      const nowIso = new Date().toISOString();
      const fromFilter = fromDate
        ? toMoscowDayStartIso(fromDate)
        : tab === 'UPCOMING'
        ? nowIso
        : undefined;
      const toFilter = toDate ? toMoscowDayEndExclusiveIso(toDate) : undefined;

      try {
        const apptsRes = await clientApi.getAppointments({
          page,
          size,
          direction,
          ...(effectiveStatuses ? { status: effectiveStatuses } : {}),
          ...(selectedPetId !== 'ALL' ? { petId: selectedPetId } : {}),
          ...(fromFilter ? { from: fromFilter } : {}),
          ...(toFilter ? { to: toFilter } : {}),
        });
        if (!isMountedRef.current || isCancelled?.() || reqId !== apptsReqIdRef.current) return null;

        const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
        setAppointments(items);
        setTotalElements(apptsRes?.totalElements ?? items.length);
        setTotalPages(apptsRes?.totalPages ?? (items.length > 0 ? 1 : 0));

        if (initialSelectedId && didApplyInitialSelRef.current !== initialSelectedId) {
          didApplyInitialSelRef.current = initialSelectedId;
          const inList = items.find((item) => item.id === initialSelectedId);
          if (inList) {
            setSelectedAppt(inList);
          } else {
            void clientApi
              .getAppointmentById(initialSelectedId)
              .then((fetched) => {
                if (isMountedRef.current && fetched) setSelectedAppt(fetched);
              })
              .catch(() => {});
          }
        } else {
          setSelectedAppt((prev) => {
            if (!prev) return null;
            return items.find((item) => item.id === prev.id) ?? prev;
          });
        }
        return items;
      } catch (err: unknown) {
        if (!isMountedRef.current || isCancelled?.() || reqId !== apptsReqIdRef.current) return null;
        if (!silent) {
          setError(formatApiError(err, 'Не удалось загрузить записи на приём'));
        }
        return null;
      } finally {
        if (isMountedRef.current && !isCancelled?.() && reqId === apptsReqIdRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [tab, selectedPetId, statusChips, fromDate, toDate, direction, page, size, initialSelectedId]
  );

  useEffect(() => {
    let cancelled = false;
    void loadReferences(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadReferences]);

  useEffect(() => {
    let cancelled = false;
    void loadAppointments(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadAppointments]);

  useEffect(() => {
    const parentId = selectedAppt?.followUpOf;
    if (!parentId) return;
    const inList = appointments.find((a) => a.id === parentId);
    if (inList) {
      setParentApptsMap((prev) => (prev[parentId] ? prev : { ...prev, [parentId]: inList }));
      return;
    }
    if (parentApptsMap[parentId]) return;

    let cancelled = false;
    void clientApi
      .getAppointmentById(parentId)
      .then((fetched) => {
        if (!cancelled && isMountedRef.current && fetched) {
          setParentApptsMap((prev) => ({ ...prev, [parentId]: fetched }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedAppt?.followUpOf, appointments, parentApptsMap]);

  useEffect(() => {
    const handleNotification = () => {
      void loadAppointments(undefined, true);
    };
    window.addEventListener('chiron:notification-received', handleNotification);
    window.addEventListener('chiron:notifications-updated', handleNotification);
    return () => {
      window.removeEventListener('chiron:notification-received', handleNotification);
      window.removeEventListener('chiron:notifications-updated', handleNotification);
    };
  }, [loadAppointments]);

  const reload = useCallback(() => {
    void loadReferences();
    void loadAppointments();
  }, [loadReferences, loadAppointments]);

  const selectAppointmentById = useCallback(
    async (id: string) => {
      const local = appointments.find((a) => a.id === id) || parentApptsMap[id];
      if (local) {
        setSelectedAppt(local);
        return;
      }
      try {
        const fetched = await clientApi.getAppointmentById(id);
        if (isMountedRef.current && fetched) {
          setSelectedAppt(fetched);
        }
      } catch (err: unknown) {
        toast('Не удалось открыть запись', formatApiError(err, 'Запись недоступна'), 'err');
      }
    },
    [appointments, parentApptsMap, toast]
  );

  const petsMap = useMemo(() => Object.fromEntries(pets.map((p) => [p.id, p])), [pets]);
  const servicesMap = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
  const vetsMap = useMemo(() => Object.fromEntries(veterinarians.map((v) => [v.id, v])), [veterinarians]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const cancelModal = useAppointmentCancel({
    selectedAppt,
    setSelectedAppt,
    loadAppointments,
    isMountedRef,
  });

  return {
    loading,
    error,
    reload,
    currentUserId: user?.id,
    pets,
    petsMap,
    servicesMap,
    vetsMap,
    speciesMap,
    parentApptsMap,
    tab,
    setTab,
    selectedPetId,
    setSelectedPetId,
    statusChips,
    toggleStatusChip,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    direction,
    toggleDirection,
    resetFilters,
    page,
    setPage,
    size,
    setSize,
    totalElements,
    totalPages,
    selectedAppt,
    setSelectedAppt,
    selectAppointmentById,
    filteredAppointments: appointments,
    ...cancelModal,
  };
}
