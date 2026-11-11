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

  const specParam = searchParams.get('spec');
  const openParam = searchParams.get('open') || searchParams.get('sel');
  const speciesParam = searchParams.get('species');

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
    loading,
    error,
    reload,
    specsMap,
    speciesMap,
    hasFilters,
    resetFilters,
    filteredVets,
  } = useVeterinariansCatalog(specParam, openParam, speciesParam);

  const content = (
    <div className="content-row">
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
          <div className="alert" role="alert">
            <AlertCircle className="ic" />
            <div className="row between wrap grow" style={{ gap: '8px' }}>
              <span>{error}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
                Повторить
              </button>
            </div>
          </div>
        )}

        <VeterinariansGrid
          vets={filteredVets}
          selectedVet={selectedVet}
          onSelectVet={setSelectedVet}
          specsMap={specsMap}
          speciesMap={speciesMap}
          vetPermissions={vetPermissions}
          loading={loading}
          hasFilters={hasFilters}
          onReset={resetFilters}
        />
      </div>

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
        <div className="app" style={{ flexDirection: 'column' }}>
          <div className="island grow">
            <div className="empty">
              <span className="small muted">Загрузка каталога врачей...</span>
            </div>
          </div>
        </div>
      }
    >
      <VeterinariansContent />
    </Suspense>
  );
}
