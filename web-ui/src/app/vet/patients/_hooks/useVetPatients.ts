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
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError, toIdNameMap } from '@/shared/lib';
import { useResourceList } from '@/shared/hooks';

const DEFAULT_PAGE_SIZE = 20;

export interface VetPatientsFiltersState {
  search: string;
  speciesFilter: string;
}

export function useVetPatients(initialSelId?: string | null) {
  const { toast } = useToast();

  const [appointmentsByPet, setAppointmentsByPet] = useState<Record<string, Appointment[]>>({});
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [selectedPatient, setSelectedPatient] = useState<Pet | null>(null);
  const [patientVacs, setPatientVacs] = useState<Vaccination[]>([]);
  const [vacsError, setVacsError] = useState<string | null>(null);
  const [isVacModalOpen, setIsVacModalOpen] = useState(false);
  const [editingVac, setEditingVac] = useState<Vaccination | null>(null);

  const isMountedRef = useRef(true);
  const activePatientIdRef = useRef<string | null>(null);
  const vacReqSeqRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);
  const petApptsCacheRef = useRef<Map<string, Appointment[]>>(new Map());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resource = useResourceList<Pet, VetPatientsFiltersState>({
    fetcher: async ({ page, pageSize, filters }) => {
      return vetApi.getPatientsPage({
        page,
        size: pageSize,
        speciesId: filters.speciesFilter || undefined,
        name: filters.search || undefined,
      });
    },
    initialFilters: {
      search: '',
      speciesFilter: '',
    },
    urlSyncKeys: ['search', 'speciesFilter'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    debouncedKeys: ['search'],
    debounceMs: 250,
    onSuccess: async ({ items }) => {
      if (petApptsCacheRef.current.size === 0) {
        const allVetAppts = await fetchAllPages(
          (pg, sz) => vetApi.getAppointments({ page: pg, size: sz, direction: 'DESC' }),
          { pageSize: 100, maxPages: 3, concurrency: 2 }
        ).catch(() => [] as Appointment[]);

        if (!isMountedRef.current) return;
        petApptsCacheRef.current.clear();
        for (const appt of allVetAppts) {
          if (!appt.petId) continue;
          const list = petApptsCacheRef.current.get(appt.petId) || [];
          list.push(appt);
          petApptsCacheRef.current.set(appt.petId, list);
        }
      }

      const nextApptsByPet: Record<string, Appointment[]> = {};
      for (const p of items) {
        nextApptsByPet[p.id] = petApptsCacheRef.current.get(p.id) || [];
      }
      setAppointmentsByPet((prev) => ({ ...prev, ...nextApptsByPet }));

      if (initialSelId && appliedSelRef.current !== initialSelId) {
        appliedSelRef.current = initialSelId;
        const found = items.find((p) => p.id === initialSelId);
        if (found) setSelectedPatient(found);
      } else {
        setSelectedPatient((prev) => {
          if (!prev) return null;
          return items.find((p) => p.id === prev.id) ?? prev;
        });
      }
    },
  });

  const loadRefs = useCallback(async () => {
    try {
      const [speciesData, servicesData] = await Promise.all([
        clinicApi.getSpecies().catch(() => [] as Species[]),
        clinicApi.getServices().catch(() => [] as Service[]),
      ]);
      if (!isMountedRef.current) return;
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      setServicesMap(toIdNameMap(Array.isArray(servicesData) ? servicesData : []));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  const loadPatientVaccinations = useCallback(async (petId: string) => {
    const seq = ++vacReqSeqRef.current;
    setVacsError(null);
    try {
      const vacs = await vetApi.getVaccinations({ petId });
      if (!isMountedRef.current || seq !== vacReqSeqRef.current) return;
      setPatientVacs(Array.isArray(vacs) ? vacs : vacs?.items || []);
    } catch (err: unknown) {
      if (!isMountedRef.current || seq !== vacReqSeqRef.current) return;
      setPatientVacs([]);
      setVacsError(formatApiError(err, 'Не удалось загрузить историю прививок'));
    }
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      activePatientIdRef.current = null;
      setPatientVacs([]);
      setVacsError(null);
      return;
    }
    activePatientIdRef.current = selectedPatient.id;
    void loadPatientVaccinations(selectedPatient.id);
  }, [selectedPatient, loadPatientVaccinations]);

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
    async (payload: CreateVaccinationRequest) => {
      const created = await vetApi.createVaccination(payload);
      toast('Прививка добавлена', created.name);
      if (isMountedRef.current && activePatientIdRef.current) {
        await loadPatientVaccinations(activePatientIdRef.current);
      }
    },
    [loadPatientVaccinations, toast]
  );

  const handleUpdateVaccination = useCallback(
    async (vacId: string, payload: UpdateVaccinationRequest) => {
      await vetApi.updateVaccination(vacId, payload);
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

  return {
    patients: resource.items,
    appointments,
    speciesList,
    servicesMap,
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    search: resource.filters.search,
    setSearch: useCallback((v: string) => resource.setFilter('search', v), [resource]),
    speciesFilter: resource.filters.speciesFilter,
    setSpeciesFilter: useCallback((v: string) => resource.setFilter('speciesFilter', v), [resource]),
    page: resource.page,
    setPage: resource.setPage,
    pageSize: resource.pageSize,
    setPageSize: resource.setPageSize,
    totalElements: resource.totalElements,
    totalPages: resource.totalPages,
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
    paginationProps: resource.paginationProps,
  };
}
