'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { AppShell } from '../../components/layout/AppShell';
import { clinicApi } from '../../api';
import { Veterinarian, Specialization, Species, WorkSchedule, ScheduleException } from '../../types';
import {
  VeterinariansFilters,
  VeterinariansGrid,
  VeterinarianDetailIsland,
  SPEC_TONES,
  toIdNameMap,
  filterVeterinarians,
} from './_components';

function VeterinariansContent() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const specParam = searchParams.get('spec');
  const { isAuthenticated, role } = useAuth();

  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vetPermissions, setVetPermissions] = useState<Record<string, string[]>>({});
  const [selectedSpec, setSelectedSpec] = useState<string>('ALL');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
  const [vetSchedules, setVetSchedules] = useState<WorkSchedule[]>([]);
  const [vetExceptions, setVetExceptions] = useState<ScheduleException[]>([]);

  useEffect(() => {
    Promise.all([clinicApi.getVeterinarians(), clinicApi.getSpecializations(), clinicApi.getSpecies()])
      .then(async ([vetsData, specData, spList]) => {
        const safeVets = Array.isArray(vetsData) ? vetsData : [];
        const safeSpec = Array.isArray(specData) ? specData : [];
        setVets(safeVets);
        setSpecializations(safeSpec);
        setSpeciesList(Array.isArray(spList) ? spList : []);

        if (specParam) {
          const match = safeSpec.find((s) => s.id === specParam || SPEC_TONES[s.id] === specParam);
          if (match) setSelectedSpec(match.id);
        }

        const permMap: Record<string, string[]> = {};
        for (const v of safeVets) {
          try {
            const perms = await clinicApi.getVetSpeciesPermissions(v.id);
            permMap[v.id] = Array.isArray(perms) ? perms.map((p) => p.speciesId) : [];
          } catch {
            permMap[v.id] = [];
          }
        }
        setVetPermissions(permMap);
      })
      .catch((err) => console.error(err));
  }, [specParam]);

  useEffect(() => {
    if (!selectedVet) {
      setVetSchedules([]);
      setVetExceptions([]);
      return;
    }
    Promise.all([clinicApi.getWorkSchedules(selectedVet.id), clinicApi.getScheduleExceptions(selectedVet.id)])
      .then(([schedRes, excRes]) => {
        setVetSchedules(Array.isArray(schedRes) ? schedRes : []);
        setVetExceptions(Array.isArray(excRes) ? excRes : []);
      })
      .catch(() => {
        setVetSchedules([]);
        setVetExceptions([]);
      });
  }, [selectedVet?.id]);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);
  const hasFilters = selectedSpec !== 'ALL' || selectedSpecies !== 'ALL' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedSpec('ALL');
    setSelectedSpecies('ALL');
    setSearchQuery('');
  };

  const filteredVets = useMemo(
    () => filterVeterinarians(vets, selectedSpec, selectedSpecies, searchQuery, vetPermissions, specsMap),
    [vets, selectedSpec, selectedSpecies, searchQuery, vetPermissions, specsMap]
  );

  const content = (
    <div className="scroll-col grow">
      <VeterinariansFilters
        specializations={specializations}
        speciesList={speciesList}
        selectedSpec={selectedSpec}
        onSelectSpec={setSelectedSpec}
        selectedSpecies={selectedSpecies}
        onSelectSpecies={setSelectedSpecies}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResetFilters={resetFilters}
        hasFilters={hasFilters}
      />
      <div className="content-row">
        <VeterinariansGrid
          vets={filteredVets}
          selectedVet={selectedVet}
          onSelectVet={setSelectedVet}
          specsMap={specsMap}
          speciesMap={speciesMap}
          vetPermissions={vetPermissions}
        />
        {selectedVet && (
          <VeterinarianDetailIsland
            vet={selectedVet}
            specsMap={specsMap}
            speciesMap={speciesMap}
            permissions={vetPermissions[selectedVet.id] || []}
            schedules={vetSchedules}
            exceptions={vetExceptions}
            onClose={() => setSelectedVet(null)}
            isAuthenticated={isAuthenticated}
            role={role}
          />
        )}
      </div>
    </div>
  );

  if (isAuthenticated) {
    return (
      <AppShell
        crumbGroup={role === 'VETERINARIAN' ? 'Клиника' : role === 'ADMIN' ? 'Персонал' : 'Кабинет'}
        crumb={role === 'VETERINARIAN' ? 'Коллеги' : 'Врачи'}
      >
        {content}
      </AppShell>
    );
  }

  return (
    <div className="app" data-theme={resolvedTheme} style={{ flexDirection: 'column' }}>
      <PublicHeader />
      {content}
    </div>
  );
}

export default function VeterinariansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка каталога врачей...</div>}>
      <VeterinariansContent />
    </Suspense>
  );
}
