'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, clinicApi } from '../../../api';
import {
  Veterinarian,
  User,
  Specialization,
  Species,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AdminVetsFilters,
  AdminVetsTable,
  AdminVetDetailIsland,
  AdminCreateVetModal,
  AdminDeleteVetModal,
  getUserName,
} from './_components';

export default function AdminVeterinariansPage() {
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vetPermMap, setVetPermMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSpec, setFilterSpec] = useState<string>('ALL');
  const [filterSpecies, setFilterSpecies] = useState<string>('ALL');

  // Selected Vet for Master-Detail right side panel
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vetsData, usersData, specsData, speciesData] = await Promise.all([
        adminApi.getVeterinarians().catch(() => [] as Veterinarian[]),
        adminApi
          .getUsers(0, 100, 'VETERINARIAN')
          .catch(() => ({ items: [] as User[], totalElements: 0, totalPages: 0, page: 0, size: 100 })),
        clinicApi.getSpecializations().catch(() => [] as Specialization[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);

      const vets = Array.isArray(vetsData) ? vetsData : [];
      setVeterinarians(vets);
      setUsers(usersData?.items || []);
      setSpecializations(Array.isArray(specsData) ? specsData : []);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);

      const permPromises = vets.map(async (v: Veterinarian) => {
        try {
          const perms = await clinicApi.getVetSpeciesPermissions(v.id);
          return { vetId: v.id, speciesIds: (perms || []).map((p) => p.speciesId) };
        } catch {
          return { vetId: v.id, speciesIds: [] };
        }
      });
      const permsResults = await Promise.all(permPromises);
      const permMap: Record<string, string[]> = {};
      permsResults.forEach((r) => {
        permMap[r.vetId] = r.speciesIds;
      });
      setVetPermMap(permMap);

      setSelectedVet((prev) => (prev ? vets.find((v) => v.id === prev.id) || null : null));
    } catch (err) {
      console.error('Failed to load veterinarians data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectVet = (vet: Veterinarian) => {
    if (selectedVet?.id !== vet.id) {
      setSelectedVet(vet);
    }
  };

  const handlePermissionChange = (vetId: string, speciesIds: string[]) => {
    setVetPermMap((prev) => ({ ...prev, [vetId]: speciesIds }));
  };

  const handleCreated = async (created: Veterinarian) => {
    await loadData();
    if (created) {
      setSelectedVet(created);
    }
  };

  const handleDeleted = async () => {
    setSelectedVet(null);
    await loadData();
  };

  const filteredVets = veterinarians.filter((v) => {
    if (filterSpec !== 'ALL' && v.specializationId !== filterSpec) return false;
    if (filterSpecies !== 'ALL') {
      const perms = vetPermMap[v.id] || [];
      if (!perms.includes(filterSpecies)) return false;
    }
    return true;
  });

  const usersWithoutProfile = users.filter((u) => !veterinarians.some((v) => v.userId === u.id));

  return (
    <AppShell crumbGroup="Персонал" crumb="Врачи">
      <div className="content-row">
        <div className="content-col grow">
          <AdminVetsFilters
            filterSpec={filterSpec}
            onFilterSpecChange={setFilterSpec}
            filterSpecies={filterSpecies}
            onFilterSpeciesChange={setFilterSpecies}
            specializations={specializations}
            speciesList={speciesList}
            onCreateClick={() => setIsCreateOpen(true)}
          />

          <AdminVetsTable
            vets={filteredVets}
            selectedVet={selectedVet}
            onSelectVet={handleSelectVet}
            users={users}
            specializations={specializations}
            speciesList={speciesList}
            vetPermMap={vetPermMap}
            loading={loading}
          />
        </div>

        {selectedVet && (
          <AdminVetDetailIsland
            selectedVet={selectedVet}
            users={users}
            specializations={specializations}
            speciesList={speciesList}
            vetPermMap={vetPermMap}
            onClose={() => setSelectedVet(null)}
            onDeleteClick={() => setIsDeleteConfirmOpen(true)}
            onSaved={loadData}
            onPermissionsChange={handlePermissionChange}
          />
        )}
      </div>

      <AdminCreateVetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        usersWithoutProfile={usersWithoutProfile}
        specializations={specializations}
        onCreated={handleCreated}
      />

      <AdminDeleteVetModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        vet={selectedVet}
        vetName={selectedVet ? getUserName(selectedVet.userId, users) : ''}
        onDeleted={handleDeleted}
      />
    </AppShell>
  );
}
