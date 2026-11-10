'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian, Species } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';

export type FilterTab = 'UPCOMING' | 'COMPLETED' | 'ALL';

const PAGE_SIZE = 20;

export function useClientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTabState] = useState<FilterTab>('UPCOMING');
  const [selectedPetId, setSelectedPetIdState] = useState<string>('ALL');
  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const didInitSelectionRef = useRef(false);
  const apptsReqIdRef = useRef(0);
  const refsReqIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const setTab = useCallback((nextTab: FilterTab) => {
    setPage(0);
    setTabState(nextTab);
  }, []);

  const setSelectedPetId = useCallback((nextPetId: string) => {
    setPage(0);
    setSelectedPetIdState(nextPetId);
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

      const statusFilter: AppointmentStatus[] | undefined =
        tab === 'UPCOMING'
          ? ['PENDING', 'CONFIRMED']
          : tab === 'COMPLETED'
          ? ['COMPLETED', 'CANCELLED', 'NO_SHOW']
          : undefined;
      const direction = tab === 'UPCOMING' ? 'ASC' : 'DESC';

      try {
        const apptsRes = await clientApi.getAppointments({
          page,
          size: PAGE_SIZE,
          direction,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(selectedPetId !== 'ALL' ? { petId: selectedPetId } : {}),
        });
        if (!isMountedRef.current || isCancelled?.() || reqId !== apptsReqIdRef.current) return null;

        const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
        setAppointments(items);
        setTotalElements(apptsRes?.totalElements ?? items.length);
        setTotalPages(apptsRes?.totalPages ?? (items.length > 0 ? 1 : 0));

        if (!didInitSelectionRef.current) {
          didInitSelectionRef.current = true;
          if (items.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1280) {
            setSelectedAppt(items[0]);
          }
        } else {
          setSelectedAppt((prev) => (prev ? items.find((item) => item.id === prev.id) ?? null : null));
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
    [tab, selectedPetId, page]
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
    const handleNotification = () => {
      void loadAppointments(undefined, true);
    };
    window.addEventListener('chiron:notification-received', handleNotification);
    return () => window.removeEventListener('chiron:notification-received', handleNotification);
  }, [loadAppointments]);

  const reload = useCallback(() => {
    void loadReferences();
    void loadAppointments();
  }, [loadReferences, loadAppointments]);

  const petsMap = useMemo(() => Object.fromEntries(pets.map((p) => [p.id, p])), [pets]);
  const servicesMap = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
  const vetsMap = useMemo(() => Object.fromEntries(veterinarians.map((v) => [v.id, v])), [veterinarians]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const openCancelModal = useCallback(() => {
    setCancelError(null);
    setIsCancelModalOpen(true);
  }, []);

  const closeCancelModal = useCallback(() => {
    if (!cancelling) {
      setIsCancelModalOpen(false);
    }
  }, [cancelling]);

  const handleCancelAppointment = useCallback(async () => {
    if (!selectedAppt) return;
    const targetId = selectedAppt.id;
    setCancelling(true);
    setCancelError(null);

    try {
      await clientApi.cancelAppointment(targetId, cancelReason.trim() || undefined);
      setIsCancelModalOpen(false);
      setCancelReason('');
      const freshItems = await loadAppointments();
      if (freshItems && isMountedRef.current) {
        setSelectedAppt(freshItems.find((item) => item.id === targetId) ?? null);
      }
    } catch (err: unknown) {
      setCancelError(formatApiError(err, 'Не удалось отменить запись'));
    } finally {
      if (isMountedRef.current) {
        setCancelling(false);
      }
    }
  }, [selectedAppt, cancelReason, loadAppointments]);

  return {
    loading,
    error,
    reload,
    pets,
    petsMap,
    servicesMap,
    vetsMap,
    speciesMap,
    tab,
    setTab,
    selectedPetId,
    setSelectedPetId,
    page,
    setPage,
    totalElements,
    totalPages,
    selectedAppt,
    setSelectedAppt,
    filteredAppointments: appointments,
    isCancelModalOpen,
    cancelReason,
    setCancelReason,
    cancelling,
    cancelError,
    openCancelModal,
    closeCancelModal,
    handleCancelAppointment,
  };
}
