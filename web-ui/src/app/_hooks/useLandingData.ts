'use client';

import { useCallback, useEffect, useState } from 'react';
import { clinicApi } from '@/modules/clinic/api';
import type { Service, Specialization, Species, Veterinarian } from '@/modules/clinic/types';
import { formatApiError } from '@/shared/lib';

export function useLandingData() {
  const [services, setServices] = useState<Service[]>([]);
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [specs, setSpecs] = useState<Specialization[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
    ])
      .then(([svc, vt, sp, spc]) => {
        if (cancelled) return;
        setServices(Array.isArray(svc) ? svc : []);
        setVets(Array.isArray(vt) ? vt : []);
        setSpecs(Array.isArray(sp) ? sp : []);
        setSpecies(Array.isArray(spc) ? spc : []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(formatApiError(err, 'Не удалось загрузить данные клиники'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  return { services, vets, specs, species, loading, error, reload };
}
