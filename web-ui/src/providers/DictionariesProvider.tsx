'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { clinicApi } from '@/modules/clinic/api';
import type {
  SpeciesResponse,
  SpecializationResponse,
  ServiceResponse,
  VeterinarianResponse,
} from '@/shared/types';

export type DictionaryKey = 'species' | 'specializations' | 'services' | 'veterinarians';

export interface DictionariesContextValue {
  species: SpeciesResponse[];
  specializations: SpecializationResponse[];
  services: ServiceResponse[];
  veterinarians: VeterinarianResponse[];
  speciesMap: Map<string, SpeciesResponse>;
  specializationsMap: Map<string, SpecializationResponse>;
  servicesMap: Map<string, ServiceResponse>;
  veterinariansMap: Map<string, VeterinarianResponse>;
  // Вспомогательные карты id -> name для быстрого поиска строк
  speciesRecordMap: Record<string, string>;
  specsRecordMap: Record<string, string>;
  servicesRecordMap: Record<string, string>;
  loading: boolean;
  error: string | null;
  invalidateDictionaries: (keys?: DictionaryKey[]) => Promise<void>;
  refreshDictionaries: (keys?: DictionaryKey[]) => Promise<void>;
}

const DictionariesContext = createContext<DictionariesContextValue | null>(null);

// In-memory cache & in-flight promises singleton for deduplication across the app
const memoryCache: {
  species?: SpeciesResponse[];
  specializations?: SpecializationResponse[];
  services?: ServiceResponse[];
  veterinarians?: VeterinarianResponse[];
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
  const [specializations, setSpecializations] = useState<SpecializationResponse[]>(
    () => memoryCache.specializations || []
  );
  const [services, setServices] = useState<ServiceResponse[]>(() => memoryCache.services || []);
  const [veterinarians, setVeterinarians] = useState<VeterinarianResponse[]>(
    () => memoryCache.veterinarians || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const loadAll = useCallback(async (keysToFetch?: DictionaryKey[]) => {
    const keys = keysToFetch || ['species', 'specializations', 'services', 'veterinarians'];
    setLoading(true);
    setError(null);

    try {
      const promises: Promise<unknown>[] = [];

      if (keys.includes('species')) {
        promises.push(
          fetchDictionary('species', () => clinicApi.getSpecies()).then((res) => {
            if (isMountedRef.current) setSpecies(Array.isArray(res) ? res : []);
          })
        );
      }
      if (keys.includes('specializations')) {
        promises.push(
          fetchDictionary('specializations', () => clinicApi.getSpecializations()).then((res) => {
            if (isMountedRef.current) setSpecializations(Array.isArray(res) ? res : []);
          })
        );
      }
      if (keys.includes('services')) {
        promises.push(
          fetchDictionary('services', () => clinicApi.getServices()).then((res) => {
            if (isMountedRef.current) setServices(Array.isArray(res) ? res : []);
          })
        );
      }
      if (keys.includes('veterinarians')) {
        promises.push(
          fetchDictionary('veterinarians', () => clinicApi.getVeterinarians()).then((res) => {
            if (isMountedRef.current) setVeterinarians(Array.isArray(res) ? res : []);
          })
        );
      }

      await Promise.all(promises);
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

  useEffect(() => {
    isMountedRef.current = true;
    void loadAll();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadAll]);

  const invalidateDictionaries = useCallback(
    async (keys?: DictionaryKey[]) => {
      const targetKeys = keys || ['species', 'specializations', 'services', 'veterinarians'];
      for (const k of targetKeys) {
        delete memoryCache[k];
        inFlightPromises.delete(k);
      }
      await loadAll(targetKeys);
    },
    [loadAll]
  );

  const refreshDictionaries = useCallback(
    async (keys?: DictionaryKey[]) => {
      await invalidateDictionaries(keys);
    },
    [invalidateDictionaries]
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

  const value = useMemo<DictionariesContextValue>(
    () => ({
      species,
      specializations,
      services,
      veterinarians,
      speciesMap,
      specializationsMap,
      servicesMap,
      veterinariansMap,
      speciesRecordMap,
      specsRecordMap,
      servicesRecordMap,
      loading,
      error,
      invalidateDictionaries,
      refreshDictionaries,
    }),
    [
      species,
      specializations,
      services,
      veterinarians,
      speciesMap,
      specializationsMap,
      servicesMap,
      veterinariansMap,
      speciesRecordMap,
      specsRecordMap,
      servicesRecordMap,
      loading,
      error,
      invalidateDictionaries,
      refreshDictionaries,
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
