import { api, tokenStorage } from '@/shared/api/client';
import { fetchAllPages, mapWithConcurrency } from '@/shared/lib/pagination';
import type { AppointmentStatus, PageResponse } from '@/shared/types';
import type { Veterinarian } from '@/modules/clinic/types';
import type {
  Appointment,
  Pet,
  Vaccination,
  CreateVaccinationRequest,
  UpdateVaccinationRequest,
} from '@/modules/client/types';
import type { CreateFollowUpRequest, UpdateVetProfileRequest } from './types';

export interface VetAppointmentsQuery {
  page?: number;
  size?: number;
  petId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  from?: string;
  to?: string;
  direction?: 'ASC' | 'DESC';
}

export interface VetVaccinationsQuery {
  page?: number;
  size?: number;
  petId?: string;
  name?: string;
  nextDueFrom?: string;
  nextDueTo?: string;
}

const PATIENTS_CACHE_TTL_MS = 60_000;
let cachedToken = '';
let cachedPatients: { ts: number; data: Pet[] } | null = null;
let inFlightPatients: { token: string; promise: Promise<Pet[]> } | null = null;
const cachedPetsById = new Map<string, Pet>();

function syncCacheToken(): string {
  const token = tokenStorage.get() || '';
  if (token !== cachedToken) {
    cachedToken = token;
    cachedPatients = null;
    inFlightPatients = null;
    cachedPetsById.clear();
  }
  return token;
}

// ─── Врачебные операции ───────────────────────────────────

export const vetApi = {
  getProfile: () => api.get<Veterinarian>('/api/v1/veterinarian/profile'),

  updateProfile: (data: UpdateVetProfileRequest) =>
    api.patch<Veterinarian>('/api/v1/veterinarian/profile', data),

  getAppointments: (
    pageOrOptions: number | VetAppointmentsQuery = 0,
    size = 20,
    status?: AppointmentStatus | AppointmentStatus[] | string
  ) => {
    const opts: VetAppointmentsQuery =
      typeof pageOrOptions === 'object' && pageOrOptions !== null
        ? pageOrOptions
        : {
            page: pageOrOptions,
            size,
            status: status as AppointmentStatus | AppointmentStatus[] | undefined,
          };
    const query = new URLSearchParams({
      page: (opts.page ?? 0).toString(),
      size: (opts.size ?? 20).toString(),
    });
    if (opts.petId) query.append('petId', opts.petId);
    if (opts.status) {
      if (Array.isArray(opts.status)) {
        opts.status.forEach((s) => {
          if (s) query.append('status', s);
        });
      } else {
        query.append('status', opts.status);
      }
    }
    if (opts.from) query.append('from', opts.from);
    if (opts.to) query.append('to', opts.to);
    if (opts.direction) query.append('direction', opts.direction);
    return api.get<PageResponse<Appointment>>(`/api/v1/veterinarian/appointments?${query.toString()}`);
  },

  getAppointmentById: (id: string) =>
    api.get<Appointment>(`/api/v1/veterinarian/appointments/${id}`),

  updateAppointment: (
    id: string,
    data: {
      status?: AppointmentStatus;
      vetNotes?: string | null;
      notes?: string | null;
      cancelReason?: string | null;
      cancellationReason?: string | null;
    }
  ) => {
    const payload: {
      status?: AppointmentStatus;
      vetNotes?: string | null;
      cancelReason?: string | null;
    } = {};

    if (data.status !== undefined) payload.status = data.status;
    if (data.vetNotes !== undefined) payload.vetNotes = data.vetNotes;
    else if (data.notes !== undefined) payload.vetNotes = data.notes;
    if (data.cancelReason !== undefined) payload.cancelReason = data.cancelReason;
    else if (data.cancellationReason !== undefined) payload.cancelReason = data.cancellationReason;

    return api.patch<Appointment>(`/api/v1/veterinarian/appointments/${id}`, payload);
  },

  createFollowUp: (id: string, data: CreateFollowUpRequest) =>
    api.post<Appointment>(`/api/v1/veterinarian/appointments/${id}/follow-ups`, data),

  getPatientPet: async (id: string): Promise<Pet> => {
    syncCacheToken();
    const pet = await api.get<Pet>(`/api/v1/veterinarian/pets/${id}`);
    if (pet?.id) cachedPetsById.set(pet.id, pet);
    return pet;
  },

  getPatientPetsByIds: async (
    petIds: readonly string[],
    existingMap?: Record<string, Pet>
  ): Promise<Record<string, Pet>> => {
    syncCacheToken();
    const out: Record<string, Pet> = {};
    const missing: string[] = [];

    for (const id of new Set(petIds)) {
      if (!id) continue;
      if (existingMap?.[id]) {
        out[id] = existingMap[id];
      } else if (cachedPetsById.has(id)) {
        out[id] = cachedPetsById.get(id)!;
      } else {
        missing.push(id);
      }
    }

    if (missing.length > 0) {
      const fetched = await mapWithConcurrency(
        missing,
        (id) => vetApi.getPatientPet(id).catch(() => null),
        6
      );
      for (const pet of fetched) {
        if (pet?.id) out[pet.id] = pet;
      }
    }

    return out;
  },

  getPatients: async (forceRefresh = false): Promise<Pet[]> => {
    const token = syncCacheToken();
    if (!forceRefresh && cachedPatients && Date.now() - cachedPatients.ts < PATIENTS_CACHE_TTL_MS) {
      return cachedPatients.data;
    }
    if (!forceRefresh && inFlightPatients && inFlightPatients.token === token) {
      return inFlightPatients.promise;
    }

    const promise = (async () => {
      const allAppointments = await fetchAllPages(
        (page, size) => vetApi.getAppointments({ page, size, direction: 'DESC' }),
        { pageSize: 100, maxPages: 50, concurrency: 4 }
      );
      const petIds = Array.from(new Set(allAppointments.map((a) => a.petId)));
      if (petIds.length === 0) return [];
      const pets = await mapWithConcurrency(
        petIds,
        async (id) => {
          const cached = cachedPetsById.get(id);
          if (cached) return cached;
          return vetApi.getPatientPet(id).catch(() => null);
        },
        6
      );
      const resolved = pets.filter((p): p is Pet => p !== null);
      if (syncCacheToken() === token) {
        cachedPatients = { ts: Date.now(), data: resolved };
      }
      return resolved;
    })().finally(() => {
      if (inFlightPatients?.promise === promise) {
        inFlightPatients = null;
      }
    });

    inFlightPatients = { token, promise };
    return promise;
  },

  getVaccinations: (
    pageOrOptions: number | VetVaccinationsQuery = 0,
    size = 20,
    petId?: string
  ) => {
    const opts: VetVaccinationsQuery =
      typeof pageOrOptions === 'object' && pageOrOptions !== null
        ? pageOrOptions
        : { page: pageOrOptions, size, petId };
    const params = new URLSearchParams({
      page: (opts.page ?? 0).toString(),
      size: (opts.size ?? 20).toString(),
    });
    if (opts.petId) params.append('petId', opts.petId);
    if (opts.name) params.append('name', opts.name);
    if (opts.nextDueFrom) params.append('nextDueFrom', opts.nextDueFrom);
    if (opts.nextDueTo) params.append('nextDueTo', opts.nextDueTo);
    return api.get<PageResponse<Vaccination>>(`/api/v1/veterinarian/vaccinations?${params.toString()}`);
  },

  createVaccination: (data: CreateVaccinationRequest) => {
    const payload = {
      petId: data.petId,
      appointmentId: data.appointmentId || null,
      name: data.name || data.vaccineName || '',
      administeredOn: data.administeredOn || data.administeredAt || '',
      nextDueOn: data.nextDueOn || data.validUntil || null,
    };
    return api.post<Vaccination>('/api/v1/veterinarian/vaccinations', payload);
  },

  updateVaccination: (id: string, data: UpdateVaccinationRequest) =>
    api.patch<Vaccination>(`/api/v1/veterinarian/vaccinations/${id}`, data),
};
