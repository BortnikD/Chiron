'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { adminApi } from '@/modules/admin/api';
import type { Vaccination, Pet } from '@/modules/client/types';
import { formatApiError } from '@/shared/lib';
import type { VaccinationStatusTone } from '../_components/types';
import { filterVaccinations, countVaccinationTones } from '../_components/utils';

export interface VaccinationSaveInput {
  petId: string;
  name: string;
  administeredOn: string;
  nextDueOn: string | null;
}

export function useAdminVaccinations() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VaccinationStatusTone>('all');
  const [petFilter, setPetFilter] = useState<string>('all');

  const [selectedVaccination, setSelectedVaccination] = useState<Vaccination | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Vaccination | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadReqIdRef = useRef(0);

  const loadData = useCallback(async () => {
    const reqId = ++loadReqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [vaxRes, petsRes] = await Promise.all([
        adminApi.getVaccinations(undefined, 0, 100),
        adminApi.getPets(0, 100),
      ]);
      if (loadReqIdRef.current !== reqId) return;
      const vaxItems: Vaccination[] = Array.isArray(vaxRes) ? vaxRes : vaxRes?.items || [];
      const petItems: Pet[] = Array.isArray(petsRes) ? petsRes : petsRes?.items || [];
      setVaccinations(vaxItems);
      setPets(petItems);
      setSelectedVaccination((prev) =>
        prev ? vaxItems.find((v) => v.id === prev.id) ?? null : null
      );
    } catch (err: unknown) {
      if (loadReqIdRef.current !== reqId) return;
      setError(formatApiError(err, 'Не удалось загрузить реестр вакцинаций'));
    } finally {
      if (loadReqIdRef.current === reqId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    return () => {
      loadReqIdRef.current += 1;
    };
  }, [loadData]);

  const petMap = useMemo(() => {
    const map = new Map<string, Pet>();
    pets.forEach((p) => map.set(p.id, p));
    return map;
  }, [pets]);

  const filteredVaccinations = useMemo(
    () => filterVaccinations(vaccinations, petMap, search, statusFilter, petFilter),
    [vaccinations, petMap, search, statusFilter, petFilter]
  );

  const { overdue, soon, total } = useMemo(
    () => countVaccinationTones(vaccinations),
    [vaccinations]
  );

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
      } else {
        await adminApi.createVaccination({
          petId: data.petId,
          name: data.name,
          administeredOn: data.administeredOn,
          nextDueOn: data.nextDueOn,
        });
      }
      setIsModalOpen(false);
      setEditingVaccination(null);
      await loadData();
    },
    [loadData]
  );

  const requestDelete = useCallback(
    (id: string) => {
      const target =
        vaccinations.find((v) => v.id === id) ??
        (selectedVaccination?.id === id ? selectedVaccination : null);
      setDeleteError(null);
      setDeleteTarget(target);
    },
    [vaccinations, selectedVaccination]
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
      setVaccinations((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      setSelectedVaccination((prev) => (prev?.id === deleteTarget.id ? null : prev));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении'));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  return {
    vaccinations: filteredVaccinations,
    pets,
    petMap,
    loading,
    error,
    reload: loadData,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    petFilter,
    setPetFilter,
    selectedVaccination,
    setSelectedVaccination,
    isModalOpen,
    editingVaccination,
    closeFormModal,
    deleteTarget,
    deleting,
    deleteError,
    stats: { overdue, soon, total },
    handleOpenCreate,
    handleOpenEdit,
    saveVaccination,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
