import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { vetApi } from '@/modules/vet/api';
import { clinicApi } from '@/modules/clinic/api';
import type {
  Appointment,
  CreateVaccinationRequest,
  Pet,
  Vaccination,
} from '@/modules/client/types';
import type { Service, Species } from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';

export function useVetPatients() {
  const [patients, setPatients] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [selectedPatient, setSelectedPatient] = useState<Pet | null>(null);
  const [patientVacs, setPatientVacs] = useState<Vaccination[]>([]);
  const [vacsError, setVacsError] = useState<string | null>(null);
  const [isAddVacOpen, setIsAddVacOpen] = useState(false);

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);
  const activePatientIdRef = useRef<string | null>(null);
  const vacReqSeqRef = useRef(0);

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
        vetApi.getPatients(),
        vetApi.getAppointments(0, 100),
        clinicApi.getSpecies().catch(() => [] as Species[]),
        clinicApi.getServices().catch(() => [] as Service[]),
      ]);

      if (!isMountedRef.current || seq !== loadSeqRef.current) return;

      const safePatients = Array.isArray(patientsData) ? patientsData : [];
      const safeAppts = apptsData?.items ?? (Array.isArray(apptsData) ? apptsData : []);
      const safeSpecies = Array.isArray(speciesData) ? speciesData : [];
      const safeServices = Array.isArray(servicesData) ? servicesData : [];

      setError(null);
      setPatients(safePatients);
      setAppointments(safeAppts);
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
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await loadData();
    })();
    const handleNotification = () => {
      if (!cancelled) void loadData(true);
    };
    window.addEventListener('chiron:notification-received', handleNotification);
    return () => {
      cancelled = true;
      window.removeEventListener('chiron:notification-received', handleNotification);
    };
  }, [loadData]);

  const loadPatientVaccinations = useCallback(async (petId: string) => {
    const reqSeq = ++vacReqSeqRef.current;
    setVacsError(null);
    try {
      const res = await vetApi.getVaccinations(0, 50, petId);
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

  const handleAddVaccination = useCallback(
    async (payload: CreateVaccinationRequest): Promise<void> => {
      await vetApi.createVaccination(payload);
      if (isMountedRef.current && activePatientIdRef.current === payload.petId) {
        await loadPatientVaccinations(payload.petId);
      }
    },
    [loadPatientVaccinations]
  );

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase().trim();
    return patients.filter((p) => {
      const pName = p.name.toLowerCase();
      const sName = (p.species?.name || p.speciesName || speciesMap[p.speciesId] || '').toLowerCase();
      return pName.includes(q) || sName.includes(q);
    });
  }, [patients, search, speciesMap]);

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
    viewMode,
    setViewMode,
    selectedPatient,
    setSelectedPatient,
    patientVacs,
    vacsError,
    isAddVacOpen,
    setIsAddVacOpen,
    handleAddVaccination,
  };
}
