'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { AppShell } from '@/components/layout/AppShell';
import { useServicesCatalog } from './_hooks/useServicesCatalog';
import { ServicesFilters } from './_components/ServicesFilters';
import { ServicesGrid } from './_components/ServicesGrid';
import { ServiceDetailIsland } from './_components/ServiceDetailIsland';

function ServicesContent() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const { isAuthenticated, role } = useAuth();

  const {
    specializations,
    speciesList,
    veterinarians,
    selectedSpec,
    setSelectedSpec,
    selectedSpecies,
    setSelectedSpecies,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedService,
    setSelectedService,
    serviceSpeciesList,
    activeSpeciesTab,
    setActiveSpeciesTab,
    nearestSlots,
    loading,
    error,
    reload,
    specsMap,
    speciesMap,
    hasFilters,
    resetFilters,
    filteredServices,
  } = useServicesCatalog(searchParams.get('open'), searchParams.get('spec'));

  const content = (
    <div className="content-col grow">
      <ServicesFilters
        specializations={specializations}
        speciesList={speciesList}
        selectedSpec={selectedSpec}
        onSelectSpec={setSelectedSpec}
        selectedSpecies={selectedSpecies}
        onSelectSpecies={setSelectedSpecies}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        hasFilters={hasFilters}
        onReset={resetFilters}
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
        <ServicesGrid
          services={filteredServices}
          selectedService={selectedService}
          onSelectService={setSelectedService}
          specsMap={specsMap}
          loading={loading}
        />

        {selectedService && (
          <ServiceDetailIsland
            service={selectedService}
            onClose={() => setSelectedService(null)}
            specsMap={specsMap}
            speciesMap={speciesMap}
            speciesList={speciesList}
            serviceSpeciesList={serviceSpeciesList}
            activeSpeciesTab={activeSpeciesTab}
            onSpeciesTabChange={setActiveSpeciesTab}
            nearestSlots={nearestSlots}
            veterinarians={veterinarians}
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
        crumbGroup={role === 'VETERINARIAN' ? 'Клиника' : role === 'ADMIN' ? 'Справочники' : 'Кабинет'}
        crumb={role === 'VETERINARIAN' ? 'Услуги клиники' : 'Услуги'}
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

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
          Загрузка каталога услуг...
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
