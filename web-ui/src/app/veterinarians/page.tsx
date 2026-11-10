'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { AppShell } from '@/components/layout/AppShell';
import { useVeterinariansCatalog } from './_hooks/useVeterinariansCatalog';
import { VeterinariansFilters } from './_components/VeterinariansFilters';
import { VeterinariansGrid } from './_components/VeterinariansGrid';
import { VeterinarianDetailIsland } from './_components/VeterinarianDetailIsland';

function VeterinariansContent() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const { isAuthenticated, role } = useAuth();

  const {
    specializations,
    speciesList,
    vetPermissions,
    selectedSpec,
    setSelectedSpec,
    selectedSpecies,
    setSelectedSpecies,
    searchQuery,
    setSearchQuery,
    selectedVet,
    setSelectedVet,
    vetSchedules,
    vetExceptions,
    error,
    reload,
    specsMap,
    speciesMap,
    hasFilters,
    resetFilters,
    filteredVets,
  } = useVeterinariansCatalog(searchParams.get('spec'));

  const content = (
    <div className="content-col grow">
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

      {error && (
        <div className="alert alert-destructive" role="alert">
          <AlertCircle className="ic" />
          <div className="row between wrap grow" style={{ gap: '8px', alignItems: 'center' }}>
            <span>{error}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
              Повторить
            </button>
          </div>
        </div>
      )}

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
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
          Загрузка каталога врачей...
        </div>
      }
    >
      <VeterinariansContent />
    </Suspense>
  );
}
