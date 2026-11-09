'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { clientApi, clinicApi } from '../../../api';
import { Pet, Species, Vaccination, Appointment } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  PetsList, PetDetailIsland, PetModal, PetFormData, ArchivePetModal, PetsFilters, ArchiveFilter,
} from './_components';

function PetsContent() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get('action');

  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Состояния модальных окон
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [archivingPet, setArchivingPet] = useState<Pet | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [petsData, speciesData, apptsData] = await Promise.all([
        clientApi.getPets(), clinicApi.getSpecies(), clientApi.getAppointments(0, 50),
      ]);
      const safePets: Pet[] = Array.isArray(petsData) ? petsData : [];
      setPets(safePets);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      setAppointments(apptsData?.items ?? (Array.isArray(apptsData) ? apptsData : []));

      if (safePets.length > 0) {
        const vacResults = await Promise.all(safePets.map((p) => clientApi.getVaccinations(p.id).catch(() => [])));
        setVaccinations(vacResults.flat());
        if (!selectedPet && typeof window !== 'undefined' && window.innerWidth >= 1280) setSelectedPet(safePets[0]);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных питомцев:', err);
    }
  }, [selectedPet]);

  useEffect(() => { loadAll(); }, []);

  const openCreate = useCallback(() => {
    setEditingPet(null);
    setModalError(null);
    setIsPetModalOpen(true);
  }, []);

  useEffect(() => {
    if (actionParam === 'create') openCreate();
  }, [actionParam, openCreate]);

  const speciesMap = useMemo(() => Object.fromEntries(speciesList.map((s) => [s.id, s.name])), [speciesList]);

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);
    setModalError(null);
    setIsPetModalOpen(true);
  };

  const handleSavePet = async (payload: PetFormData) => {
    setModalSaving(true);
    setModalError(null);
    try {
      if (editingPet) await clientApi.updatePet(editingPet.id, payload);
      else await clientApi.createPet(payload);
      setIsPetModalOpen(false);
      await loadAll();
    } catch (err: any) {
      setModalError(err?.message || 'Не удалось сохранить данные питомца');
    } finally {
      setModalSaving(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archivingPet) return;
    setArchiveLoading(true);
    setArchiveError(null);
    try {
      await clientApi.updatePet(archivingPet.id, { isArchived: !archivingPet.isArchived });
      await loadAll();
      if (selectedPet?.id === archivingPet.id) {
        setSelectedPet((prev) => (prev ? { ...prev, isArchived: !prev.isArchived } : null));
      }
      setArchivingPet(null);
    } catch (err: any) {
      setArchiveError(err?.message || 'Ошибка изменения статуса архива');
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleDeletePet = async (pet: Pet) => {
    if (!confirm(`Вы действительно хотите удалить профиль питомца ${pet.name}?`)) return;
    try {
      await clientApi.deletePet(pet.id);
      if (selectedPet?.id === pet.id) setSelectedPet(null);
      await loadAll();
    } catch (err: any) {
      alert(err?.message || 'Не удалось удалить питомца');
    }
  };

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

  return (
    <AppShell title="Мои питомцы" currentSection="Питомцы">
      <div className="content-col grow">
        <PetsFilters
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          archiveFilter={archiveFilter} onArchiveFilterChange={setArchiveFilter}
          onAddPet={openCreate}
        />

        <div className="content-row">
          <PetsList
            pets={filteredPets} selectedPet={selectedPet} onSelectPet={setSelectedPet}
            speciesMap={speciesMap} appointments={appointments} vaccinations={vaccinations}
            onAddPet={openCreate}
          />

          {selectedPet && (
            <PetDetailIsland
              pet={selectedPet} speciesMap={speciesMap}
              appointments={appointments} vaccinations={vaccinations}
              onClose={() => setSelectedPet(null)} onEdit={openEdit}
              onToggleArchive={(pet) => { setArchivingPet(pet); setArchiveError(null); }}
              onDelete={handleDeletePet}
            />
          )}
        </div>
      </div>

      <PetModal
        isOpen={isPetModalOpen} pet={editingPet} speciesList={speciesList}
        onSave={handleSavePet} onClose={() => setIsPetModalOpen(false)}
        saving={modalSaving} error={modalError}
      />

      <ArchivePetModal
        isOpen={!!archivingPet} pet={archivingPet}
        onConfirm={handleConfirmArchive} onClose={() => setArchivingPet(null)}
        loading={archiveLoading} error={archiveError}
      />
    </AppShell>
  );
}

export default function PetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка питомцев...</div>}>
      <PetsContent />
    </Suspense>
  );
}
