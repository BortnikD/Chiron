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
import { formatApiError, mapWithConcurrency } from '@/shared/lib';
import { useResourceList } from '@/shared/hooks';
import type { User } from '@/shared/types';
import type { GenderFilter, StatusFilter } from '../_components/types';

function getErrMsg(err: unknown, fallback: string): string {
  return formatApiError(err, fallback);
}

export interface AdminPetsFiltersState {
  search: string;
  ownerFilter: string;
  speciesFilter: string;
  genderFilter: GenderFilter;
  statusFilter: StatusFilter;
}

export function useAdminPets() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialSel = searchParams.get('sel');
  const initialOwner = searchParams.get('ownerId') || 'ALL';

  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);

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

  const refsReqIdRef = useRef(0);
  const detailsReqIdRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);
  const usersRef = useRef<User[]>(users);
  usersRef.current = users;

  const resource = useResourceList<Pet, AdminPetsFiltersState>({
    fetcher: async ({ page, pageSize, filters }, signal) => {
      return adminApi.getPets(
        page,
        pageSize,
        {
          ownerId: filters.ownerFilter !== 'ALL' ? filters.ownerFilter : undefined,
          speciesId: filters.speciesFilter !== 'ALL' ? filters.speciesFilter : undefined,
          gender: filters.genderFilter !== 'ALL' ? filters.genderFilter : undefined,
          isArchived:
            filters.statusFilter === 'ACTIVE'
              ? false
              : filters.statusFilter === 'ARCHIVED'
              ? true
              : undefined,
          search: filters.search || undefined,
        },
        { signal }
      );
    },
    initialFilters: {
      search: '',
      ownerFilter: initialOwner,
      speciesFilter: 'ALL',
      genderFilter: 'ALL',
      statusFilter: 'ALL',
    },
    urlSyncKeys: ['search', 'ownerFilter', 'speciesFilter', 'genderFilter', 'statusFilter'],
    defaultPageSize: 20,
    debouncedKeys: ['search'],
    debounceMs: 250,
    onSuccess: async ({ items }) => {
      // Подгрузка недостающих владельцев
      const missingOwnerIds = Array.from(
        new Set(items.map((p) => p.ownerId).filter((id): id is string => Boolean(id)))
      ).filter((id) => !usersRef.current.some((u) => u.id === id));

      if (missingOwnerIds.length > 0) {
        try {
          const fetchedUsers = await mapWithConcurrency(
            missingOwnerIds,
            (id) => adminApi.getUserById(id).catch(() => null),
            4
          );
          const validUsers = fetchedUsers.filter((u): u is User => u !== null);
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
        const found = items.find((p) => p.id === initialSel);
        if (found) setSelectedPet(found);
        else {
          adminApi.getPetById(initialSel).then(setSelectedPet).catch(() => {});
        }
      } else {
        setSelectedPet((prev) => (prev ? items.find((p) => p.id === prev.id) || prev : null));
      }
    },
  });

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
    } catch {
      // ignore
    }
  }, [initialOwner]);

  useEffect(() => {
    void loadRefs();
    return () => {
      refsReqIdRef.current += 1;
    };
  }, [loadRefs]);

  const loadPetDetails = useCallback(async (petId: string) => {
    const reqId = ++detailsReqIdRef.current;
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const [apptsRes, vacRes] = await Promise.all([
        adminApi.getAppointments(0, 50, { petId }),
        adminApi.getVaccinations({ petId }),
      ]);
      if (detailsReqIdRef.current !== reqId) return;
      setPetAppointments(apptsRes?.items || []);
      setPetVaccinations(Array.isArray(vacRes) ? vacRes : []);
    } catch (err: unknown) {
      if (detailsReqIdRef.current !== reqId) return;
      setDetailsError(getErrMsg(err, 'Не удалось загрузить данные визитов и прививок'));
    } finally {
      if (detailsReqIdRef.current === reqId) setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPet?.id) {
      detailsReqIdRef.current += 1;
      setPetAppointments([]);
      setPetVaccinations([]);
      setDetailsError(null);
      setLoadingDetails(false);
      return;
    }
    void loadPetDetails(selectedPet.id);
    return () => {
      detailsReqIdRef.current += 1;
    };
  }, [selectedPet?.id, loadPetDetails]);

  const createPet = useCallback(
    async (payload: CreatePetRequest): Promise<Pet> => {
      const created = await adminApi.createPet(payload);
      toast('Питомец добавлен', created.name);
      await resource.reload();
      setSelectedPet(created);
      return created;
    },
    [resource, toast]
  );

  const updatePet = useCallback(
    async (id: string, payload: UpdatePetRequest) => {
      const updated = await adminApi.updatePet(id, payload);
      toast('Данные питомца обновлены');
      await resource.reload();
      return updated;
    },
    [resource, toast]
  );

  const uploadPetPhoto = useCallback(
    async (petId: string, file: File) => {
      const links = await adminApi.uploadPetPhoto(petId, file);
      resource.setItems((prev) => prev.map((p) => (p.id === petId ? { ...p, ...links } : p)));
      setSelectedPet((prev) => (prev?.id === petId ? { ...prev, ...links } : prev));
      toast('Фотография питомца обновлена');
    },
    [resource, toast]
  );

  const deletePetPhoto = useCallback(
    async (petId: string) => {
      await adminApi.deletePetPhoto(petId);
      const empty = { photoUrl: null, photoThumbnailUrl: null, photoUrlExpiresAt: null };
      resource.setItems((prev) => prev.map((p) => (p.id === petId ? { ...p, ...empty } : p)));
      setSelectedPet((prev) => (prev?.id === petId ? { ...prev, ...empty } : prev));
      toast('Фотография питомца удалена');
    },
    [resource, toast]
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
      await resource.reload();
    } catch (err: unknown) {
      setActionError(getErrMsg(err, 'Ошибка обновления статуса питомца'));
    }
  }, [selectedPet, resource, toast]);

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
      await resource.reload();
    } catch (err: unknown) {
      setDeleteError(getErrMsg(err, 'Ошибка при удалении питомца'));
    } finally {
      setDeleting(false);
    }
  }, [selectedPet, resource, toast]);

  return {
    pets: resource.items,
    totalElements: resource.totalElements,
    totalPages: resource.totalPages,
    page: resource.page,
    setPage: resource.setPage,
    pageSize: resource.pageSize,
    setPageSize: resource.setPageSize,
    speciesList,
    users,
    services,
    veterinarians,
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    search: resource.filters.search,
    setSearch: useCallback((val: string) => resource.setFilter('search', val), [resource]),
    ownerFilter: resource.filters.ownerFilter,
    setOwnerFilter: useCallback((val: string) => resource.setFilter('ownerFilter', val), [resource]),
    speciesFilter: resource.filters.speciesFilter,
    setSpeciesFilter: useCallback((val: string) => resource.setFilter('speciesFilter', val), [resource]),
    genderFilter: resource.filters.genderFilter,
    setGenderFilter: useCallback((val: GenderFilter) => resource.setFilter('genderFilter', val), [resource]),
    statusFilter: resource.filters.statusFilter,
    setStatusFilter: useCallback((val: StatusFilter) => resource.setFilter('statusFilter', val), [resource]),
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
    paginationProps: resource.paginationProps,
  };
}
