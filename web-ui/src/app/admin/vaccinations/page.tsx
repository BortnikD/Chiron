'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { adminApi, clinicApi } from '../../../api';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Vaccination, Pet, VaccinationStatusTone, VaccinationsStats,
  VaccinationsFilters, VaccinationsTable, VaccinationDetailIsland,
  AddVaccinationModal, filterVaccinations, countVaccinationTones,
} from './_components';

/**
 * Страница учета вакцинаций администратора клиники.
 */
export default function AdminVaccinationsPage() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VaccinationStatusTone>('all');
  const [petFilter, setPetFilter] = useState<string>('all');

  // Master-Detail selection & Modals
  const [selectedVaccination, setSelectedVaccination] = useState<Vaccination | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vaxRes, petsRes] = await Promise.all([
        adminApi.getVaccinations(undefined, 0, 100),
        adminApi.getPets(0, 100),
      ]);
      const vaxItems = Array.isArray(vaxRes) ? vaxRes : (vaxRes as any)?.items || [];
      const petItems = Array.isArray(petsRes) ? petsRes : (petsRes as any)?.items || [];
      setVaccinations(vaxItems);
      setPets(petItems);

      if (selectedVaccination) {
        const updated = vaxItems.find((v: Vaccination) => v.id === selectedVaccination.id);
        if (updated) setSelectedVaccination(updated);
      }
    } catch (err) {
      console.error('Failed to load vaccinations or pets:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedVaccination?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const petMap = useMemo(() => {
    const map = new Map<string, Pet>();
    pets.forEach((p) => map.set(p.id, p));
    return map;
  }, [pets]);

  const filteredVaccinations = useMemo(() => {
    return filterVaccinations(vaccinations, petMap, search, statusFilter, petFilter);
  }, [vaccinations, petMap, search, statusFilter, petFilter]);

  const { overdue, soon, total } = useMemo(() => {
    return countVaccinationTones(vaccinations);
  }, [vaccinations]);

  const handleOpenCreate = () => {
    setEditingVaccination(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vaccination) => {
    setEditingVaccination(v);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись о вакцинации?')) return;
    try {
      await adminApi.deleteVaccination(id);
      if (selectedVaccination?.id === id) setSelectedVaccination(null);
      setVaccinations((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении');
    }
  };

  const handleModalSuccess = async () => {
    setIsModalOpen(false);
    setEditingVaccination(null);
    await loadData();
  };

  return (
    <AppShell crumbGroup="Клиника" crumb="Прививки">
      <div className="content-col grow">
        <VaccinationsStats totalCount={total} overdueCount={overdue} soonCount={soon} />

        <div className="content-row">
          <div className="content-col grow">
            <VaccinationsFilters
              search={search} onSearchChange={setSearch}
              selectedPetId={petFilter} onPetChange={setPetFilter}
              statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
              pets={pets} onCreateClick={handleOpenCreate}
            />

            <VaccinationsTable
              vaccinations={filteredVaccinations} pets={pets}
              selectedVaccination={selectedVaccination} loading={loading}
              onSelect={setSelectedVaccination} onEdit={handleOpenEdit} onDelete={handleDelete}
            />
          </div>

          {selectedVaccination && (
            <VaccinationDetailIsland
              vaccination={selectedVaccination}
              pet={petMap.get(selectedVaccination.petId)}
              onClose={() => setSelectedVaccination(null)}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <AddVaccinationModal
        isOpen={isModalOpen}
        vaccination={editingVaccination}
        pets={pets}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </AppShell>
  );
}
