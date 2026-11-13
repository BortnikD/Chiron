import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { vetApi } from '@/modules/vet/api';
import { clinicApi } from '@/modules/clinic/api';
import type {
  Appointment,
  CreateVaccinationRequest,
  Pet,
  UpdateVaccinationRequest,
  Vaccination,
} from '@/modules/client/types';
import type { Service, Species } from '@/modules/clinic/types';
import { useShellHeader } from '@/components/layout/AppShell';
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError, mapWithConcurrency, toIdNameMap } from '@/shared/lib';

const DEFAULT_PAGE_SIZE = 20;

async function fetchPetAppointments(petId: string): Promise<Appointment[]> {
  return fetchAllPages(
    (page, size) => vetApi.getAppointments({ petId, page, size, direction: 'DESC' }),
    { pageSize: 100, maxPages: 10, concurrency: 2 }
  );
}

export function useVetPatients(initialSelId?: string | null) {
  const { toast } = useToast();

  const [patients, setPatients] = useState<Pet[]>([]);
  const [appointmentsByPet, setAppointmentsByPet] = useState<Record<string, Appointment[]>>({});
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [speciesFilter, setSpeciesFilterState] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [selectedPatient, setSelectedPatient] = useState<Pet | null>(null);
  const [patientVacs, setPatientVacs] = useState<Vaccination[]>([]);
  const [vacsError, setVacsError] = useState<string | null>(null);
  const [isVacModalOpen, setIsVacModalOpen] = useState(false);
  const [editingVac, setEditingVac] = useState<Vaccination | null>(null);

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);
  const activePatientIdRef = useRef<string | null>(null);
  const vacReqSeqRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);
  const petApptsCacheRef = useRef<Map<string, Appointment[]>>(new Map());
  const refsLoadedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === debouncedSearch) return;
    const timer = window.setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch]);

  const loadRefs = useCallback(async () => {
    try {
      const [speciesData, servicesData] = await Promise.all([
        clinicApi.getSpecies().catch(() => [] as Species[]),
        clinicApi.getServices().catch(() => [] as Service[]),
      ]);
      if (!isMountedRef.current) return;
      const safeSpecies = Array.isArray(speciesData) ? speciesData : [];
      const safeServices = Array.isArray(servicesData) ? servicesData : [];
      setSpeciesList(safeSpecies);
      setServicesMap(toIdNameMap(safeServices));
      refsLoadedRef.current = true;
    } catch {
      // Справочники загрузятся повторно при reload
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  const loadData = useCallback(
    async (silent = false) => {
      const seq = ++loadSeqRef.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      } else {
        petApptsCacheRef.current.clear();
      }
      if (!refsLoadedRef.current) {
        void loadRefs();
      }
      try {
        const res = await vetApi.getPatientsPage({
          page,
          size: pageSize,
          speciesId: speciesFilter || undefined,
          name: debouncedSearch || undefined,
        });

        if (!isMountedRef.current || seq !== loadSeqRef.current) return;

        const safePatients = Array.isArray(res?.items) ? res.items : [];
        const safeTotalElements = res?.totalElements ?? safePatients.length;
        const safeTotalPages = Math.max(1, res?.totalPages ?? 1);

        if (silent || petApptsCacheRef.current.size === 0) {
          const allVetAppts = await fetchAllPages(
            (pg, sz) => vetApi.getAppointments({ page: pg, size: sz, direction: 'DESC' }),
            { pageSize: 100, maxPages: 3, concurrency: 2 }
          ).catch(() => [] as Appointment[]);
          if (!isMountedRef.current || seq !== loadSeqRef.current) return;
          petApptsCacheRef.current.clear();
          for (const appt of allVetAppts) {
            if (!appt.petId) continue;
            const list = petApptsCacheRef.current.get(appt.petId) || [];
            list.push(appt);
            petApptsCacheRef.current.set(appt.petId, list);
          }
        }

        const nextApptsByPet: Record<string, Appointment[]> = {};
        for (const p of safePatients) {
          nextApptsByPet[p.id] = petApptsCacheRef.current.get(p.id) || [];
        }

        setError(null);
        setPatients(safePatients);
        setTotalElements(safeTotalElements);
        setTotalPages(safeTotalPages);
        setAppointmentsByPet((prev) => ({ ...prev, ...nextApptsByPet }));

        setSelectedPatient((prev) => {
          if (!prev) return null;
          return safePatients.find((p) => p.id === prev.id) ?? prev;
        });
      } catch (err: unknown) {
        if (!isMountedRef.current || seq !== loadSeqRef.current) return;
        if (!silent) {
          setError(formatApiError(err, 'Не удалось загрузить список пациентов'));
        }
      } finally {
        if (isMountedRef.current && seq === loadSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [page, pageSize, speciesFilter, debouncedSearch, loadRefs]
  );

  useEffect(() => {
    void loadData();
    const handleRefresh = () => void loadData(true);
    window.addEventListener('chiron:notification-received', handleRefresh);
    window.addEventListener('chiron:vet-appointments-updated', handleRefresh);
    return () => {
      window.removeEventListener('chiron:notification-received', handleRefresh);
      window.removeEventListener('chiron:vet-appointments-updated', handleRefresh);
    };
  }, [loadData]);

  useEffect(() => {
    if (!initialSelId || loading || appliedSelRef.current === initialSelId) return;
    appliedSelRef.current = initialSelId;
    const found = patients.find((p) => p.id === initialSelId);
    if (found) {
      setSelectedPatient(found);
      return;
    }
    let cancelled = false;
    Promise.all([
      vetApi.getPatientPet(initialSelId),
      petApptsCacheRef.current.has(initialSelId)
        ? Promise.resolve(petApptsCacheRef.current.get(initialSelId) || [])
        : fetchPetAppointments(initialSelId).catch(() => [] as Appointment[]),
    ])
      .then(([pet, appts]) => {
        if (cancelled || !isMountedRef.current || !pet) return;
        petApptsCacheRef.current.set(pet.id, appts);
        setAppointmentsByPet((prev) => ({ ...prev, [pet.id]: appts }));
        setSelectedPatient(pet);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialSelId, loading, patients]);

  useShellHeader({
    crumbGroup: 'Врач',
    crumb: 'Пациенты',
    crumb2: selectedPatient?.name || undefined,
  });

  const loadPatientVaccinations = useCallback(async (petId: string) => {
    const reqSeq = ++vacReqSeqRef.current;
    setVacsError(null);
    try {
      const res = await vetApi.getVaccinations(0, 100, petId);
      if (
        !isMountedRef.current ||
        activePatientIdRef.current !== petId ||
        reqSeq !== vacReqSeqRef.current
      ) {
        return;
      }
      setPatientVacs(res?.items || []);
    } catch (err: unknown) {
      if (
        !isMountedRef.current ||
        activePatientIdRef.current !== petId ||
        reqSeq !== vacReqSeqRef.current
      ) {
        return;
      }
      setPatientVacs([]);
      setVacsError(formatApiError(err, 'Не удалось загрузить историю прививок'));
    }
  }, []);

  useEffect(() => {
    const petId = selectedPatient?.id ?? null;
    activePatientIdRef.current = petId;
    setPatientVacs([]);
    setVacsError(null);
    if (!petId) {
      vacReqSeqRef.current += 1;
      return;
    }
    void loadPatientVaccinations(petId);
  }, [selectedPatient?.id, loadPatientVaccinations]);

  const openCreateVaccination = useCallback(() => {
    setEditingVac(null);
    setIsVacModalOpen(true);
  }, []);

  const openEditVaccination = useCallback((vac: Vaccination) => {
    setEditingVac(vac);
    setIsVacModalOpen(true);
  }, []);

  const closeVaccinationModal = useCallback(() => {
    setIsVacModalOpen(false);
    setEditingVac(null);
  }, []);

  const handleAddVaccination = useCallback(
    async (payload: CreateVaccinationRequest): Promise<void> => {
      await vetApi.createVaccination(payload);
      const pName =
        patients.find((p) => p.id === payload.petId)?.name ||
        selectedPatient?.name ||
        'Пациент';
      toast('Прививка внесена', `${pName} — ${payload.name}`);
      if (isMountedRef.current && activePatientIdRef.current === payload.petId) {
        await loadPatientVaccinations(payload.petId);
      }
    },
    [patients, selectedPatient?.name, loadPatientVaccinations, toast]
  );

  const handleUpdateVaccination = useCallback(
    async (id: string, payload: UpdateVaccinationRequest): Promise<void> => {
      await vetApi.updateVaccination(id, payload);
      toast(
        'Прививка обновлена',
        payload.nextDueOn ? undefined : 'Дата ревакцинации очищена'
      );
      if (isMountedRef.current && activePatientIdRef.current) {
        await loadPatientVaccinations(activePatientIdRef.current);
      }
    },
    [loadPatientVaccinations, toast]
  );

  const appointments = useMemo(
    () => Object.values(appointmentsByPet).flat(),
    [appointmentsByPet]
  );

  const setSpeciesFilter = useCallback((next: string) => {
    setSpeciesFilterState(next);
    setPage(0);
  }, []);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPage(0);
  }, []);

  return {
    patients,
    appointments,
    speciesList,
    servicesMap,
    loading,
    error,
    reload: loadData,
    search,
    setSearch,
    speciesFilter,
    setSpeciesFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    totalPages,
    viewMode,
    setViewMode,
    selectedPatient,
    setSelectedPatient,
    patientVacs,
    vacsError,
    isVacModalOpen,
    editingVac,
    openCreateVaccination,
    openEditVaccination,
    closeVaccinationModal,
    handleAddVaccination,
    handleUpdateVaccination,
  };
}
