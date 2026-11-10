'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type {
  Service,
  Specialization,
  Species,
  ServiceSpecies,
} from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import {
  SERVICE_NAV_TABS,
  resolveServicesTab,
  type ServicesMainTab,
  type SaveServiceInput,
} from '../_components/constants';

export { SERVICE_NAV_TABS };
export type { ServicesMainTab, SaveServiceInput };

export function useAdminServices() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [serviceSpeciesMap, setServiceSpeciesMap] = useState<Record<string, ServiceSpecies[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mainTab, setMainTab] = useState<ServicesMainTab>(() => resolveServicesTab(tabParam));
  const [filterSpec, setFilterSpec] = useState<string>('ALL');
  const [filterSpecies, setFilterSpecies] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceModal, setServiceModal] = useState<{ open: boolean; service?: Service | null }>({
    open: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [speciesOverrideModal, setSpeciesOverrideModal] = useState<{
    open: boolean;
    link?: ServiceSpecies | null;
  }>({ open: false });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadRequestIdRef = useRef(0);

  useEffect(() => {
    setMainTab(resolveServicesTab(tabParam));
  }, [tabParam]);

  const loadData = useCallback(async () => {
    const reqId = ++loadRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [svcData, specData, speciesData] = await Promise.all([
        adminApi.getServices(),
        clinicApi.getSpecializations(),
        clinicApi.getSpecies(),
      ]);
      const safeServices = Array.isArray(svcData) ? svcData : [];
      const linkEntries = await Promise.all(
        safeServices.map(
          async (s) => [s.id, (await clinicApi.getServiceSpecies(s.id)) || []] as const
        )
      );

      if (loadRequestIdRef.current !== reqId) return;

      setServices(safeServices);
      setSpecializations(Array.isArray(specData) ? specData : []);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      setServiceSpeciesMap(Object.fromEntries(linkEntries));

      setSelectedService((prev) =>
        prev ? safeServices.find((s) => s.id === prev.id) || null : null
      );
    } catch (err: unknown) {
      if (loadRequestIdRef.current !== reqId) return;
      setError(formatApiError(err, 'Не удалось загрузить справочники и услуги'));
    } finally {
      if (loadRequestIdRef.current === reqId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    return () => {
      loadRequestIdRef.current += 1;
    };
  }, [loadData]);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (filterSpec !== 'ALL' && s.specializationId !== filterSpec) return false;
      if (
        filterSpecies !== 'ALL' &&
        !(serviceSpeciesMap[s.id] || []).some((l) => l.speciesId === filterSpecies)
      ) {
        return false;
      }
      if (q) {
        const specName = (specsMap[s.specializationId] || '').toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !specName.includes(q)) return false;
      }
      return true;
    });
  }, [services, filterSpec, filterSpecies, search, serviceSpeciesMap, specsMap]);

  const activeTabItem = useMemo(
    () => SERVICE_NAV_TABS.find((t) => t.key === mainTab) || SERVICE_NAV_TABS[0],
    [mainTab]
  );

  const attachedSpeciesIds = useMemo(
    () =>
      (selectedService && serviceSpeciesMap[selectedService.id]?.map((l) => l.speciesId)) || [],
    [selectedService, serviceSpeciesMap]
  );

  const switchTab = useCallback(
    (tab: (typeof SERVICE_NAV_TABS)[number]) => {
      setMainTab(tab.key);
      router.replace(tab.href);
    },
    [router]
  );

  const openCreateService = useCallback(() => setServiceModal({ open: true, service: null }), []);
  const openEditService = useCallback(
    (service: Service) => setServiceModal({ open: true, service }),
    []
  );
  const closeServiceModal = useCallback(() => setServiceModal({ open: false }), []);

  const loadServiceSpecies = useCallback(async (serviceId: string): Promise<ServiceSpecies[]> => {
    const links = await clinicApi.getServiceSpecies(serviceId);
    const safeLinks = Array.isArray(links) ? links : [];
    setServiceSpeciesMap((prev) => ({ ...prev, [serviceId]: safeLinks }));
    return safeLinks;
  }, []);

  const saveService = useCallback(
    async (data: SaveServiceInput, id?: string): Promise<Service> => {
      const saved = id
        ? await adminApi.updateService(id, data)
        : await adminApi.createService(data);
      await loadData();
      setSelectedService(saved);
      return saved;
    },
    [loadData]
  );

  const attachServiceSpecies = useCallback(
    async (serviceId: string, speciesId: string): Promise<ServiceSpecies[]> => {
      await adminApi.createServiceSpecies(serviceId, { speciesId, durationMin: null, price: null });
      const links = await clinicApi.getServiceSpecies(serviceId);
      const safeLinks = Array.isArray(links) ? links : [];
      setServiceSpeciesMap((prev) => ({ ...prev, [serviceId]: safeLinks }));
      await loadData();
      return safeLinks;
    },
    [loadData]
  );

  const detachServiceSpecies = useCallback(
    async (serviceId: string, speciesId: string): Promise<void> => {
      await adminApi.deleteServiceSpecies(serviceId, speciesId);
      setServiceSpeciesMap((prev) => ({
        ...prev,
        [serviceId]: (prev[serviceId] || []).filter((l) => l.speciesId !== speciesId),
      }));
      await loadData();
    },
    [loadData]
  );

  const saveServiceSpeciesOverrides = useCallback(
    async (serviceId: string, links: ServiceSpecies[]): Promise<void> => {
      await Promise.all(
        links.map((link) =>
          adminApi.updateServiceSpecies(serviceId, link.speciesId, {
            durationMin: link.durationMin != null ? Number(link.durationMin) : null,
            price: link.price != null ? Number(link.price) : null,
          })
        )
      );
      await loadData();
    },
    [loadData]
  );

  const saveServiceSpeciesOverride = useCallback(
    async (
      serviceId: string,
      speciesId: string,
      data: { durationMin: number | null; price: number | null },
      isEdit: boolean
    ): Promise<void> => {
      if (isEdit) await adminApi.updateServiceSpecies(serviceId, speciesId, data);
      else await adminApi.createServiceSpecies(serviceId, { speciesId, ...data });
      await loadData();
    },
    [loadData]
  );

  const createSpecies = useCallback(
    async (name: string): Promise<void> => {
      await adminApi.createSpecies(name);
      await loadData();
    },
    [loadData]
  );

  const deleteSpecies = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteSpecies(id);
      await loadData();
    },
    [loadData]
  );

  const saveSpecialization = useCallback(
    async (data: { name: string; description: string }, id?: string): Promise<void> => {
      if (id) await adminApi.updateSpecialization(id, data);
      else await adminApi.createSpecialization(data);
      await loadData();
    },
    [loadData]
  );

  const deleteSpecialization = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteSpecialization(id);
      await loadData();
    },
    [loadData]
  );

  const requestDeleteService = useCallback((service: Service) => {
    setDeleteError(null);
    setDeleteTarget(service);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (!deleting) {
      setDeleteTarget(null);
      setDeleteError(null);
    }
  }, [deleting]);

  const confirmDeleteService = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteService(deleteTarget.id);
      if (selectedService?.id === deleteTarget.id) setSelectedService(null);
      setDeleteTarget(null);
      await loadData();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка удаления услуги'));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, selectedService?.id, loadData]);

  const openSpeciesOverrideModal = useCallback(
    (link?: ServiceSpecies | null) => setSpeciesOverrideModal({ open: true, link }),
    []
  );
  const closeSpeciesOverrideModal = useCallback(() => setSpeciesOverrideModal({ open: false }), []);

  return {
    services: filteredServices,
    specializations,
    speciesList,
    serviceSpeciesMap,
    loading,
    error,
    reload: loadData,
    mainTab,
    activeTabItem,
    switchTab,
    filterSpec,
    setFilterSpec,
    filterSpecies,
    setFilterSpecies,
    search,
    setSearch,
    selectedService,
    setSelectedService,
    serviceModal,
    openCreateService,
    openEditService,
    closeServiceModal,
    saveService,
    loadServiceSpecies,
    attachServiceSpecies,
    detachServiceSpecies,
    saveServiceSpeciesOverrides,
    saveServiceSpeciesOverride,
    createSpecies,
    deleteSpecies,
    saveSpecialization,
    deleteSpecialization,
    deleteTarget,
    deleting,
    deleteError,
    requestDeleteService,
    closeDeleteModal,
    confirmDeleteService,
    speciesOverrideModal,
    attachedSpeciesIds,
    openSpeciesOverrideModal,
    closeSpeciesOverrideModal,
  };
}
