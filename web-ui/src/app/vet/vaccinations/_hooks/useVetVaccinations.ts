import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { vetApi } from '@/modules/vet/api';
import { clinicApi } from '@/modules/clinic/api';
import type {
  CreateVaccinationRequest,
  Pet,
  UpdateVaccinationRequest,
  Vaccination,
} from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { useShellHeader } from '@/components/layout/AppShell';
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError, toIdNameMap } from '@/shared/lib';
import { getVetVaccinationDueInfo } from '../../dashboard/_components/vetHelpers';

export type VaccinationStatusFilter = 'ALL' | 'OVERDUE' | 'SOON' | 'OK';

const PAGE_SIZE = 10;

async function fetchAllFilteredVaccinations(params: {
  petId?: string;
  name?: string;
  nextDueFrom?: string;
  nextDueTo?: string;
}): Promise<Vaccination[]> {
  return fetchAllPages(
    (page, size) => vetApi.getVaccinations({ page, size, ...params }),
    { pageSize: 100, maxPages: 30, concurrency: 4 }
  );
}

export function useVetVaccinations(options?: {
  initialPetId?: string | null;
  initialSelId?: string | null;
}) {
  const initialPetId = options?.initialPetId ?? null;
  const initialSelId = options?.initialSelId ?? null;
  const { toast } = useToast();

  const [petFilter, setPetFilter] = useState<string>(initialPetId || '');
  const [nameQuery, setNameQuery] = useState<string>('');
  const [nextDueFrom, setNextDueFrom] = useState<string>('');
  const [nextDueTo, setNextDueTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<VaccinationStatusFilter>('ALL');
  const [page, setPage] = useState<number>(0);

  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [patients, setPatients] = useState<Pet[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVac, setSelectedVac] = useState<Vaccination | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingVac, setEditingVac] = useState<Vaccination | null>(null);

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);
  const petsMapRef = useRef<Record<string, Pet>>({});
  petsMapRef.current = petsMap;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    clinicApi
      .getSpecies()
      .then((sp) => {
        if (!cancelled && isMountedRef.current) setSpeciesList(Array.isArray(sp) ? sp : []);
      })
      .catch(() => {});
    vetApi
      .getPatients()
      .then((pts) => {
        if (cancelled || !isMountedRef.current) return;
        const safePts = (Array.isArray(pts) ? pts : [])
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        setPatients(safePts);
        const map: Record<string, Pet> = {};
        safePts.forEach((p) => {
          map[p.id] = p;
        });
        setPetsMap((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const loadVaccinations = useCallback(
    async (silent = false) => {
      const seq = ++loadSeqRef.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const query = {
          petId: petFilter || undefined,
          name: nameQuery.trim() || undefined,
          nextDueFrom: nextDueFrom || undefined,
          nextDueTo: nextDueTo || undefined,
        };

        let pageItems: Vaccination[] = [];
        let totEl = 0;
        let totPg = 1;

        if (statusFilter === 'ALL') {
          const res = await vetApi.getVaccinations({ page, size: PAGE_SIZE, ...query });
          if (!isMountedRef.current || seq !== loadSeqRef.current) return;
          pageItems = res?.items ?? [];
          totEl = res?.totalElements ?? pageItems.length;
          totPg = Math.max(1, res?.totalPages ?? 1);
        } else {
          const all = await fetchAllFilteredVaccinations(query);
          if (!isMountedRef.current || seq !== loadSeqRef.current) return;
          const filtered = all.filter((v) => {
            const st = getVetVaccinationDueInfo(v.nextDueOn).status;
            if (statusFilter === 'OVERDUE') return st === 'OVERDUE';
            if (statusFilter === 'SOON') return st === 'SOON';
            return st === 'LATER' || st === 'NONE';
          });
          totEl = filtered.length;
          totPg = Math.max(1, Math.ceil(totEl / PAGE_SIZE));
          const safePage = Math.min(page, totPg - 1);
          pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
          if (safePage !== page) setPage(safePage);
        }

        setVaccinations(pageItems);
        setTotalElements(totEl);
        setTotalPages(totPg);
        setError(null);
        setSelectedVac((prev) => (prev ? pageItems.find((v) => v.id === prev.id) ?? prev : null));
      } catch (err: unknown) {
        if (!isMountedRef.current || seq !== loadSeqRef.current) return;
        if (!silent) {
          setError(formatApiError(err, 'Не удалось загрузить журнал прививок'));
        }
      } finally {
        if (isMountedRef.current && seq === loadSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [petFilter, nameQuery, nextDueFrom, nextDueTo, statusFilter, page]
  );

  useEffect(() => {
    void loadVaccinations();
  }, [loadVaccinations]);

  useEffect(() => {
    const missingPetIds = Array.from(
      new Set(vaccinations.map((v) => v.petId).filter((id) => id && !petsMapRef.current[id]))
    );
    if (missingPetIds.length === 0) return;
    let cancelled = false;
    vetApi
      .getPatientPetsByIds(missingPetIds, petsMapRef.current)
      .then((resolved) => {
        if (cancelled || !isMountedRef.current) return;
        if (Object.keys(resolved).length > 0) {
          setPetsMap((prev) => ({ ...prev, ...resolved }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [vaccinations]);

  useEffect(() => {
    if (!initialSelId || loading || appliedSelRef.current === initialSelId) return;
    appliedSelRef.current = initialSelId;
    const found = vaccinations.find((v) => v.id === initialSelId);
    if (found) setSelectedVac(found);
  }, [initialSelId, loading, vaccinations]);

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  useShellHeader({
    crumbGroup: 'Врач',
    crumb: 'Прививки',
    crumb2: selectedVac?.name || undefined,
  });

  const openCreateModal = useCallback(() => {
    setEditingVac(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((vac: Vaccination) => {
    setEditingVac(vac);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingVac(null);
  }, []);

  const handleCreateVaccination = useCallback(
    async (payload: CreateVaccinationRequest) => {
      const created = await vetApi.createVaccination(payload);
      const petName = petsMap[payload.petId]?.name || 'Пациент';
      toast('Прививка внесена', `${petName} — ${payload.name}`);
      await loadVaccinations(true);
      if (isMountedRef.current && created) {
        setSelectedVac(created);
      }
    },
    [petsMap, loadVaccinations, toast]
  );

  const handleUpdateVaccination = useCallback(
    async (id: string, payload: UpdateVaccinationRequest) => {
      const updated = await vetApi.updateVaccination(id, payload);
      toast(
        'Прививка обновлена',
        payload.nextDueOn ? undefined : 'Дата ревакцинации очищена'
      );
      await loadVaccinations(true);
      if (isMountedRef.current && updated) {
        setSelectedVac((prev) => (prev?.id === id ? updated : prev));
      }
    },
    [loadVaccinations, toast]
  );

  const resetFilters = useCallback(() => {
    setPetFilter('');
    setNameQuery('');
    setNextDueFrom('');
    setNextDueTo('');
    setStatusFilter('ALL');
    setPage(0);
  }, []);

  return {
    petFilter,
    setPetFilter: (v: string) => {
      setPetFilter(v);
      setPage(0);
    },
    nameQuery,
    setNameQuery: (v: string) => {
      setNameQuery(v);
      setPage(0);
    },
    nextDueFrom,
    setNextDueFrom: (v: string) => {
      setNextDueFrom(v);
      setPage(0);
    },
    nextDueTo,
    setNextDueTo: (v: string) => {
      setNextDueTo(v);
      setPage(0);
    },
    statusFilter,
    setStatusFilter: (v: VaccinationStatusFilter) => {
      setStatusFilter(v);
      setPage(0);
    },
    page,
    setPage,
    resetFilters,
    vaccinations,
    totalElements,
    totalPages,
    patients,
    petsMap,
    speciesMap,
    loading,
    error,
    reload: loadVaccinations,
    selectedVac,
    setSelectedVac,
    modalOpen,
    editingVac,
    openCreateModal,
    openEditModal,
    closeModal,
    handleCreateVaccination,
    handleUpdateVaccination,
  };
}
