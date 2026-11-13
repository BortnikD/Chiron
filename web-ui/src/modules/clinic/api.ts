import { api } from '@/shared/api/client';
import type {
  Service,
  Veterinarian,
  Species,
  Specialization,
  ServiceSpecies,
  VeterinarianSpeciesPermission,
  AvailableSlotResponse,
  WorkSchedule,
  ScheduleException,
} from './types';

const DICT_CACHE_TTL_MS = 30_000;
const dictCache = new Map<string, { ts: number; data: unknown }>();
const inFlightDict = new Map<string, Promise<unknown>>();

function cachedGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = dictCache.get(key);
  if (cached && Date.now() - cached.ts < DICT_CACHE_TTL_MS) {
    return Promise.resolve(cached.data as T);
  }
  const existing = inFlightDict.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const promise = fetcher()
    .then((res) => {
      dictCache.set(key, { ts: Date.now(), data: res });
      return res;
    })
    .finally(() => {
      inFlightDict.delete(key);
    });
  inFlightDict.set(key, promise);
  return promise;
}

export function clearClinicDictionariesCache(): void {
  dictCache.clear();
}

// ─── Публичные справочники клиники и расписание ────────────

export const clinicApi = {
  getServices: (specializationId?: string, speciesId?: string) => {
    const params = new URLSearchParams();
    if (specializationId) params.append('specializationId', specializationId);
    if (speciesId) params.append('speciesId', speciesId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `/api/v1/services${query}`;
    return cachedGet<Service[]>(url, () => api.get<Service[]>(url));
  },

  getServiceById: (id: string) => api.get<Service>(`/api/v1/services/${id}`),

  getVeterinarians: (specializationId?: string, speciesId?: string) => {
    const params = new URLSearchParams();
    if (specializationId) params.append('specializationId', specializationId);
    if (speciesId) params.append('speciesId', speciesId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Veterinarian[]>(`/api/v1/veterinarians${query}`);
  },

  getVeterinarianById: (id: string) => api.get<Veterinarian>(`/api/v1/veterinarians/${id}`),

  getSpecies: () => cachedGet<Species[]>('/api/v1/species', () => api.get<Species[]>('/api/v1/species')),

  getSpecializations: () =>
    cachedGet<Specialization[]>('/api/v1/specializations', () =>
      api.get<Specialization[]>('/api/v1/specializations')
    ),

  getServiceSpecies: (serviceId: string) =>
    api.get<ServiceSpecies[]>(`/api/v1/services/${serviceId}/species`),

  getVetSpeciesPermissions: (vetId: string) =>
    api.get<VeterinarianSpeciesPermission[]>(`/api/v1/veterinarians/${vetId}/species`),

  getWorkSchedules: (vetId: string) => {
    const url = `/api/v1/work-schedules?veterinarianId=${vetId}`;
    return cachedGet<WorkSchedule[]>(url, () => api.get<WorkSchedule[]>(url));
  },

  getScheduleExceptions: (vetId: string, from?: string, to?: string) => {
    const params = new URLSearchParams({ veterinarianId: vetId });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return api.get<ScheduleException[]>(`/api/v1/schedule-exceptions?${params.toString()}`);
  },

  checkAvailability: (params: {
    veterinarianId: string;
    startAt: string;
    endAt: string;
    excludeAppointmentId?: string;
  }) => {
    const query = new URLSearchParams({
      veterinarianId: params.veterinarianId,
      startAt: params.startAt,
      endAt: params.endAt,
    });
    if (params.excludeAppointmentId) {
      query.append('excludeAppointmentId', params.excludeAppointmentId);
    }
    return api.get<boolean>(`/api/v1/appointments/availability?${query.toString()}`);
  },

  findAvailableSlots: (
    params: {
      speciesId: string;
      serviceId: string;
      from: string;
      to: string;
      veterinarianId?: string;
    },
    options?: { signal?: AbortSignal }
  ) => {
    const query = new URLSearchParams({
      speciesId: params.speciesId,
      serviceId: params.serviceId,
      from: params.from,
      to: params.to,
    });
    if (params.veterinarianId) {
      query.append('veterinarianId', params.veterinarianId);
    }
    return api.get<AvailableSlotResponse[]>(
      `/api/v1/appointments/slots?${query.toString()}`,
      options
    );
  },
};
