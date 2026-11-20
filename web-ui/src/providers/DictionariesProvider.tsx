'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { clinicApi, clearClinicDictionariesCache } from '@/modules/clinic/api';
import { registerSpecializationColors, registerSpeciesColors } from '@/shared/lib';
import type {
  SpeciesResponse,
  SpecializationResponse,
  ServiceResponse,
  VeterinarianResponse,
  Pet,
} from '@/shared/types';

export type DictionaryKey = 'species' | 'specializations' | 'services' | 'veterinarians';

export interface DictionariesContextValue {
  species: SpeciesResponse[];
  specializations: SpecializationResponse[];
  services: ServiceResponse[];
  veterinarians: VeterinarianResponse[];
  pets: Pet[];
  speciesMap: Map<string, SpeciesResponse>;
  specializationsMap: Map<string, SpecializationResponse>;
  servicesMap: Map<string, ServiceResponse>;
  veterinariansMap: Map<string, VeterinarianResponse>;
  petsMap: Map<string, Pet>;
  // Вспомогательные карты id -> name для быстрого поиска строк
  speciesRecordMap: Record<string, string>;
  specsRecordMap: Record<string, string>;
  servicesRecordMap: Record<string, string>;
  petsRecordMap: Record<string, string>;
  loading: boolean;
  error: string | null;
  failedKeys: DictionaryKey[];
  invalidateDictionaries: (keys?: DictionaryKey[]) => Promise<void>;
  refreshDictionaries: (keys?: DictionaryKey[]) => Promise<void>;
  retryFailed: () => Promise<void>;
  upsertVeterinarian: (vet: VeterinarianResponse) => void;
  upsertService: (service: ServiceResponse) => void;
  upsertSpecies: (species: SpeciesResponse) => void;
  upsertSpecialization: (spec: SpecializationResponse) => void;
  upsertPet: (pet: Pet) => void;
  upsertPets: (pets: Pet[]) => void;
}

const DictionariesContext = createContext<DictionariesContextValue | null>(null);

// In-memory cache & in-flight promises singleton for deduplication across the app
const memoryCache: {
  species?: SpeciesResponse[];
  specializations?: SpecializationResponse[];
  services?: ServiceResponse[];
  veterinarians?: VeterinarianResponse[];
  pets?: Pet[];
} = {};

const inFlightPromises = new Map<DictionaryKey, Promise<unknown>>();

async function fetchDictionary<T>(key: DictionaryKey, fetcher: () => Promise<T>): Promise<T> {
  if (memoryCache[key]) {
    return memoryCache[key] as T;
  }
  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key) as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      memoryCache[key] = (Array.isArray(data) ? data : []) as never;
      return data;
    })
    .finally(() => {
      inFlightPromises.delete(key);
    });

  inFlightPromises.set(key, promise);
  return promise;
}

export function DictionariesProvider({ children }: { children: React.ReactNode }) {
  const [species, setSpecies] = useState<SpeciesResponse[]>(() => memoryCache.species || []);
  const [specializations, setSpecializations] = useState<SpecializationResponse[]>(() => {
    const list = memoryCache.specializations || [];
    registerSpecializationColors(list);
    return list;
  });
  const [services, setServices] = useState<ServiceResponse[]>(() => memoryCache.services || []);
  const [veterinarians, setVeterinarians] = useState<VeterinarianResponse[]>(
    () => memoryCache.veterinarians || []
  );
  const [pets, setPets] = useState<Pet[]>(() => memoryCache.pets || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedKeys, setFailedKeys] = useState<DictionaryKey[]>([]);

  const isMountedRef = useRef(true);

  const loadAll = useCallback(async (keysToFetch?: DictionaryKey[]) => {
    const keys = keysToFetch || ['species', 'specializations', 'services', 'veterinarians'];
    setLoading(true);

    try {
      const tasks: { key: DictionaryKey; promise: Promise<void> }[] = [];

      if (keys.includes('species')) {
        tasks.push({
          key: 'species',
          promise: fetchDictionary('species', () => clinicApi.getSpecies()).then((res) => {
            const list = Array.isArray(res) ? res : [];
            registerSpeciesColors(list);
            if (isMountedRef.current) setSpecies(list);
          }),
        });
      }
      if (keys.includes('specializations')) {
        tasks.push({
          key: 'specializations',
          promise: fetchDictionary('specializations', () => clinicApi.getSpecializations()).then((res) => {
            const list = Array.isArray(res) ? res : [];
            registerSpecializationColors(list);
            if (isMountedRef.current) setSpecializations(list);
          }),
        });
      }
      if (keys.includes('services')) {
        tasks.push({
          key: 'services',
          promise: fetchDictionary('services', () => clinicApi.getServices()).then((res) => {
            if (isMountedRef.current) setServices(Array.isArray(res) ? res : []);
          }),
        });
      }
      if (keys.includes('veterinarians')) {
        tasks.push({
          key: 'veterinarians',
          promise: fetchDictionary('veterinarians', () => clinicApi.getVeterinarians()).then((res) => {
            if (isMountedRef.current) setVeterinarians(Array.isArray(res) ? res : []);
          }),
        });
      }

      const results = await Promise.allSettled(tasks.map((t) => t.promise));
      const newlyFailed: DictionaryKey[] = [];
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          newlyFailed.push(tasks[idx].key);
        }
      });

      if (isMountedRef.current) {
        setFailedKeys(newlyFailed);
        if (newlyFailed.length === tasks.length && tasks.length > 0) {
          setError('Не удалось загрузить данные клиники. Повторите попытку.');
        } else if (newlyFailed.length > 0) {
          setError('Часть данных клиники временно недоступна');
        } else {
          setError(null);
        }
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки справочников');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const retryFailed = useCallback(async () => {
    if (failedKeys.length === 0) {
      await loadAll();
    } else {
      await loadAll(failedKeys);
    }
  }, [failedKeys, loadAll]);

  const invalidateDictionaries = useCallback(
    async (keys?: DictionaryKey[]) => {
      clearClinicDictionariesCache();
      const targetKeys = keys || ['species', 'specializations', 'services', 'veterinarians'];
      for (const k of targetKeys) {
        delete memoryCache[k];
        inFlightPromises.delete(k);
      }
      await loadAll(targetKeys);
    },
    [loadAll]
  );

  useEffect(() => {
    isMountedRef.current = true;
    void loadAll();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadAll]);

  const refreshDictionaries = useCallback(
    async (keys?: DictionaryKey[]) => {
      await invalidateDictionaries(keys);
    },
    [invalidateDictionaries]
  );

  const upsertVeterinarian = useCallback((vet: VeterinarianResponse) => {
    if (!vet?.id) return;
    setVeterinarians((prev) => {
      const idx = prev.findIndex((v) => v.id === vet.id);
      const next = idx >= 0 ? [...prev.slice(0, idx), vet, ...prev.slice(idx + 1)] : [...prev, vet];
      memoryCache.veterinarians = next;
      return next;
    });
  }, []);

  const upsertService = useCallback((service: ServiceResponse) => {
    if (!service?.id) return;
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === service.id);
      const next = idx >= 0 ? [...prev.slice(0, idx), service, ...prev.slice(idx + 1)] : [...prev, service];
      memoryCache.services = next;
      return next;
    });
  }, []);

  const upsertSpecies = useCallback((sp: SpeciesResponse) => {
    if (!sp?.id) return;
    registerSpeciesColors([sp]);
    setSpecies((prev) => {
      const idx = prev.findIndex((s) => s.id === sp.id);
      const next = idx >= 0 ? [...prev.slice(0, idx), sp, ...prev.slice(idx + 1)] : [...prev, sp];
      memoryCache.species = next;
      return next;
    });
  }, []);

  const upsertSpecialization = useCallback((spec: SpecializationResponse) => {
    if (!spec?.id) return;
    registerSpecializationColors([spec]);
    setSpecializations((prev) => {
      const idx = prev.findIndex((s) => s.id === spec.id);
      const next = idx >= 0 ? [...prev.slice(0, idx), spec, ...prev.slice(idx + 1)] : [...prev, spec];
      memoryCache.specializations = next;
      return next;
    });
  }, []);

  const upsertPets = useCallback((newPets: Pet[]) => {
    if (!Array.isArray(newPets) || newPets.length === 0) return;
    setPets((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      for (const p of newPets) {
        if (p?.id) map.set(p.id, p);
      }
      const next = Array.from(map.values());
      memoryCache.pets = next;
      return next;
    });
  }, []);

  const upsertPet = useCallback(
    (pet: Pet) => {
      if (!pet?.id) return;
      upsertPets([pet]);
    },
    [upsertPets]
  );

  const speciesMap = useMemo(() => {
    const map = new Map<string, SpeciesResponse>();
    for (const item of species) {
      if (item.id) map.set(item.id, item);
    }
    return map;
  }, [species]);

  const specializationsMap = useMemo(() => {
    const map = new Map<string, SpecializationResponse>();
    for (const item of specializations) {
      if (item.id) map.set(item.id, item);
    }
    return map;
  }, [specializations]);

  const servicesMap = useMemo(() => {
    const map = new Map<string, ServiceResponse>();
    for (const item of services) {
      if (item.id) map.set(item.id, item);
    }
    return map;
  }, [services]);

  const veterinariansMap = useMemo(() => {
    const map = new Map<string, VeterinarianResponse>();
    for (const item of veterinarians) {
      if (item.id) map.set(item.id, item);
    }
    return map;
  }, [veterinarians]);

  const petsMap = useMemo(() => {
    const map = new Map<string, Pet>();
    for (const item of pets) {
      if (item.id) map.set(item.id, item);
    }
    return map;
  }, [pets]);

  const speciesRecordMap = useMemo(() => {
    const record: Record<string, string> = {};
    for (const s of species) {
      if (s.id && s.name) record[s.id] = s.name;
    }
    return record;
  }, [species]);

  const specsRecordMap = useMemo(() => {
    const record: Record<string, string> = {};
    for (const s of specializations) {
      if (s.id && s.name) record[s.id] = s.name;
    }
    return record;
  }, [specializations]);

  const servicesRecordMap = useMemo(() => {
    const record: Record<string, string> = {};
    for (const s of services) {
      if (s.id && s.name) record[s.id] = s.name;
    }
    return record;
  }, [services]);

  const petsRecordMap = useMemo(() => {
    const record: Record<string, string> = {};
    for (const p of pets) {
      if (p.id && p.name) record[p.id] = p.name;
    }
    return record;
  }, [pets]);

  const value = useMemo<DictionariesContextValue>(
    () => ({
      species,
      specializations,
      services,
      veterinarians,
      pets,
      speciesMap,
      specializationsMap,
      servicesMap,
      veterinariansMap,
      petsMap,
      speciesRecordMap,
      specsRecordMap,
      servicesRecordMap,
      petsRecordMap,
      loading,
      error,
      failedKeys,
      invalidateDictionaries,
      refreshDictionaries,
      retryFailed,
      upsertVeterinarian,
      upsertService,
      upsertSpecies,
      upsertSpecialization,
      upsertPet,
      upsertPets,
    }),
    [
      species,
      specializations,
      services,
      veterinarians,
      pets,
      speciesMap,
      specializationsMap,
      servicesMap,
      veterinariansMap,
      petsMap,
      speciesRecordMap,
      specsRecordMap,
      servicesRecordMap,
      petsRecordMap,
      loading,
      error,
      failedKeys,
      invalidateDictionaries,
      refreshDictionaries,
      retryFailed,
      upsertVeterinarian,
      upsertService,
      upsertSpecies,
      upsertSpecialization,
      upsertPet,
      upsertPets,
    ]
  );

  return <DictionariesContext.Provider value={value}>{children}</DictionariesContext.Provider>;
}

export function useDictionaries(): DictionariesContextValue {
  const ctx = useContext(DictionariesContext);
  if (!ctx) {
    throw new Error('useDictionaries must be used within DictionariesProvider');
  }
  return ctx;
}
