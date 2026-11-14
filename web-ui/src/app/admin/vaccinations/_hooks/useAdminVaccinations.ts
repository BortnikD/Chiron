'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Vaccination, Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { useToast } from '@/shared/components';
import { formatApiError, getMoscowTodayIso, addDaysIso } from '@/shared/lib';
import { useResourceList } from '@/shared/hooks';
import type { VaccinationStatusTone } from '../_components/types';

export interface VaccinationSaveInput {
  petId: string;
  name: string;
  administeredOn: string;
  nextDueOn: string | null;
}

export interface AdminVaccinationsFiltersState {
  search: string;
  statusFilter: VaccinationStatusTone;
  petFilter: string;
  nextDueFrom: string;
  nextDueTo: string;
}

export function useAdminVaccinations() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialSel = searchParams.get('sel');

  const [pets, setPets] = useState<Pet[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const petsMapRef = useRef<Record<string, Pet>>({});
  petsMapRef.current = petsMap;

  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ overdue: 0, soon: 0, total: 0 });

  const [selectedVaccination, setSelectedVaccination] = useState<Vaccination | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Vaccination | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const appliedSelRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Загрузка справочников и статистики ключевых показателей
  const loadRefsAndStats = useCallback(async () => {
    const todayIso = getMoscowTodayIso();
    const in30DaysIso = addDaysIso(todayIso, 30);

    try {
      const [allVaxRes, overdueVaxRes, soonVaxRes, petsRes, speciesRes, usersRes] = await Promise.all([
        adminApi.getVaccinations({}, 0, 1).catch(() => null),
        adminApi.getVaccinations({ nextDueTo: todayIso }, 0, 1).catch(() => null),
        adminApi.getVaccinations({ nextDueFrom: todayIso, nextDueTo: in30DaysIso }, 0, 1).catch(() => null),
        adminApi.getPets(0, 100).catch(() => null),
        clinicApi.getSpecies().catch(() => [] as Species[]),
        adminApi.getUsers(0, 100, 'CLIENT').catch(() => null),
      ]);

      if (!isMountedRef.current) return;

      setStats({
        total: allVaxRes?.totalElements ?? 0,
        overdue: overdueVaxRes?.totalElements ?? 0,
        soon: soonVaxRes?.totalElements ?? 0,
      });

      const loadedPets = petsRes?.items || [];
      setPets(loadedPets);
      const pMap: Record<string, Pet> = {};
      loadedPets.forEach((p) => {
        pMap[p.id] = p;
      });
      setPetsMap((prev) => ({ ...prev, ...pMap }));

      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setUsers(usersRes?.items || []);
    } catch {
      // Игнорируем ошибки загрузки справочников
    }
  }, []);

  useEffect(() => {
    void loadRefsAndStats();
  }, [loadRefsAndStats]);

  const resource = useResourceList<Vaccination, AdminVaccinationsFiltersState>({
    fetcher: async ({ page, pageSize, filters }) => {
      let effDueFrom = filters.nextDueFrom || undefined;
      let effDueTo = filters.nextDueTo || undefined;

      const todayIso = getMoscowTodayIso();
      if (filters.statusFilter === 'overdue') {
        effDueTo = effDueTo && effDueTo < todayIso ? effDueTo : todayIso;
      } else if (filters.statusFilter === 'soon') {
        const in30Iso = addDaysIso(todayIso, 30);
        effDueFrom = effDueFrom && effDueFrom > todayIso ? effDueFrom : todayIso;
        effDueTo = effDueTo && effDueTo < in30Iso ? effDueTo : in30Iso;
      }

      const res = await adminApi.getVaccinations(
        {
          name: filters.search.trim() || undefined,
          petId: filters.petFilter !== 'all' ? filters.petFilter : undefined,
          nextDueFrom: effDueFrom,
          nextDueTo: effDueTo,
        },
        page,
        pageSize
      );

      return {
        items: res?.items || [],
        totalElements: res?.totalElements ?? 0,
        totalPages: Math.max(1, res?.totalPages ?? 1),
      };
    },
    defaultPageSize: 20,
    initialFilters: {
      search: '',
      statusFilter: 'all',
      petFilter: 'all',
      nextDueFrom: '',
      nextDueTo: '',
    },
    urlSyncKeys: ['search', 'statusFilter', 'petFilter', 'nextDueFrom', 'nextDueTo'],
    debouncedKeys: ['search'],
    onSuccess: ({ items }) => {
      if (!isMountedRef.current) return;
      setSelectedVaccination((prev) =>
        prev ? items.find((x) => x.id === prev.id) ?? prev : null
      );

      // Догрузка карточек питомцев, отсутствующих в кэше
      const missing = items
        .map((x) => x.petId)
        .filter((id) => id && !petsMapRef.current[id]);
      if (missing.length > 0) {
        Promise.all(
          missing.map((id) => adminApi.getPetById(id).catch(() => null))
        ).then((resolved) => {
          if (!isMountedRef.current) return;
          const nextMap: Record<string, Pet> = {};
          resolved.forEach((pet) => {
            if (pet?.id) nextMap[pet.id] = pet;
          });
          if (Object.keys(nextMap).length > 0) {
            setPetsMap((prev) => ({ ...prev, ...nextMap }));
          }
        });
      }
    },
  });

  useEffect(() => {
    if (!initialSel || resource.loading || appliedSelRef.current === initialSel) return;
    appliedSelRef.current = initialSel;
    const found = resource.items.find((v) => v.id === initialSel);
    if (found) {
      setSelectedVaccination(found);
      return;
    }
    adminApi
      .getVaccinationById(initialSel)
      .then((byId) => {
        if (isMountedRef.current && byId) setSelectedVaccination(byId);
      })
      .catch(() => {});
  }, [initialSel, resource.loading, resource.items]);

  const petMap = useMemo(() => {
    const map = new Map<string, Pet>();
    Object.values(petsMap).forEach((p) => map.set(p.id, p));
    return map;
  }, [petsMap]);

  const handleOpenCreate = useCallback(() => {
    setEditingVaccination(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((v: Vaccination) => {
    setEditingVaccination(v);
    setIsModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingVaccination(null);
  }, []);

  const saveVaccination = useCallback(
    async (data: VaccinationSaveInput, editingId?: string) => {
      if (editingId) {
        await adminApi.updateVaccination(editingId, {
          name: data.name,
          administeredOn: data.administeredOn,
          nextDueOn: data.nextDueOn,
        });
        toast('Прививка обновлена', data.name);
      } else {
        await adminApi.createVaccination({
          petId: data.petId,
          name: data.name,
          administeredOn: data.administeredOn,
          nextDueOn: data.nextDueOn,
        });
        toast('Прививка добавлена', data.name);
      }
      setIsModalOpen(false);
      setEditingVaccination(null);
      await resource.reload();
      void loadRefsAndStats();
    },
    [resource, loadRefsAndStats, toast]
  );

  const requestDelete = useCallback(
    (id: string) => {
      const target =
        resource.items.find((v) => v.id === id) ??
        (selectedVaccination?.id === id ? selectedVaccination : null);
      setDeleteError(null);
      setDeleteTarget(target);
    },
    [resource.items, selectedVaccination]
  );

  const cancelDelete = useCallback(() => {
    if (!deleting) {
      setDeleteTarget(null);
      setDeleteError(null);
    }
  }, [deleting]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteVaccination(deleteTarget.id);
      setSelectedVaccination((prev) => (prev?.id === deleteTarget.id ? null : prev));
      toast('Запись о вакцинации удалена');
      setDeleteTarget(null);
      await resource.reload();
      void loadRefsAndStats();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении'));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, resource, loadRefsAndStats, toast]);

  return {
    vaccinations: resource.items,
    pets,
    petMap,
    speciesList,
    users,
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    search: resource.filters.search,
    setSearch: useCallback((v: string) => resource.setFilter('search', v), [resource]),
    statusFilter: resource.filters.statusFilter,
    setStatusFilter: useCallback(
      (v: VaccinationStatusTone) => resource.setFilter('statusFilter', v),
      [resource]
    ),
    petFilter: resource.filters.petFilter,
    setPetFilter: useCallback((v: string) => resource.setFilter('petFilter', v), [resource]),
    nextDueFrom: resource.filters.nextDueFrom,
    setNextDueFrom: useCallback((v: string) => resource.setFilter('nextDueFrom', v), [resource]),
    nextDueTo: resource.filters.nextDueTo,
    setNextDueTo: useCallback((v: string) => resource.setFilter('nextDueTo', v), [resource]),
    page: resource.page,
    setPage: resource.setPage,
    totalElements: resource.totalElements,
    totalPages: resource.totalPages,
    pageSize: resource.pageSize,
    setPageSize: resource.setPageSize,
    paginationProps: resource.paginationProps,
    selectedVaccination,
    setSelectedVaccination,
    isModalOpen,
    editingVaccination,
    closeFormModal,
    deleteTarget,
    deleting,
    deleteError,
    stats,
    handleOpenCreate,
    handleOpenEdit,
    saveVaccination,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
