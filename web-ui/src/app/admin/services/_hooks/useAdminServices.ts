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
  Veterinarian,
} from '@/modules/clinic/types';
import { useToast } from '@/shared/components';
import { formatApiError, mapWithConcurrency, toIdNameMap } from '@/shared/lib';
import {
  SERVICE_NAV_TABS,
  filterAdminServices,
  resolveServicesTab,
  type ServicesMainTab,
  type ServiceActiveFilter,
  type SaveServiceInput,
} from '../_components/constants';
import { useServiceDictionaries } from './useServiceDictionaries';

export { SERVICE_NAV_TABS };
export type { ServicesMainTab, ServiceActiveFilter, SaveServiceInput };

export function useAdminServices() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const tabParam = searchParams.get('tab');
  const selParam = searchParams.get('sel');

  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [serviceSpeciesMap, setServiceSpeciesMap] = useState<Record<string, ServiceSpecies[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialSpec = searchParams.get('specializationId') || searchParams.get('filterSpec') || 'ALL';
  const initialSpecies = searchParams.get('speciesId') || searchParams.get('filterSpecies') || 'ALL';
  const initialActive = (searchParams.get('filterActive') as ServiceActiveFilter) || 'ALL';
  const initialSearch = searchParams.get('search') || '';

  const [mainTab, setMainTab] = useState<ServicesMainTab>(() => resolveServicesTab(tabParam));
  const [filterSpec, setFilterSpecState] = useState<string>(initialSpec);
  const [filterSpecies, setFilterSpeciesState] = useState<string>(initialSpecies);
  const [filterActive, setFilterActiveState] = useState<ServiceActiveFilter>(initialActive);
  const [search, setSearchState] = useState(initialSearch);

  const syncServiceFiltersToUrl = useCallback((spec: string, species: string, active: string, q: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (spec && spec !== 'ALL') url.searchParams.set('filterSpec', spec);
    else url.searchParams.delete('filterSpec');
    if (species && species !== 'ALL') url.searchParams.set('filterSpecies', species);
    else url.searchParams.delete('filterSpecies');
    if (active && active !== 'ALL') url.searchParams.set('filterActive', active);
    else url.searchParams.delete('filterActive');
    if (q.trim()) url.searchParams.set('search', q.trim());
    else url.searchParams.delete('search');

    const nextSearch = url.searchParams.toString();
    const currentSearch = window.location.search.replace(/^\?/, '');
    if (nextSearch !== currentSearch) {
      window.history.replaceState(null, '', url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash);
    }
  }, []);

  const setFilterSpec = useCallback((v: string) => {
    setFilterSpecState(v);
    syncServiceFiltersToUrl(v, filterSpecies, filterActive, search);
  }, [filterSpecies, filterActive, search, syncServiceFiltersToUrl]);

  const setFilterSpecies = useCallback((v: string) => {
    setFilterSpeciesState(v);
    syncServiceFiltersToUrl(filterSpec, v, filterActive, search);
  }, [filterSpec, filterActive, search, syncServiceFiltersToUrl]);

  const setFilterActive = useCallback((v: ServiceActiveFilter) => {
    setFilterActiveState(v);
    syncServiceFiltersToUrl(filterSpec, filterSpecies, v, search);
  }, [filterSpec, filterSpecies, search, syncServiceFiltersToUrl]);

  const setSearch = useCallback((v: string) => {
    setSearchState(v);
    syncServiceFiltersToUrl(filterSpec, filterSpecies, filterActive, v);
  }, [filterSpec, filterSpecies, filterActive, syncServiceFiltersToUrl]);

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
  const appliedSelRef = useRef<string | null>(null);

  useEffect(() => {
    setMainTab(resolveServicesTab(tabParam));
  }, [tabParam]);

  const loadData = useCallback(async () => {
    const reqId = ++loadRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [svcData, specData, speciesData, vetsData] = await Promise.all([
        adminApi.getServices(),
        clinicApi.getSpecializations(),
        clinicApi.getSpecies(),
        adminApi.getVeterinarians(),
      ]);
      const safeServices = Array.isArray(svcData) ? svcData : [];
      const linkEntries = await mapWithConcurrency(
        safeServices,
        async (s) => [s.id, (await clinicApi.getServiceSpecies(s.id)) || []] as const,
        6
      );

      if (loadRequestIdRef.current !== reqId) return;

      setServices(safeServices);
      setSpecializations(Array.isArray(specData) ? specData : []);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      setVeterinarians(Array.isArray(vetsData) ? vetsData : []);
      setServiceSpeciesMap(Object.fromEntries(linkEntries));

      if (selParam && appliedSelRef.current !== selParam) {
        appliedSelRef.current = selParam;
        const found = safeServices.find((s) => s.id === selParam);
        if (found) setSelectedService(found);
      } else {
        setSelectedService((prev) =>
          prev ? safeServices.find((s) => s.id === prev.id) || null : null
        );
      }
    } catch (err: unknown) {
      if (loadRequestIdRef.current !== reqId) return;
      setError(formatApiError(err, 'Не удалось загрузить справочники и услуги'));
    } finally {
      if (loadRequestIdRef.current === reqId) setLoading(false);
    }
  }, [selParam]);

  useEffect(() => {
    void loadData();
    return () => {
      loadRequestIdRef.current += 1;
    };
  }, [loadData]);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const filteredServices = useMemo(
    () =>
      filterAdminServices({
        services,
        filterSpec,
        filterSpecies,
        filterActive,
        search,
        serviceSpeciesMap,
        specsMap,
      }),
    [services, filterSpec, filterSpecies, filterActive, search, serviceSpeciesMap, specsMap]
  );

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
      toast(id ? 'Услуга сохранена' : 'Услуга создана', saved.name);
      return saved;
    },
    [loadData, toast]
  );

  const attachServiceSpecies = useCallback(
    async (serviceId: string, speciesId: string): Promise<ServiceSpecies[]> => {
      await adminApi.createServiceSpecies(serviceId, { speciesId, durationMin: null, price: null });
      const links = await clinicApi.getServiceSpecies(serviceId);
      const safeLinks = Array.isArray(links) ? links : [];
      setServiceSpeciesMap((prev) => ({ ...prev, [serviceId]: safeLinks }));
      toast('Вид привязан', speciesMap[speciesId] || undefined);
      return safeLinks;
    },
    [speciesMap, toast]
  );

  const detachServiceSpecies = useCallback(
    async (serviceId: string, speciesId: string): Promise<void> => {
      await adminApi.deleteServiceSpecies(serviceId, speciesId);
      setServiceSpeciesMap((prev) => ({
        ...prev,
        [serviceId]: (prev[serviceId] || []).filter((l) => l.speciesId !== speciesId),
      }));
      toast('Вид отвязан', speciesMap[speciesId] || undefined);
    },
    [speciesMap, toast]
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
      toast('Переопределения сохранены');
    },
    [loadData, toast]
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
      toast(isEdit ? 'Переопределение обновлено' : 'Вид привязан', speciesMap[speciesId] || undefined);
    },
    [loadData, speciesMap, toast]
  );

  const {
    createSpecies,
    updateSpecies,
    deleteSpecies,
    saveSpecialization,
    deleteSpecialization,
  } = useServiceDictionaries(loadData);

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
      toast('Услуга удалена');
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка удаления услуги'));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, selectedService?.id, loadData, toast]);

  const openSpeciesOverrideModal = useCallback(
    (link?: ServiceSpecies | null) => setSpeciesOverrideModal({ open: true, link }),
    []
  );
  const closeSpeciesOverrideModal = useCallback(() => setSpeciesOverrideModal({ open: false }), []);

  return {
    allServices: services,
    services: filteredServices,
    specializations,
    speciesList,
    veterinarians,
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
    filterActive,
    setFilterActive,
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
    updateSpecies,
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
