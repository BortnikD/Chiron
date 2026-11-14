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
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError, toIdNameMap } from '@/shared/lib';
import { useResourceList } from '@/shared/hooks';
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

export interface VetVaccinationsFiltersState {
  petFilter: string;
  nameQuery: string;
  nextDueFrom: string;
  nextDueTo: string;
  statusFilter: VaccinationStatusFilter;
}

export function useVetVaccinations(options?: {
  initialPetId?: string | null;
  initialSelId?: string | null;
}) {
  const initialPetId = options?.initialPetId ?? null;
  const initialSelId = options?.initialSelId ?? null;
  const { toast } = useToast();

  const [patients, setPatients] = useState<Pet[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [speciesList, setSpeciesList] = useState<Species[]>([]);

  const [selectedVac, setSelectedVac] = useState<Vaccination | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingVac, setEditingVac] = useState<Vaccination | null>(null);

  const isMountedRef = useRef(true);
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

  const resource = useResourceList<Vaccination, VetVaccinationsFiltersState>({
    fetcher: async ({ page, pageSize, filters }) => {
      const query = {
        petId: filters.petFilter || undefined,
        name: filters.nameQuery.trim() || undefined,
        nextDueFrom: filters.nextDueFrom || undefined,
        nextDueTo: filters.nextDueTo || undefined,
      };

      if (filters.statusFilter === 'ALL') {
        const res = await vetApi.getVaccinations({ page, size: pageSize, ...query });
        return res;
      }

      const all = await fetchAllFilteredVaccinations(query);
      const filtered = all.filter((v) => {
        const st = getVetVaccinationDueInfo(v.nextDueOn).status;
        if (filters.statusFilter === 'OVERDUE') return st === 'OVERDUE';
        if (filters.statusFilter === 'SOON') return st === 'SOON';
        return st === 'LATER' || st === 'NONE';
      });
      const totEl = filtered.length;
      const totPg = Math.max(1, Math.ceil(totEl / pageSize));
      const safePage = Math.min(page, totPg - 1);
      const items = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

      return {
        items,
        totalElements: totEl,
        totalPages: totPg,
      };
    },
    initialFilters: {
      petFilter: initialPetId || '',
      nameQuery: '',
      nextDueFrom: '',
      nextDueTo: '',
      statusFilter: 'ALL',
    },
    urlSyncKeys: ['petFilter', 'nameQuery', 'nextDueFrom', 'nextDueTo', 'statusFilter'],
    defaultPageSize: PAGE_SIZE,
    debouncedKeys: ['nameQuery'],
    debounceMs: 250,
    onSuccess: ({ items }) => {
      if (initialSelId && appliedSelRef.current !== initialSelId) {
        appliedSelRef.current = initialSelId;
        const found = items.find((v) => v.id === initialSelId);
        if (found) setSelectedVac(found);
      } else {
        setSelectedVac((prev) => (prev ? items.find((v) => v.id === prev.id) ?? prev : null));
      }
    },
  });

  useEffect(() => {
    const missingPetIds = Array.from(
      new Set(resource.items.map((v) => v.petId).filter((id) => id && !petsMapRef.current[id]))
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
  }, [resource.items]);

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
      toast('Прививка добавлена', created.name);
      await resource.reload();
      setSelectedVac(created);
    },
    [resource, toast]
  );

  const handleUpdateVaccination = useCallback(
    async (vacId: string, payload: UpdateVaccinationRequest) => {
      const updated = await vetApi.updateVaccination(vacId, payload);
      toast(
        'Прививка обновлена',
        payload.nextDueOn ? undefined : 'Дата ревакцинации очищена'
      );
      await resource.reload();
      setSelectedVac((prev) => (prev?.id === vacId ? updated : prev));
    },
    [resource, toast]
  );

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  return {
    petFilter: resource.filters.petFilter,
    setPetFilter: useCallback((v: string) => resource.setFilter('petFilter', v), [resource]),
    nameQuery: resource.filters.nameQuery,
    setNameQuery: useCallback((v: string) => resource.setFilter('nameQuery', v), [resource]),
    nextDueFrom: resource.filters.nextDueFrom,
    setNextDueFrom: useCallback((v: string) => resource.setFilter('nextDueFrom', v), [resource]),
    nextDueTo: resource.filters.nextDueTo,
    setNextDueTo: useCallback((v: string) => resource.setFilter('nextDueTo', v), [resource]),
    statusFilter: resource.filters.statusFilter,
    setStatusFilter: useCallback(
      (v: VaccinationStatusFilter) => resource.setFilter('statusFilter', v),
      [resource]
    ),
    page: resource.page,
    setPage: resource.setPage,
    resetFilters: resource.resetFilters,
    vaccinations: resource.items,
    totalElements: resource.totalElements,
    totalPages: resource.totalPages,
    patients,
    petsMap,
    speciesMap,
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    selectedVac,
    setSelectedVac,
    modalOpen,
    editingVac,
    openCreateModal,
    openEditModal,
    closeModal,
    handleCreateVaccination,
    handleUpdateVaccination,
    paginationProps: resource.paginationProps,
  };
}
