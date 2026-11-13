'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type {
  Pet,
  Appointment,
  Vaccination,
  CreatePetRequest,
  UpdatePetRequest,
  CreateVaccinationRequest,
} from '@/modules/client/types';
import type { Service, Species, Veterinarian } from '@/modules/clinic/types';
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError, mapWithConcurrency } from '@/shared/lib';
import type { User } from '@/shared/types';
import type { GenderFilter, StatusFilter } from '../_components/types';

function getErrMsg(err: unknown, fallback: string): string {
  return formatApiError(err, fallback);
}

export function useAdminPets() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialSel = searchParams.get('sel');
  const initialOwner = searchParams.get('ownerId') || 'ALL';

  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ownerFilter, setOwnerFilterState] = useState(initialOwner);
  const [speciesFilter, setSpeciesFilterState] = useState('ALL');
  const [genderFilter, setGenderFilterState] = useState<GenderFilter>('ALL');
  const [statusFilter, setStatusFilterState] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petAppointments, setPetAppointments] = useState<Appointment[]>([]);
  const [petVaccinations, setPetVaccinations] = useState<Vaccination[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddVacOpen, setIsAddVacOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadReqIdRef = useRef(0);
  const loadAbortRef = useRef<AbortController | null>(null);
  const refsReqIdRef = useRef(0);
  const refsLoadedRef = useRef(false);
  const detailsReqIdRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);
  const usersRef = useRef<User[]>(users);
  usersRef.current = users;

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
    const reqId = ++refsReqIdRef.current;
    try {
      const [speciesRes, allClients, servicesRes, vetsRes] = await Promise.all([
        clinicApi.getSpecies(),
        adminApi.getUsers(0, 100, 'CLIENT').then((r) => r?.items || []),
        adminApi.getServices(),
        adminApi.getVeterinarians(),
      ]);
      if (reqId !== refsReqIdRef.current) return;
      const safeUsers = Array.isArray(allClients) ? [...allClients] : [];
      if (initialOwner && initialOwner !== 'ALL' && !safeUsers.some((u) => u.id === initialOwner)) {
        try {
          const u = await adminApi.getUserById(initialOwner);
          if (u) safeUsers.push(u);
        } catch {
          // ignore
        }
      }
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setUsers(safeUsers);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
      setVeterinarians(
        (Array.isArray(vetsRes) ? vetsRes : []).map((v) =>
          v.user ? v : { ...v, user: safeUsers.find((u) => u.id === v.userId) }
        )
      );
      refsLoadedRef.current = true;
    } catch {
      // Справочники загрузятся повторно при reload
    }
  }, [initialOwner]);

  useEffect(() => {
    void loadRefs();
    return () => {
      refsReqIdRef.current += 1;
    };
  }, [loadRefs]);

  const loadData = useCallback(async () => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const reqId = ++loadReqIdRef.current;
    setLoading(true);
    setError(null);
    if (!refsLoadedRef.current) {
      void loadRefs();
    }
    try {
      const isArchived =
        statusFilter === 'ACTIVE' ? false : statusFilter === 'ARCHIVED' ? true : undefined;
      const petsRes = await adminApi.getPets(
        page,
        pageSize,
        {
          ownerId: ownerFilter !== 'ALL' ? ownerFilter : undefined,
          speciesId: speciesFilter !== 'ALL' ? speciesFilter : undefined,
          gender: genderFilter !== 'ALL' ? genderFilter : undefined,
          isArchived,
          search: debouncedSearch || undefined,
        },
        { signal: controller.signal }
      );

      if (reqId !== loadReqIdRef.current || controller.signal.aborted) return;

      const safePets = Array.isArray(petsRes?.items) ? petsRes.items : [];
      const nextTotalElements = petsRes?.totalElements ?? safePets.length;
      const nextTotalPages = Math.max(1, petsRes?.totalPages ?? 1);

      if (page > nextTotalPages - 1) {
        setPage(Math.max(0, nextTotalPages - 1));
        return;
      }

      setPets(safePets);
      setTotalElements(nextTotalElements);
      setTotalPages(nextTotalPages);

      // Подгружаем недостающих владельцев для питомцев текущей страницы
      const missingOwnerIds = Array.from(
        new Set(safePets.map((p) => p.ownerId).filter((id): id is string => Boolean(id)))
      ).filter((id) => !usersRef.current.some((u) => u.id === id));

      if (missingOwnerIds.length > 0) {
        try {
          const loadedUsers = await mapWithConcurrency(
            missingOwnerIds,
            (id) => adminApi.getUserById(id).catch(() => null),
            4
          );
          const validUsers = loadedUsers.filter((u): u is User => u !== null);
          if (validUsers.length > 0) {
            setUsers((prev) => {
              const prevIds = new Set(prev.map((u) => u.id));
              const next = [...prev];
              for (const u of validUsers) {
                if (!prevIds.has(u.id)) next.push(u);
              }
              return next;
            });
          }
        } catch {
          // ignore
        }
      }

      if (initialSel && appliedSelRef.current !== initialSel) {
        appliedSelRef.current = initialSel;
        const found = safePets.find((p) => p.id === initialSel);
        if (found) {
          setSelectedPet(found);
        } else {
          try {
            const byId = await adminApi.getPetById(initialSel);
            if (reqId === loadReqIdRef.current && byId) setSelectedPet(byId);
          } catch {
            // ignore
          }
        }
      } else {
        setSelectedPet((prev) => (prev ? safePets.find((p) => p.id === prev.id) ?? prev : null));
      }
    } catch (err: unknown) {
      if (reqId !== loadReqIdRef.current || controller.signal.aborted) return;
      setError(getErrMsg(err, 'Не удалось загрузить список питомцев.'));
    } finally {
      if (reqId === loadReqIdRef.current && !controller.signal.aborted) setLoading(false);
    }
  }, [page, pageSize, ownerFilter, speciesFilter, genderFilter, statusFilter, debouncedSearch, initialSel, loadRefs]);

  const loadPetDetails = useCallback(async (petId: string) => {
    const reqId = ++detailsReqIdRef.current;
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const [apptsRes, vacRes] = await Promise.all([
        adminApi.getAppointments(0, 50, { petId }),
        adminApi.getVaccinations({ petId }),
      ]);
      if (reqId !== detailsReqIdRef.current) return;
      setPetAppointments(apptsRes?.items || []);
      setPetVaccinations(vacRes?.items || []);
    } catch (err: unknown) {
      if (reqId !== detailsReqIdRef.current) return;
      setDetailsError(getErrMsg(err, 'Не удалось загрузить историю питомца.'));
    } finally {
      if (reqId === detailsReqIdRef.current) setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      loadReqIdRef.current += 1;
      loadAbortRef.current?.abort();
    };
  }, [loadData]);

  useEffect(() => {
    if (selectedPet?.id) {
      loadPetDetails(selectedPet.id);
    } else {
      detailsReqIdRef.current += 1;
      setPetAppointments([]);
      setPetVaccinations([]);
      setDetailsError(null);
      setLoadingDetails(false);
    }
  }, [selectedPet?.id, loadPetDetails]);

  const createPet = useCallback(
    async (payload: CreatePetRequest, photoFile?: File | null) => {
      let created = await adminApi.createPet(payload);
      if (photoFile && created?.id) {
        try {
          const links = await adminApi.uploadPetPhoto(created.id, photoFile);
          created = { ...created, ...links };
        } catch (photoErr: unknown) {
          toast(
            'Питомец добавлен, но фото не загрузилось',
            formatApiError(photoErr, 'Попробуйте загрузить фото в карточке питомца'),
            'err'
          );
        }
      }
      toast('Питомец добавлен', created.name);
      await loadData();
      if (created) setSelectedPet(created);
      return created;
    },
    [loadData, toast]
  );

  const updatePet = useCallback(
    async (id: string, payload: UpdatePetRequest) => {
      const updated = await adminApi.updatePet(id, payload);
      toast('Данные питомца обновлены');
      await loadData();
      return updated;
    },
    [loadData, toast]
  );

  const uploadPetPhoto = useCallback(
    async (petId: string, file: File) => {
      const links = await adminApi.uploadPetPhoto(petId, file);
      setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, ...links } : p)));
      setSelectedPet((prev) => (prev?.id === petId ? { ...prev, ...links } : prev));
      toast('Фотография питомца обновлена');
    },
    [toast]
  );

  const deletePetPhoto = useCallback(
    async (petId: string) => {
      await adminApi.deletePetPhoto(petId);
      const empty = { photoUrl: null, photoThumbnailUrl: null, photoUrlExpiresAt: null };
      setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, ...empty } : p)));
      setSelectedPet((prev) => (prev?.id === petId ? { ...prev, ...empty } : prev));
      toast('Фотография питомца удалена');
    },
    [toast]
  );

  const createVaccination = useCallback(
    async (payload: CreateVaccinationRequest) => {
      const created = await adminApi.createVaccination(payload);
      toast('Прививка внесена', created.name);
      await loadPetDetails(payload.petId);
      return created;
    },
    [loadPetDetails, toast]
  );

  const handleToggleArchive = useCallback(async () => {
    if (!selectedPet) return;
    setActionError(null);
    const nextArchived = !selectedPet.isArchived;
    try {
      await adminApi.updatePet(selectedPet.id, { isArchived: nextArchived });
      toast(nextArchived ? 'Питомец перенесён в архив' : 'Питомец возвращён из архива');
      await loadData();
    } catch (err: unknown) {
      setActionError(getErrMsg(err, 'Ошибка обновления статуса питомца'));
    }
  }, [selectedPet, loadData, toast]);

  const openDeleteConfirm = useCallback(() => {
    setDeleteError(null);
    setIsDeleteConfirmOpen(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setDeleteError(null);
  }, []);

  const handleDeletePet = useCallback(async () => {
    if (!selectedPet) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deletePet(selectedPet.id);
      setIsDeleteConfirmOpen(false);
      toast('Питомец удалён', selectedPet.name);
      setSelectedPet(null);
      await loadData();
    } catch (err: unknown) {
      setDeleteError(getErrMsg(err, 'Ошибка при удалении питомца'));
    } finally {
      setDeleting(false);
    }
  }, [selectedPet, loadData, toast]);

  const setOwnerFilter = useCallback((next: string) => {
    setOwnerFilterState(next);
    setPage(0);
  }, []);

  const setSpeciesFilter = useCallback((next: string) => {
    setSpeciesFilterState(next);
    setPage(0);
  }, []);

  const setGenderFilter = useCallback((next: GenderFilter) => {
    setGenderFilterState(next);
    setPage(0);
  }, []);

  const setStatusFilter = useCallback((next: StatusFilter) => {
    setStatusFilterState(next);
    setPage(0);
  }, []);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPage(0);
  }, []);

  return {
    pets,
    totalElements,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    speciesList,
    users,
    services,
    veterinarians,
    loading,
    error,
    reload: loadData,
    search,
    setSearch,
    ownerFilter,
    setOwnerFilter,
    speciesFilter,
    setSpeciesFilter,
    genderFilter,
    setGenderFilter,
    statusFilter,
    setStatusFilter,
    selectedPet,
    setSelectedPet,
    petAppointments,
    petVaccinations,
    loadingDetails,
    detailsError,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    isDeleteConfirmOpen,
    openDeleteConfirm,
    closeDeleteConfirm,
    isAddVacOpen,
    setIsAddVacOpen,
    deleting,
    deleteError,
    actionError,
    clearActionError: useCallback(() => setActionError(null), []),
    createPet,
    updatePet,
    uploadPetPhoto,
    deletePetPhoto,
    createVaccination,
    handleToggleArchive,
    handleDeletePet,
  };
}
