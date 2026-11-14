'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type { WorkSchedule, ScheduleException } from '@/modules/admin/types';
import type { Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError, toIdNameMap } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export type VetActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface CreateVetInput {
  userId: string;
  specializationId: string;
  bio?: string;
  experienceYears: number;
  isActive: boolean;
  photoFile?: File | null;
}

export type UpdateVetInput = Partial<
  Pick<Veterinarian, 'specializationId' | 'bio' | 'experienceYears' | 'isActive'>
>;

export function useAdminVeterinarians() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialSel = searchParams.get('sel');
  const initialUserId = searchParams.get('userId');

  const initialSpec = searchParams.get('specializationId') || searchParams.get('filterSpec') || 'ALL';
  const initialSpecies = searchParams.get('speciesId') || searchParams.get('filterSpecies') || 'ALL';
  const initialActive = (searchParams.get('filterActive') as VetActiveFilter) || 'ALL';

  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vetPermMap, setVetPermMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterSpec, setFilterSpecState] = useState<string>(initialSpec);
  const [filterSpecies, setFilterSpeciesState] = useState<string>(initialSpecies);
  const [filterActive, setFilterActiveState] = useState<VetActiveFilter>(initialActive);

  const syncVetFiltersToUrl = useCallback((spec: string, species: string, active: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (spec && spec !== 'ALL') url.searchParams.set('filterSpec', spec);
    else url.searchParams.delete('filterSpec');
    if (species && species !== 'ALL') url.searchParams.set('filterSpecies', species);
    else url.searchParams.delete('filterSpecies');
    if (active && active !== 'ALL') url.searchParams.set('filterActive', active);
    else url.searchParams.delete('filterActive');
    const nextSearch = url.searchParams.toString();
    const currentSearch = window.location.search.replace(/^\?/, '');
    if (nextSearch !== currentSearch) {
      window.history.replaceState(null, '', url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash);
    }
  }, []);

  const setFilterSpec = useCallback(
    (v: string) => {
      setFilterSpecState(v);
      syncVetFiltersToUrl(v, filterSpecies, filterActive);
    },
    [filterSpecies, filterActive, syncVetFiltersToUrl]
  );

  const setFilterSpecies = useCallback(
    (v: string) => {
      setFilterSpeciesState(v);
      syncVetFiltersToUrl(filterSpec, v, filterActive);
    },
    [filterSpec, filterActive, syncVetFiltersToUrl]
  );

  const setFilterActive = useCallback(
    (v: VetActiveFilter) => {
      setFilterActiveState(v);
      syncVetFiltersToUrl(filterSpec, filterSpecies, v);
    },
    [filterSpec, filterSpecies, syncVetFiltersToUrl]
  );
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
  const [preferredDetailTab, setPreferredDetailTab] = useState<'profile' | 'species'>('profile');

  const [vetSchedules, setVetSchedules] = useState<WorkSchedule[]>([]);
  const [vetExceptions, setVetExceptions] = useState<ScheduleException[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [prefillUserId, setPrefillUserId] = useState<string>('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadReqIdRef = useRef(0);
  const detailsReqIdRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);
  const appliedUserIdRef = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    const reqId = ++loadReqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [vetsData, vetUsers, specsData, speciesData] = await Promise.all([
        adminApi.getVeterinarians(),
        fetchAllPages((p, s) => adminApi.getUsers(p, s, 'VETERINARIAN'), {
          pageSize: 100,
          maxPages: 20,
          concurrency: 4,
        }),
        clinicApi.getSpecializations(),
        clinicApi.getSpecies(),
      ]);

      const vets = Array.isArray(vetsData) ? vetsData : [];

      if (loadReqIdRef.current !== reqId) return;

      const permEntries = vets.map(
        (v) => [v.id, Array.isArray(v.speciesIds) ? v.speciesIds : []] as const
      );

      setVeterinarians(vets);
      setUsers(vetUsers);
      setSpecializations(Array.isArray(specsData) ? specsData : []);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      setVetPermMap(Object.fromEntries(permEntries));

      if (initialSel && appliedSelRef.current !== initialSel) {
        appliedSelRef.current = initialSel;
        const found = vets.find((v) => v.id === initialSel);
        if (found) setSelectedVet(found);
      } else if (initialUserId && appliedUserIdRef.current !== initialUserId) {
        appliedUserIdRef.current = initialUserId;
        const existing = vets.find((v) => v.userId === initialUserId);
        if (existing) {
          setSelectedVet(existing);
        } else {
          const targetUser = vetUsers.find((u) => u.id === initialUserId);
          if (targetUser) {
            setPrefillUserId(targetUser.id);
            setIsCreateOpen(true);
          }
        }
      } else {
        setSelectedVet((prev) => (prev ? vets.find((v) => v.id === prev.id) || null : null));
      }
    } catch (err: unknown) {
      if (loadReqIdRef.current !== reqId) return;
      setError(formatApiError(err, 'Не удалось загрузить список врачей'));
    } finally {
      if (loadReqIdRef.current === reqId) setLoading(false);
    }
  }, [initialSel, initialUserId]);

  useEffect(() => {
    void loadData();
    return () => {
      loadReqIdRef.current += 1;
    };
  }, [loadData]);

  const loadVetDetails = useCallback(async (vetId: string) => {
    const reqId = ++detailsReqIdRef.current;
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const [schedRes, excRes, permsRes] = await Promise.all([
        clinicApi.getWorkSchedules(vetId),
        clinicApi.getScheduleExceptions(vetId),
        clinicApi.getVetSpeciesPermissions(vetId),
      ]);
      if (detailsReqIdRef.current !== reqId) return;
      setVetSchedules(Array.isArray(schedRes) ? schedRes : []);
      setVetExceptions(Array.isArray(excRes) ? excRes : []);
      const spIds = (permsRes || []).map((p) => p.speciesId);
      setVetPermMap((prev) => ({ ...prev, [vetId]: spIds }));
    } catch (err: unknown) {
      if (detailsReqIdRef.current !== reqId) return;
      setVetSchedules([]);
      setVetExceptions([]);
      setDetailsError(formatApiError(err, 'Не удалось загрузить расписание и допуски врача'));
    } finally {
      if (detailsReqIdRef.current === reqId) setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedVet?.id) {
      detailsReqIdRef.current += 1;
      setVetSchedules([]);
      setVetExceptions([]);
      setDetailsError(null);
      setLoadingDetails(false);
      return;
    }
    void loadVetDetails(selectedVet.id);
    return () => {
      detailsReqIdRef.current += 1;
    };
  }, [selectedVet?.id, loadVetDetails]);

  const usersMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const filteredVets = useMemo(
    () =>
      veterinarians.filter((v) => {
        if (filterSpec !== 'ALL' && v.specializationId !== filterSpec) return false;
        if (filterSpecies !== 'ALL' && !(vetPermMap[v.id] || []).includes(filterSpecies)) {
          return false;
        }
        if (filterActive === 'ACTIVE' && !v.isActive) return false;
        if (filterActive === 'INACTIVE' && v.isActive) return false;
        return true;
      }),
    [veterinarians, filterSpec, filterSpecies, filterActive, vetPermMap]
  );

  const usersWithoutProfile = useMemo(
    () => users.filter((u) => !veterinarians.some((v) => v.userId === u.id)),
    [users, veterinarians]
  );

  const selectedVetName = useMemo(() => {
    if (!selectedVet) return '';
    return getDoctorDisplay(
      { ...selectedVet, user: selectedVet.user || usersMap[selectedVet.userId] },
      specsMap
    ).fullName;
  }, [selectedVet, usersMap, specsMap]);

  const selectVet = useCallback((vet: Veterinarian) => {
    setPreferredDetailTab('profile');
    setSelectedVet((prev) => (prev?.id === vet.id ? prev : vet));
  }, []);

  const closeDetail = useCallback(() => setSelectedVet(null), []);

  const createVeterinarian = useCallback(
    async (data: CreateVetInput): Promise<Veterinarian> => {
      const { photoFile, ...payload } = data;
      let created = await adminApi.createVeterinarian(payload);
      if (photoFile) {
        try {
          const links = await adminApi.uploadVeterinarianPhoto(created.id, photoFile);
          created = { ...created, ...links };
        } catch (err: unknown) {
          toast(
            'Профиль создан, но фото не загрузилось',
            formatApiError(err, 'Попробуйте загрузить фотографию в карточке врача'),
            'err'
          );
        }
      }
      setPreferredDetailTab('species');
      await loadData();
      setSelectedVet(created);
      setPrefillUserId('');
      toast('Профиль врача создан', 'Выдайте допуски к видам и задайте расписание');
      return created;
    },
    [loadData, toast]
  );

  const updateVeterinarian = useCallback(
    async (id: string, data: UpdateVetInput): Promise<Veterinarian> => {
      const updated = await adminApi.updateVeterinarian(id, data);
      await loadData();
      setSelectedVet((prev) => (prev?.id === id ? updated : prev));
      toast('Профиль врача сохранён');
      return updated;
    },
    [loadData, toast]
  );

  const uploadVetPhoto = useCallback(
    async (vetId: string, file: File): Promise<void> => {
      const links = await adminApi.uploadVeterinarianPhoto(vetId, file);
      setVeterinarians((prev) =>
        prev.map((v) => (v.id === vetId ? { ...v, ...links } : v))
      );
      setSelectedVet((prev) => (prev?.id === vetId ? { ...prev, ...links } : prev));
      toast('Фотография врача обновлена');
    },
    [toast]
  );

  const deleteVetPhoto = useCallback(
    async (vetId: string): Promise<void> => {
      await adminApi.deleteVeterinarianPhoto(vetId);
      const empty = { photoUrl: null, photoThumbnailUrl: null, photoUrlExpiresAt: null };
      setVeterinarians((prev) =>
        prev.map((v) => (v.id === vetId ? { ...v, ...empty } : v))
      );
      setSelectedVet((prev) => (prev?.id === vetId ? { ...prev, ...empty } : prev));
      toast('Фотография врача удалена');
    },
    [toast]
  );

  const toggleVetSpeciesPermission = useCallback(
    async (vetId: string, speciesId: string, isCurrentlyPermitted: boolean): Promise<void> => {
      if (isCurrentlyPermitted) {
        await adminApi.revokeVetSpeciesPermission(vetId, speciesId);
      } else {
        await adminApi.grantVetSpeciesPermission(vetId, speciesId);
      }
      setVetPermMap((prev) => {
        const current = prev[vetId] || [];
        const next = isCurrentlyPermitted
          ? current.filter((id) => id !== speciesId)
          : current.includes(speciesId)
            ? current
            : [...current, speciesId];
        return { ...prev, [vetId]: next };
      });
      toast(
        isCurrentlyPermitted ? 'Допуск отозван' : 'Допуск выдан',
        speciesMap[speciesId] || undefined
      );
    },
    [speciesMap, toast]
  );

  const openCreateModal = useCallback(() => {
    setPrefillUserId('');
    setIsCreateOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateOpen(false);
    setPrefillUserId('');
  }, []);

  const openDeleteModal = useCallback(() => {
    setDeleteError(null);
    setIsDeleteConfirmOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (!deleting) {
      setIsDeleteConfirmOpen(false);
      setDeleteError(null);
    }
  }, [deleting]);

  const confirmDeleteVet = useCallback(async () => {
    if (!selectedVet) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteVeterinarian(selectedVet.id);
      setIsDeleteConfirmOpen(false);
      setSelectedVet(null);
      await loadData();
      toast('Профиль врача удалён');
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении профиля врача'));
    } finally {
      setDeleting(false);
    }
  }, [selectedVet, loadData, toast]);

  return {
    vets: filteredVets,
    users,
    specializations,
    speciesList,
    vetPermMap,
    loading,
    error,
    reload: loadData,
    filterSpec,
    setFilterSpec,
    filterSpecies,
    setFilterSpecies,
    filterActive,
    setFilterActive,
    selectedVet,
    selectedVetName,
    preferredDetailTab,
    selectVet,
    closeDetail,
    vetSchedules,
    vetExceptions,
    loadingDetails,
    detailsError,
    usersWithoutProfile,
    prefillUserId,
    isCreateOpen,
    openCreateModal,
    closeCreateModal,
    isDeleteConfirmOpen,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteVet,
    createVeterinarian,
    updateVeterinarian,
    uploadVetPhoto,
    deleteVetPhoto,
    toggleVetSpeciesPermission,
  };
}
