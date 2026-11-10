'use client';

import React, { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
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

  useShellHeader({ crumbGroup: 'Справочники', crumb: s.activeTabItem.crumb });

  return (
    <>
      <div className="tabs-line" style={{ marginBottom: 'var(--gap)' }}>
        {SERVICE_NAV_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-line ${s.mainTab === t.key ? 'on' : ''}`}
            onClick={() => s.switchTab(t)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {s.error && (
        <div className="alert alert-destructive row between" role="alert" style={{ alignItems: 'center', marginBottom: 'var(--gap)' }}>
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
          onCreateSpecies={s.createSpecies}
          onDeleteSpecies={s.deleteSpecies}
        />
      )}
      {s.mainTab === 'SPECIALIZATIONS' && (
        <SpecializationsTab
          specializations={s.specializations}
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
            ? `Услуга «${s.deleteTarget.name}» будет удалена. Записи с этой услугой могут быть затронуты.`
            : ''
        }
        confirmLabel="Удалить"
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
