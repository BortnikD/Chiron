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
import { fetchAllPages, formatApiError, toIdNameMap } from '@/shared/lib';

async function fetchAllVetAppointments(): Promise<Appointment[]> {
  return fetchAllPages(
    (page, size) => vetApi.getAppointments({ page, size, direction: 'DESC' }),
    { pageSize: 100, maxPages: 50, concurrency: 4 }
  );
}

export function useVetPatients(initialSelId?: string | null) {
  const { toast } = useToast();

  const [patients, setPatients] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async (silent = false) => {
    const seq = ++loadSeqRef.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [patientsData, apptsData, speciesData, servicesData] = await Promise.all([
        vetApi.getPatients(silent),
        fetchAllVetAppointments().catch(() => [] as Appointment[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
        clinicApi.getServices().catch(() => [] as Service[]),
      ]);

      if (!isMountedRef.current || seq !== loadSeqRef.current) return;

      const safePatients = (Array.isArray(patientsData) ? patientsData : [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      const safeSpecies = Array.isArray(speciesData) ? speciesData : [];
      const safeServices = Array.isArray(servicesData) ? servicesData : [];

      setError(null);
      setPatients(safePatients);
      setAppointments(apptsData);
      setSpeciesList(safeSpecies);
      setServicesMap(toIdNameMap(safeServices));

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
  }, []);

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
    vetApi
      .getPatientPet(initialSelId)
      .then((pet) => {
        if (cancelled || !isMountedRef.current || !pet) return;
        setPatients((prev) => (prev.some((p) => p.id === pet.id) ? prev : [pet, ...prev]));
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

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();
    return patients.filter((p) => {
      if (speciesFilter && p.speciesId !== speciesFilter) return false;
      if (!q) return true;
      const pName = p.name.toLowerCase();
      const sName = (p.species?.name || p.speciesName || speciesMap[p.speciesId] || '').toLowerCase();
      return pName.includes(q) || sName.includes(q);
    });
  }, [patients, search, speciesFilter, speciesMap]);

  return {
    patients,
    filteredPatients,
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
