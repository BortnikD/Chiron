'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { adminApi, clinicApi } from '../../../api';
import { Pet, Species, User, Appointment, Vaccination } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  PetsFilters,
  PetsTable,
  PetDetailIsland,
  CreatePetModal,
  EditPetModal,
  DeletePetModal,
  AddVaccinationModal,
  GenderFilter,
  StatusFilter,
  getOwnerName,
} from './_components';

/**
 * Страница управления питомцами администратором клиники.
 * Поиск, фильтрация по виду, полу и статусу, создание, редактирование,
 * удаление, детальный просмотр истории визитов и вакцинаций.
 */
export default function AdminPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры и выбор
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petAppointments, setPetAppointments] = useState<Appointment[]>([]);
  const [petVaccinations, setPetVaccinations] = useState<Vaccination[]>([]);

  // Модальные окна
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddVacOpen, setIsAddVacOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const isArchived = statusFilter === 'ACTIVE' ? false : statusFilter === 'ARCHIVED' ? true : undefined;
      const [petsRes, speciesRes, usersRes] = await Promise.all([
        adminApi.getPets(0, 100, { speciesId: speciesFilter !== 'ALL' ? speciesFilter : undefined, isArchived }).catch(() => ({ items: [] })),
        clinicApi.getSpecies().catch(() => [] as Species[]),
        adminApi.getUsers(0, 100).catch(() => ({ items: [] })),
      ]);
      const safePets = petsRes?.items || [];
      setPets(safePets);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setUsers(usersRes?.items || []);
      if (selectedPet) {
        const updated = safePets.find((p: Pet) => p.id === selectedPet.id);
        if (updated) setSelectedPet(updated);
      }
    } catch (err) {
      console.error('Failed to load pets data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPetDetails = async (petId: string) => {
    try {
      const [apptsRes, vacRes] = await Promise.all([
        adminApi.getAppointments(0, 50, { petId }).catch(() => ({ items: [] })),
        adminApi.getVaccinations({ petId }).catch(() => ({ items: [] })),
      ]);
      setPetAppointments(apptsRes?.items || []);
      setPetVaccinations(vacRes?.items || []);
    } catch (err) {
      console.error('Failed to load pet details', err);
    }
  };

  useEffect(() => { loadData(); }, [speciesFilter, statusFilter]);

  useEffect(() => {
    if (selectedPet) loadPetDetails(selectedPet.id);
    else { setPetAppointments([]); setPetVaccinations([]); }
  }, [selectedPet?.id]);

  const handleToggleArchive = async () => {
    if (!selectedPet) return;
    try {
      await adminApi.updatePet(selectedPet.id, { isArchived: !selectedPet.isArchived });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка обновления статуса питомца');
    }
  };

  const handleDeletePet = async () => {
    if (!selectedPet) return;
    setDeleting(true);
    try {
      await adminApi.deletePet(selectedPet.id);
      setIsDeleteConfirmOpen(false);
      setSelectedPet(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении питомца');
    } finally {
      setDeleting(false);
    }
  };

  const handlePetCreated = async (created: Pet) => {
    await loadData();
    if (created) setSelectedPet(created);
  };

  const filteredPets = useMemo(() => {
    return pets.filter((p) => {
      if (genderFilter !== 'ALL' && p.gender !== genderFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const pName = p.name.toLowerCase();
        const oName = getOwnerName(users, p.ownerId).toLowerCase();
        if (!pName.includes(q) && !oName.includes(q)) return false;
      }
      return true;
    });
  }, [pets, genderFilter, search, users]);

  return (
    <AppShell crumbGroup="Клиника" crumb="Питомцы">
      <div className="content-row">
        <div className="content-col grow">
          <PetsFilters
            speciesFilter={speciesFilter} onSpeciesFilterChange={setSpeciesFilter}
            genderFilter={genderFilter} onGenderFilterChange={setGenderFilter}
            statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            search={search} onSearchChange={setSearch}
            speciesList={speciesList} onOpenCreate={() => setIsCreateOpen(true)}
          />
          <PetsTable
            pets={filteredPets} selectedPet={selectedPet}
            speciesList={speciesList} users={users}
            loading={loading} onSelectPet={setSelectedPet}
          />
        </div>

        {selectedPet && (
          <PetDetailIsland
            pet={selectedPet} speciesList={speciesList} users={users}
            appointments={petAppointments} vaccinations={petVaccinations}
            onClose={() => setSelectedPet(null)} onEdit={() => setIsEditOpen(true)}
            onToggleArchive={handleToggleArchive} onDelete={() => setIsDeleteConfirmOpen(true)}
            onAddVaccination={() => setIsAddVacOpen(true)}
          />
        )}
      </div>

      <CreatePetModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={handlePetCreated} speciesList={speciesList} users={users} />
      <EditPetModal isOpen={isEditOpen} pet={selectedPet} speciesList={speciesList} onClose={() => setIsEditOpen(false)} onSuccess={loadData} />
      <DeletePetModal isOpen={isDeleteConfirmOpen} pet={selectedPet} deleting={deleting} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={handleDeletePet} />
      <AddVaccinationModal isOpen={isAddVacOpen} pet={selectedPet} onClose={() => setIsAddVacOpen(false)} onSuccess={() => selectedPet && loadPetDetails(selectedPet.id)} />
    </AppShell>
  );
}
