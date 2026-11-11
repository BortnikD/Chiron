'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Vaccination, Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError } from '@/shared/lib';
import type { VaccinationStatusTone } from '../_components/types';
import { filterVaccinations, countVaccinationTones } from '../_components/utils';

export interface VaccinationSaveInput {
  petId: string;
  name: string;
  administeredOn: string;
  nextDueOn: string | null;
}

export function useAdminVaccinations() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialSel = searchParams.get('sel');

  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VaccinationStatusTone>('all');
  const [petFilter, setPetFilter] = useState<string>('all');
  const [nextDueFrom, setNextDueFrom] = useState<string>('');
  const [nextDueTo, setNextDueTo] = useState<string>('');

  const [selectedVaccination, setSelectedVaccination] = useState<Vaccination | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Vaccination | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadReqIdRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    const reqId = ++loadReqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [vaxItems, petItems, speciesRes, userItems] = await Promise.all([
        fetchAllPages(
          (p, s) =>
            adminApi.getVaccinations(
              {
                petId: petFilter !== 'all' ? petFilter : undefined,
                nextDueFrom: nextDueFrom || undefined,
                nextDueTo: nextDueTo || undefined,
              },
              p,
              s
            ),
          { pageSize: 100, maxPages: 50, concurrency: 4 }
        ),
        fetchAllPages((p, s) => adminApi.getPets(p, s), { pageSize: 100, maxPages: 50, concurrency: 4 }),
        clinicApi.getSpecies(),
        fetchAllPages((p, s) => adminApi.getUsers(p, s), { pageSize: 100, maxPages: 50, concurrency: 4 }),
      ]);
      if (loadReqIdRef.current !== reqId) return;
      setVaccinations(vaxItems);
      setPets(petItems);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setUsers(userItems);

      if (initialSel && appliedSelRef.current !== initialSel) {
        appliedSelRef.current = initialSel;
        const found = vaxItems.find((v) => v.id === initialSel);
        if (found) {
          setSelectedVaccination(found);
        } else {
          try {
            const byId = await adminApi.getVaccinationById(initialSel);
            if (loadReqIdRef.current === reqId && byId) setSelectedVaccination(byId);
          } catch {
            // ignore missing target
          }
        }
      } else {
        setSelectedVaccination((prev) =>
          prev ? vaxItems.find((v) => v.id === prev.id) ?? prev : null
        );
      }
    } catch (err: unknown) {
      if (loadReqIdRef.current !== reqId) return;
      setError(formatApiError(err, 'Не удалось загрузить реестр вакцинаций'));
    } finally {
      if (loadReqIdRef.current === reqId) setLoading(false);
    }
  }, [petFilter, nextDueFrom, nextDueTo, initialSel]);

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
    () =>
      filterVaccinations(
        vaccinations,
        petMap,
        search,
        statusFilter,
        petFilter,
        nextDueFrom,
        nextDueTo
      ),
    [vaccinations, petMap, search, statusFilter, petFilter, nextDueFrom, nextDueTo]
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
      await loadData();
    },
    [loadData, toast]
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
      toast('Запись о вакцинации удалена');
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении'));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, toast]);

  return {
    vaccinations: filteredVaccinations,
    pets,
    petMap,
    speciesList,
    users,
    loading,
    error,
    reload: loadData,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    petFilter,
    setPetFilter,
    nextDueFrom,
    setNextDueFrom,
    nextDueTo,
    setNextDueTo,
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
