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

  const openParam = searchParams.get('open') || searchParams.get('sel');
  const specParam = searchParams.get('spec');
  const speciesParam = searchParams.get('species');

  const {
    specializations,
    speciesList,
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
    loadingSlots,
    loading,
    error,
    reload,
    specsMap,
    speciesMap,
    hasFilters,
    resetFilters,
    filteredServices,
  } = useServicesCatalog(openParam, specParam, speciesParam);

  const content = (
    <div className="content-row">
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

        <ServicesGrid
          services={filteredServices}
          selectedService={selectedService}
          onSelectService={setSelectedService}
          specsMap={specsMap}
          loading={loading}
          hasFilters={hasFilters}
          onReset={resetFilters}
          isAuthenticated={isAuthenticated}
        />
      </div>

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
          loadingSlots={loadingSlots}
          isAuthenticated={isAuthenticated}
          role={role}
        />
      )}
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
        <div className="app" style={{ flexDirection: 'column' }}>
          <div className="island grow">
            <div className="empty">
              <span className="small muted">Загрузка каталога услуг...</span>
            </div>
          </div>
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
