'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi, clinicApi } from '../../../api';
import { Service, Specialization, Species, ServiceSpecies } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  ServicesFilters,
  ServicesTable,
  ServiceDetailIsland,
  ServiceModal,
  ServiceSpeciesModal,
  DeleteServiceModal,
  SpeciesTab,
  SpecializationsTab,
} from './_components';

const NAV_TABS = [
  { key: 'SERVICES', label: 'Услуги', href: '/admin/services', crumb: 'Услуги' },
  { key: 'SPECIES', label: 'Виды животных', href: '/admin/services?tab=species', crumb: 'Виды животных' },
  { key: 'SPECIALIZATIONS', label: 'Специализации', href: '/admin/services?tab=specs', crumb: 'Специализации' },
] as const;

/**
 * Страница управления ветеринарными услугами, видами животных и специализациями.
 * Компактный оркестратор состояния данных, фильтрации и модальных окон.
 */
function AdminServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [serviceSpeciesMap, setServiceSpeciesMap] = useState<Record<string, ServiceSpecies[]>>({});
  const [loading, setLoading] = useState(true);

  const [mainTab, setMainTab] = useState<'SERVICES' | 'SPECIES' | 'SPECIALIZATIONS'>('SERVICES');
  const [filterSpec, setFilterSpec] = useState<string>('ALL');
  const [filterSpecies, setFilterSpecies] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceModal, setServiceModal] = useState<{ open: boolean; service?: Service | null }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; service?: Service | null }>({ open: false });
  const [speciesOverrideModal, setSpeciesOverrideModal] = useState<{ open: boolean; link?: ServiceSpecies | null }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcData, specData, speciesData] = await Promise.all([
        adminApi.getServices().catch(() => [] as Service[]),
        clinicApi.getSpecializations().catch(() => [] as Specialization[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);
      const safeServices = Array.isArray(svcData) ? svcData : [];
      setServices(safeServices);
      setSpecializations(Array.isArray(specData) ? specData : []);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);

      const linkEntries = await Promise.all(
        safeServices.map(async (s) => [s.id, (await clinicApi.getServiceSpecies(s.id).catch(() => [])) || []] as const)
      );
      setServiceSpeciesMap(Object.fromEntries(linkEntries));

      if (selectedService) {
        const updated = safeServices.find((s: Service) => s.id === selectedService.id);
        if (updated) setSelectedService(updated);
      }
    } catch (err) {
      console.error('Failed to load services data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (tabParam === 'specs' || tabParam === 'specializations') setMainTab('SPECIALIZATIONS');
    else if (tabParam === 'species') setMainTab('SPECIES');
    else setMainTab('SERVICES');
  }, [tabParam]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (filterSpec !== 'ALL' && s.specializationId !== filterSpec) return false;
      if (filterSpecies !== 'ALL' && !(serviceSpeciesMap[s.id] || []).some((l) => l.speciesId === filterSpecies)) return false;
      if (q) {
        const specName = specializations.find((sp) => sp.id === s.specializationId)?.name.toLowerCase() || '';
        if (!s.name.toLowerCase().includes(q) && !specName.includes(q)) return false;
      }
      return true;
    });
  }, [services, filterSpec, filterSpecies, search, serviceSpeciesMap, specializations]);

  const handleDeleteService = async () => {
    const target = deleteModal.service || selectedService;
    if (!target) return;
    setDeleting(true);
    try {
      await adminApi.deleteService(target.id);
      setDeleteModal({ open: false });
      if (selectedService?.id === target.id) setSelectedService(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка удаления услуги');
    } finally {
      setDeleting(false);
    }
  };

  const activeTabItem = NAV_TABS.find((t) => t.key === mainTab) || NAV_TABS[0];

  return (
    <AppShell crumbGroup="Справочники" crumb={activeTabItem.crumb}>
      <div className="tabs-line" style={{ marginBottom: 'var(--gap)' }}>
        {NAV_TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-line ${mainTab === t.key ? 'on' : ''}`}
            onClick={() => { setMainTab(t.key); router.replace(t.href); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'SERVICES' && (
        <div className="content-row">
          <div className="content-col grow">
            <ServicesFilters
              filterSpec={filterSpec}
              onFilterSpecChange={setFilterSpec}
              filterSpecies={filterSpecies}
              onFilterSpeciesChange={setFilterSpecies}
              search={search}
              onSearchChange={setSearch}
              specializations={specializations}
              speciesList={speciesList}
              onOpenCreate={() => setServiceModal({ open: true, service: null })}
            />
            <ServicesTable
              services={filteredServices}
              loading={loading}
              selectedService={selectedService}
              onSelectService={setSelectedService}
              serviceSpeciesMap={serviceSpeciesMap}
              specializations={specializations}
              speciesList={speciesList}
              onEditService={(svc) => setServiceModal({ open: true, service: svc })}
              onDeleteService={(svc) => setDeleteModal({ open: true, service: svc })}
            />
          </div>

          {selectedService && (
            <ServiceDetailIsland
              service={selectedService}
              specializations={specializations}
              speciesList={speciesList}
              serviceSpeciesMap={serviceSpeciesMap}
              onClose={() => setSelectedService(null)}
              onRefresh={loadData}
              onDeleteClick={() => setDeleteModal({ open: true, service: selectedService })}
              onOpenSpeciesModal={(link) => setSpeciesOverrideModal({ open: true, link })}
            />
          )}
        </div>
      )}

      {mainTab === 'SPECIES' && <SpeciesTab speciesList={speciesList} onRefresh={loadData} />}
      {mainTab === 'SPECIALIZATIONS' && <SpecializationsTab specializations={specializations} onRefresh={loadData} />}

      <ServiceModal
        isOpen={serviceModal.open}
        service={serviceModal.service}
        specializations={specializations}
        onClose={() => setServiceModal({ open: false })}
        onSuccess={async (saved) => { await loadData(); if (saved) setSelectedService(saved); }}
      />

      <DeleteServiceModal
        isOpen={deleteModal.open}
        service={deleteModal.service || selectedService}
        deleting={deleting}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={handleDeleteService}
      />

      <ServiceSpeciesModal
        isOpen={speciesOverrideModal.open}
        service={selectedService}
        speciesList={speciesList}
        existingOverride={speciesOverrideModal.link}
        attachedSpeciesIds={(selectedService && serviceSpeciesMap[selectedService.id]?.map((l) => l.speciesId)) || []}
        onClose={() => setSpeciesOverrideModal({ open: false })}
        onSuccess={loadData}
      />
    </AppShell>
  );
}

export default function AdminServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Загрузка справочников…</div>}>
      <AdminServicesContent />
    </Suspense>
  );
}
