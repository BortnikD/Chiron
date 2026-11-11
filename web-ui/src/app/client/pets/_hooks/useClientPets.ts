'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from '@/shared/components';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet, Vaccination, Appointment } from '@/modules/client/types';
import type { Service, Species, Veterinarian } from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import type { ArchiveFilter, DetailTab, PetFormData } from '../_components/types';

export function useClientPets(
  actionParam: string | null,
  selParam: string | null = null,
  tabParam: string | null = null
) {
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('ACTIVE');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

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
      const [petsData, speciesData, vacData, svcData, vetsData] = await Promise.all([
        clientApi.getPets({ withSummary: true }),
        clinicApi.getSpecies(),
        clientApi.getVaccinations().catch(() => [] as Vaccination[]),
        clinicApi.getServices().catch(() => [] as Service[]),
        clinicApi.getVeterinarians().catch(() => [] as Veterinarian[]),
      ]);
      if (!isMountedRef.current || isCancelled?.() || reqId !== requestIdRef.current) return;

      const safePets: Pet[] = Array.isArray(petsData) ? petsData : [];
      setPets(safePets);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      setVaccinations(Array.isArray(vacData) ? vacData : []);
      setServices(Array.isArray(svcData) ? svcData : []);
      setVeterinarians(Array.isArray(vetsData) ? vetsData : []);

      setSelectedPet((prev) => (prev ? safePets.find((p) => p.id === prev.id) ?? null : null));
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

  useEffect(() => {
    if (!selParam || pets.length === 0) return;
    const match = pets.find((p) => p.id === selParam);
    if (!match) return;
    setSelectedPet(match);
    if (match.isArchived) {
      setArchiveFilter((prev) => (prev === 'ACTIVE' ? 'ALL' : prev));
    }
  }, [selParam, pets]);

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
  const servicesMap = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
  const vetsMap = useMemo(() => Object.fromEntries(veterinarians.map((v) => [v.id, v])), [veterinarians]);

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
        if (editingPet) {
          const updated = await clientApi.updatePet(editingPet.id, payload);
          toast('Изменения сохранены', payload.name);
          setIsPetModalOpen(false);
          await loadAll();
          if (updated) {
            setSelectedPet((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
          }
        } else {
          const created = await clientApi.createPet(payload);
          toast('Питомец добавлен', `${payload.name} — теперь можно записаться на приём`);
          setIsPetModalOpen(false);
          setArchiveFilter('ACTIVE');
          await loadAll();
          if (created) setSelectedPet(created);
        }
      } catch (err: unknown) {
        setModalError(formatApiError(err, 'Не удалось сохранить данные питомца'));
      } finally {
        setModalSaving(false);
      }
    },
    [editingPet, loadAll, toast]
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
    const target = archivingPet;
    const willArchive = !target.isArchived;
    setArchiveLoading(true);
    setArchiveError(null);
    try {
      await clientApi.updatePet(target.id, { isArchived: willArchive });
      await loadAll();
      setArchivingPet(null);
      toast(
        willArchive ? 'Питомец в архиве' : 'Питомец возвращён из архива',
        willArchive
          ? `${target.name} перемещён в архив`
          : `${target.name} снова доступен для записи`
      );
    } catch (err: unknown) {
      setArchiveError(formatApiError(err, 'Ошибка изменения статуса архива'));
    } finally {
      setArchiveLoading(false);
    }
  }, [archivingPet, loadAll, toast]);

  const openDeleteModal = useCallback((pet: Pet) => {
    setDeletingPet(pet);
    setDeleteError(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (!deleteLoading) setDeletingPet(null);
  }, [deleteLoading]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingPet) return;
    const target = deletingPet;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await clientApi.deletePet(target.id);
      if (selectedPet?.id === target.id) setSelectedPet(null);
      setDeletingPet(null);
      toast('Питомец удалён', target.name);
      await loadAll();
    } catch (err: unknown) {
      const apiErr = err as { status?: number } | null;
      const msg = formatApiError(err, 'Не удалось удалить питомца');
      if (apiErr?.status === 409) {
        setDeleteError(`${msg}. Используйте архивацию — история сохранится.`);
        toast('Нельзя удалить: у питомца есть записи', 'Используйте архивацию — история сохранится', 'err');
      } else {
        setDeleteError(msg);
      }
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingPet, selectedPet?.id, loadAll, toast]);

  const filteredPets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pets.filter((p) => {
      if (archiveFilter === 'ACTIVE' && p.isArchived) return false;
      if (archiveFilter === 'ARCHIVED' && !p.isArchived) return false;
      if (selectedSpeciesId && p.speciesId !== selectedSpeciesId) return false;
      if (!q) return true;
      const sp = (speciesMap[p.speciesId] || '').toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        sp.includes(q) ||
        (p.notes?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [pets, archiveFilter, selectedSpeciesId, searchQuery, speciesMap]);

  const initialDetailTab: DetailTab =
    tabParam === 'appts' ? 'APPTS' : tabParam === 'vacc' ? 'VACC' : 'OVERVIEW';

  return {
    loading,
    loadingAppts,
    error,
    reload,
    speciesList,
    speciesMap,
    servicesMap,
    vetsMap,
    vaccinations,
    appointments,
    archiveFilter,
    setArchiveFilter,
    selectedSpeciesId,
    setSelectedSpeciesId,
    searchQuery,
    setSearchQuery,
    selectedPet,
    setSelectedPet,
    filteredPets,
    initialDetailTab,
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
