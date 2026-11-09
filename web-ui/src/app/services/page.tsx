'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { AppShell } from '../../components/layout/AppShell';
import { clinicApi } from '../../api';
import { Service, Specialization, Species, ServiceSpecies, AvailableSlotResponse, Veterinarian } from '../../types';
import { ServicesFilters, ServicesGrid, ServiceDetailIsland, ServiceSortOption } from './_components';

function ServicesContent() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const openParam = searchParams.get('open');
  const { isAuthenticated, role } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [selectedSpec, setSelectedSpec] = useState('ALL');
  const [selectedSpecies, setSelectedSpecies] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ServiceSortOption>('default');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSpeciesList, setServiceSpeciesList] = useState<ServiceSpecies[]>([]);
  const [activeSpeciesTab, setActiveSpeciesTab] = useState('');
  const [nearestSlots, setNearestSlots] = useState<AvailableSlotResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const specsMap = useMemo(() => Object.fromEntries(specializations.map((s) => [s.id, s.name])), [specializations]);
  const speciesMap = useMemo(() => Object.fromEntries(speciesList.map((sp) => [sp.id, sp.name])), [speciesList]);

  useEffect(() => {
    Promise.all([clinicApi.getServices(), clinicApi.getSpecializations(), clinicApi.getSpecies(), clinicApi.getVeterinarians()])
      .then(([svc, spec, sp, vets]) => {
        const safeSvc = Array.isArray(svc) ? svc : [];
        setServices(safeSvc);
        setSpecializations(Array.isArray(spec) ? spec : []);
        setSpeciesList(Array.isArray(sp) ? sp : []);
        setVeterinarians(Array.isArray(vets) ? vets : []);
        if (openParam) {
          const found = safeSvc.find((s) => s.id === openParam);
          if (found) setSelectedService(found);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [openParam]);

  useEffect(() => {
    if (!selectedService) return setServiceSpeciesList([]);
    clinicApi.getServiceSpecies(selectedService.id)
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        setServiceSpeciesList(list);
        if (list.length > 0) setActiveSpeciesTab(list[0].speciesId);
        else if (speciesList.length > 0) setActiveSpeciesTab(speciesList[0].id);
      })
      .catch(() => setServiceSpeciesList([]));
  }, [selectedService?.id, speciesList]);

  useEffect(() => {
    if (!selectedService || !activeSpeciesTab) return;
    const today = new Date().toISOString().split('T')[0];
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    clinicApi.findAvailableSlots({ serviceId: selectedService.id, speciesId: activeSpeciesTab, from: today, to: in3Days })
      .then((res) => setNearestSlots(Array.isArray(res) ? res.slice(0, 8) : []))
      .catch(() => setNearestSlots([]));
  }, [selectedService?.id, activeSpeciesTab]);

  const hasFilters = selectedSpec !== 'ALL' || selectedSpecies !== 'ALL' || searchQuery.trim() !== '' || sortBy !== 'default';

  const resetFilters = () => {
    setSelectedSpec('ALL');
    setSelectedSpecies('ALL');
    setSearchQuery('');
    setSortBy('default');
  };

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = services.filter((s) => (selectedSpec === 'ALL' || s.specializationId === selectedSpec) &&
      (s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))));
    if (sortBy === 'price-asc') return [...result].sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
    if (sortBy === 'price-desc') return [...result].sort((a, b) => (b.basePrice ?? 0) - (a.basePrice ?? 0));
    if (sortBy === 'duration-asc') return [...result].sort((a, b) => (a.baseDurationMin ?? 30) - (b.baseDurationMin ?? 30));
    if (sortBy === 'duration-desc') return [...result].sort((a, b) => (b.baseDurationMin ?? 30) - (a.baseDurationMin ?? 30));
    return result;
  }, [services, selectedSpec, searchQuery, sortBy]);

  const content = (
    <div className="scroll-col grow">
      <ServicesFilters
        specializations={specializations} speciesList={speciesList}
        selectedSpec={selectedSpec} onSelectSpec={setSelectedSpec}
        selectedSpecies={selectedSpecies} onSelectSpecies={setSelectedSpecies}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        sortBy={sortBy} onSortChange={setSortBy}
        hasFilters={hasFilters} onReset={resetFilters}
      />

      <div className="content-row">
        <ServicesGrid
          services={filteredServices} selectedService={selectedService}
          onSelectService={setSelectedService} specsMap={specsMap} loading={loading}
        />

        {selectedService && (
          <ServiceDetailIsland
            service={selectedService} onClose={() => setSelectedService(null)}
            specsMap={specsMap} speciesMap={speciesMap} speciesList={speciesList}
            serviceSpeciesList={serviceSpeciesList} activeSpeciesTab={activeSpeciesTab}
            onSpeciesTabChange={setActiveSpeciesTab} nearestSlots={nearestSlots}
            veterinarians={veterinarians} isAuthenticated={isAuthenticated} role={role}
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка каталога услуг...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
