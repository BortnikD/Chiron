'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet, Vaccination, Appointment } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import type { ArchiveFilter, PetFormData } from '../_components/types';

export function useClientPets(actionParam: string | null) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const didInitSelectionRef = useRef(false);
  const requestIdRef = useRef(0);
  const apptRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const selectedPetIdRef = useRef<string | null>(null);
  selectedPetIdRef.current = selectedPet?.id ?? null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Состояния модальных окон
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [archivingPet, setArchivingPet] = useState<Pet | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPetAppointments = useCallback(async (petId: string, silent = false) => {
    const reqId = ++apptRequestIdRef.current;
    if (!silent) setLoadingAppts(true);
    try {
      const res = await clientApi.getAppointments({
        petId,
        direction: 'DESC',
        page: 0,
        size: 100,
      });
      if (!isMountedRef.current || reqId !== apptRequestIdRef.current) return;
      const items = res?.items ?? (Array.isArray(res) ? res : []);
      setAppointments(items);
    } catch {
      if (!isMountedRef.current || reqId !== apptRequestIdRef.current) return;
      if (!silent) setAppointments([]);
    } finally {
      if (isMountedRef.current && reqId === apptRequestIdRef.current && !silent) {
        setLoadingAppts(false);
      }
    }
  }, []);

  const loadAll = useCallback(async (isCancelled?: () => boolean, silent = false) => {
    const reqId = ++requestIdRef.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [petsData, speciesData, vacData] = await Promise.all([
        clientApi.getPets({ withSummary: true }),
        clinicApi.getSpecies(),
        clientApi.getVaccinations().catch(() => [] as Vaccination[]),
      ]);
      if (!isMountedRef.current || isCancelled?.() || reqId !== requestIdRef.current) return;

      const safePets: Pet[] = Array.isArray(petsData) ? petsData : [];
      setPets(safePets);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      setVaccinations(Array.isArray(vacData) ? vacData : []);

      if (!didInitSelectionRef.current) {
        didInitSelectionRef.current = true;
        if (safePets.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1280) {
          const initialPet = safePets.find((p) => !p.isArchived) ?? safePets[0];
          setSelectedPet(initialPet);
        }
      } else {
        setSelectedPet((prev) => (prev ? safePets.find((p) => p.id === prev.id) ?? null : null));
      }
    } catch (err: unknown) {
      if (!isMountedRef.current || isCancelled?.() || reqId !== requestIdRef.current) return;
      if (!silent) {
        setError(formatApiError(err, 'Не удалось загрузить данные питомцев'));
      }
    } finally {
      if (isMountedRef.current && !isCancelled?.() && reqId === requestIdRef.current && !silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadAll(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  const selectedPetId = selectedPet?.id ?? null;

  useEffect(() => {
    if (!selectedPetId) {
      apptRequestIdRef.current++;
      setAppointments([]);
      setLoadingAppts(false);
      return;
    }
    void loadPetAppointments(selectedPetId);
  }, [selectedPetId, loadPetAppointments]);

  useEffect(() => {
    const handleNotification = () => {
      void loadAll(undefined, true);
      if (selectedPetIdRef.current) {
        void loadPetAppointments(selectedPetIdRef.current, true);
      }
    };
    window.addEventListener('chiron:notification-received', handleNotification);
    return () => window.removeEventListener('chiron:notification-received', handleNotification);
  }, [loadAll, loadPetAppointments]);

  const reload = useCallback(() => {
    void loadAll();
    if (selectedPetIdRef.current) {
      void loadPetAppointments(selectedPetIdRef.current);
    }
  }, [loadAll, loadPetAppointments]);

  const openCreate = useCallback(() => {
    setEditingPet(null);
    setModalError(null);
    setIsPetModalOpen(true);
  }, []);

  useEffect(() => {
    if (actionParam === 'create') openCreate();
  }, [actionParam, openCreate]);

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const openEdit = useCallback((pet: Pet) => {
    setEditingPet(pet);
    setModalError(null);
    setIsPetModalOpen(true);
  }, []);

  const closePetModal = useCallback(() => {
    if (!modalSaving) setIsPetModalOpen(false);
  }, [modalSaving]);

  const handleSavePet = useCallback(
    async (payload: PetFormData) => {
      setModalSaving(true);
      setModalError(null);
      try {
        if (editingPet) await clientApi.updatePet(editingPet.id, payload);
        else await clientApi.createPet(payload);
        setIsPetModalOpen(false);
        await loadAll();
      } catch (err: unknown) {
        setModalError(formatApiError(err, 'Не удалось сохранить данные питомца'));
      } finally {
        setModalSaving(false);
      }
    },
    [editingPet, loadAll]
  );

  const openArchiveModal = useCallback((pet: Pet) => {
    setArchivingPet(pet);
    setArchiveError(null);
  }, []);

  const closeArchiveModal = useCallback(() => {
    if (!archiveLoading) setArchivingPet(null);
  }, [archiveLoading]);

  const handleConfirmArchive = useCallback(async () => {
    if (!archivingPet) return;
    setArchiveLoading(true);
    setArchiveError(null);
    try {
      await clientApi.updatePet(archivingPet.id, { isArchived: !archivingPet.isArchived });
      await loadAll();
      setArchivingPet(null);
    } catch (err: unknown) {
      setArchiveError(formatApiError(err, 'Ошибка изменения статуса архива'));
    } finally {
      setArchiveLoading(false);
    }
  }, [archivingPet, loadAll]);

  const openDeleteModal = useCallback((pet: Pet) => {
    setDeletingPet(pet);
    setDeleteError(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (!deleteLoading) setDeletingPet(null);
  }, [deleteLoading]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingPet) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await clientApi.deletePet(deletingPet.id);
      if (selectedPet?.id === deletingPet.id) setSelectedPet(null);
      setDeletingPet(null);
      await loadAll();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Не удалось удалить питомца'));
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingPet, selectedPet?.id, loadAll]);

  const filteredPets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pets.filter((p) => {
      if (archiveFilter === 'ACTIVE' && p.isArchived) return false;
      if (archiveFilter === 'ARCHIVED' && !p.isArchived) return false;
      if (!q) return true;
      const sp = (speciesMap[p.speciesId] || '').toLowerCase();
      return p.name.toLowerCase().includes(q) || sp.includes(q) || (p.notes?.toLowerCase().includes(q) ?? false);
    });
  }, [pets, archiveFilter, searchQuery, speciesMap]);

  return {
    loading,
    loadingAppts,
    error,
    reload,
    speciesList,
    speciesMap,
    vaccinations,
    appointments,
    archiveFilter,
    setArchiveFilter,
    searchQuery,
    setSearchQuery,
    selectedPet,
    setSelectedPet,
    filteredPets,
    isPetModalOpen,
    editingPet,
    modalSaving,
    modalError,
    openCreate,
    openEdit,
    closePetModal,
    handleSavePet,
    archivingPet,
    archiveLoading,
    archiveError,
    openArchiveModal,
    closeArchiveModal,
    handleConfirmArchive,
    deletingPet,
    deleteLoading,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  };
}
