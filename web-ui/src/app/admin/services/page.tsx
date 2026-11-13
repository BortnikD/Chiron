'use client';

import React, { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components';
import { SERVICE_NAV_TABS, useAdminServices } from './_hooks/useAdminServices';
import { ServicesFilters } from './_components/ServicesFilters';
import { ServicesTable } from './_components/ServicesTable';
import { ServiceDetailIsland } from './_components/ServiceDetailIsland';
import { ServiceModal } from './_components/ServiceModal';
import { ServiceSpeciesModal } from './_components/ServiceSpeciesModal';
import { SpeciesTab } from './_components/SpeciesTab';
import { SpecializationsTab } from './_components/SpecializationsTab';

function AdminServicesContent() {
  const s = useAdminServices();

  useShellHeader({
    crumbGroup: 'Справочники',
    crumb: s.activeTabItem.crumb,
    crumb2: s.mainTab === 'SERVICES' && s.selectedService ? s.selectedService.name : undefined,
  });

  return (
    <>
      <section className="island filters" style={{ padding: '8px 12px', marginBottom: 'var(--gap)' }}>
        <div className="seg" role="tablist" aria-label="Справочники">
          {SERVICE_NAV_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={s.mainTab === t.key}
              className={`seg-item ${s.mainTab === t.key ? 'on' : ''}`}
              onClick={() => s.switchTab(t)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {s.error && (
        <div
          className="alert alert-destructive row between"
          role="alert"
          style={{ alignItems: 'center', marginBottom: 'var(--gap)' }}
        >
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} className="ic" />
            <span>{s.error}</span>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void s.reload()}>
            Повторить
          </button>
        </div>
      )}

      {s.mainTab === 'SERVICES' && (
        <div className="content-row">
          <div className="content-col grow">
            <ServicesFilters
              filterSpec={s.filterSpec}
              onFilterSpecChange={s.setFilterSpec}
              filterSpecies={s.filterSpecies}
              onFilterSpeciesChange={s.setFilterSpecies}
              filterActive={s.filterActive}
              onFilterActiveChange={s.setFilterActive}
              search={s.search}
              onSearchChange={s.setSearch}
              specializations={s.specializations}
              speciesList={s.speciesList}
              onOpenCreate={s.openCreateService}
            />
            <ServicesTable
              services={s.services}
              loading={s.loading}
              selectedService={s.selectedService}
              onSelectService={s.setSelectedService}
              serviceSpeciesMap={s.serviceSpeciesMap}
              specializations={s.specializations}
              speciesList={s.speciesList}
              onEditService={s.openEditService}
              onDeleteService={s.requestDeleteService}
            />
          </div>

          {s.selectedService && (
            <ServiceDetailIsland
              service={s.selectedService}
              specializations={s.specializations}
              speciesList={s.speciesList}
              serviceSpeciesMap={s.serviceSpeciesMap}
              onClose={() => s.setSelectedService(null)}
              onSaveService={s.saveService}
              onLoadServiceSpecies={s.loadServiceSpecies}
              onAttachSpecies={s.attachServiceSpecies}
              onDetachSpecies={s.detachServiceSpecies}
              onSaveOverrides={s.saveServiceSpeciesOverrides}
              onDeleteClick={() => s.requestDeleteService(s.selectedService!)}
              onOpenSpeciesModal={s.openSpeciesOverrideModal}
            />
          )}
        </div>
      )}

      {s.mainTab === 'SPECIES' && (
        <SpeciesTab
          speciesList={s.speciesList}
          services={s.allServices}
          serviceSpeciesMap={s.serviceSpeciesMap}
          onCreateSpecies={s.createSpecies}
          onUpdateSpecies={s.updateSpecies}
          onDeleteSpecies={s.deleteSpecies}
        />
      )}

      {s.mainTab === 'SPECIALIZATIONS' && (
        <SpecializationsTab
          specializations={s.specializations}
          services={s.allServices}
          veterinarians={s.veterinarians}
          onSaveSpecialization={s.saveSpecialization}
          onDeleteSpecialization={s.deleteSpecialization}
        />
      )}

      <ServiceModal
        isOpen={s.serviceModal.open}
        service={s.serviceModal.service}
        specializations={s.specializations}
        onClose={s.closeServiceModal}
        onSave={s.saveService}
      />

      <ConfirmModal
        isOpen={Boolean(s.deleteTarget)}
        title="Удалить услугу?"
        description={
          s.deleteTarget
            ? `Услуга «${s.deleteTarget.name}» будет удалена. Если по ней уже есть записи, сделайте услугу неактивной.`
            : ''
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={s.deleting}
        error={s.deleteError}
        onClose={s.closeDeleteModal}
        onConfirm={s.confirmDeleteService}
      />

      <ServiceSpeciesModal
        isOpen={s.speciesOverrideModal.open}
        service={s.selectedService}
        speciesList={s.speciesList}
        existingOverride={s.speciesOverrideModal.link}
        attachedSpeciesIds={s.attachedSpeciesIds}
        onClose={s.closeSpeciesOverrideModal}
        onSave={s.saveServiceSpeciesOverride}
      />
    </>
  );
}

export default function AdminServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="empty">
          <span className="spinner" aria-hidden="true" />
          <span className="muted">Загрузка справочников…</span>
        </div>
      }
    >
      <AdminServicesContent />
    </Suspense>
  );
}
