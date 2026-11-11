'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { fetchAllPages, formatApiError } from '@/shared/lib';
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
  const [ownerFilter, setOwnerFilter] = useState(initialOwner);
  const [speciesFilter, setSpeciesFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
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
  const detailsReqIdRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    const reqId = ++loadReqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const isArchived =
        statusFilter === 'ACTIVE' ? false : statusFilter === 'ARCHIVED' ? true : undefined;
      const [safePets, speciesRes, safeUsers, servicesRes, vetsRes] = await Promise.all([
        fetchAllPages(
          (p, s) =>
            adminApi.getPets(p, s, {
              ownerId: ownerFilter !== 'ALL' ? ownerFilter : undefined,
              speciesId: speciesFilter !== 'ALL' ? speciesFilter : undefined,
              isArchived,
            }),
          { pageSize: 100, maxPages: 50, concurrency: 4 }
        ),
        clinicApi.getSpecies(),
        fetchAllPages((p, s) => adminApi.getUsers(p, s), { pageSize: 100, maxPages: 50, concurrency: 4 }),
        adminApi.getServices(),
        adminApi.getVeterinarians(),
      ]);

      if (reqId !== loadReqIdRef.current) return;

      setPets(safePets);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setUsers(safeUsers);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
      setVeterinarians(
        (Array.isArray(vetsRes) ? vetsRes : []).map((v) =>
          v.user ? v : { ...v, user: safeUsers.find((u) => u.id === v.userId) }
        )
      );

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
      if (reqId !== loadReqIdRef.current) return;
      setError(getErrMsg(err, 'Не удалось загрузить список питомцев.'));
    } finally {
      if (reqId === loadReqIdRef.current) setLoading(false);
    }
  }, [ownerFilter, speciesFilter, statusFilter, initialSel]);

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
    async (payload: CreatePetRequest) => {
      const created = await adminApi.createPet(payload);
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

  const filteredPets = useMemo(() => {
    return pets.filter((p) => {
      if (genderFilter !== 'ALL' && p.gender !== genderFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const pName = p.name.toLowerCase();
        const oName = (users.find((u) => u.id === p.ownerId)?.fullName || '').toLowerCase();
        if (!pName.includes(q) && !oName.includes(q)) return false;
      }
      return true;
    });
  }, [pets, genderFilter, search, users]);

  return {
    pets: filteredPets,
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
    createVaccination,
    handleToggleArchive,
    handleDeletePet,
  };
}
