import { api, tokenStorage } from '@/shared/api/client';
import { fetchAllPages, isPhotoUrlFresh, mapWithConcurrency } from '@/shared/lib';
import type { AppointmentStatus, Gender, PageResponse, PhotoLinks } from '@/shared/types';
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

export interface VetPatientsQuery {
  page?: number;
  size?: number;
  ownerId?: string;
  speciesId?: string;
  gender?: Gender | string;
  isArchived?: boolean;
  name?: string;
}

const PATIENTS_CACHE_TTL_MS = 60_000;
let cachedToken = '';
let cachedProfile: { ts: number; data: Veterinarian } | null = null;
let inFlightProfile: { token: string; promise: Promise<Veterinarian> } | null = null;
let cachedPatients: { ts: number; data: Pet[] } | null = null;
let inFlightPatients: { token: string; promise: Promise<Pet[]> } | null = null;
const cachedPetsById = new Map<string, { ts: number; pet: Pet }>();
const inFlightPetsById = new Map<string, Promise<Pet>>();

function syncCacheToken(): string {
  const token = tokenStorage.get() || '';
  if (token !== cachedToken) {
    cachedToken = token;
    cachedProfile = null;
    inFlightProfile = null;
    cachedPatients = null;
    inFlightPatients = null;
    cachedPetsById.clear();
    inFlightPetsById.clear();
  }
  return token;
}

// ─── Врачебные операции ───────────────────────────────────

export const vetApi = {
  getProfile: async (forceRefresh = false): Promise<Veterinarian> => {
    const token = syncCacheToken();
    if (
      !forceRefresh &&
      cachedProfile &&
      Date.now() - cachedProfile.ts < PATIENTS_CACHE_TTL_MS &&
      isPhotoUrlFresh(cachedProfile.data)
    ) {
      return cachedProfile.data;
    }
    if (!forceRefresh && inFlightProfile && inFlightProfile.token === token) {
      return inFlightProfile.promise;
    }
    const promise = api
      .get<Veterinarian>('/api/v1/veterinarian/profile')
      .then((prof) => {
        if (syncCacheToken() === token && prof) {
          cachedProfile = { ts: Date.now(), data: prof };
        }
        return prof;
      })
      .finally(() => {
        if (inFlightProfile?.promise === promise) {
          inFlightProfile = null;
        }
      });
    inFlightProfile = { token, promise };
    return promise;
  },

  updateProfile: async (data: UpdateVetProfileRequest) => {
    const updated = await api.patch<Veterinarian>('/api/v1/veterinarian/profile', data);
    if (updated) {
      cachedProfile = { ts: Date.now(), data: updated };
    }
    return updated;
  },

  uploadOwnPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const links = await api.putForm<PhotoLinks>('/api/v1/veterinarian/profile/photo', formData);
    if (cachedProfile) {
      cachedProfile = {
        ts: Date.now(),
        data: { ...cachedProfile.data, ...links },
      };
    }
    return links;
  },

  deleteOwnPhoto: async () => {
    await api.delete<void>('/api/v1/veterinarian/profile/photo');
    if (cachedProfile) {
      cachedProfile = {
        ts: Date.now(),
        data: {
          ...cachedProfile.data,
          photoUrl: null,
          photoThumbnailUrl: null,
          photoUrlExpiresAt: null,
        },
      };
    }
  },

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
    const cachedEntry = cachedPetsById.get(id);
    if (
      cachedEntry &&
      Date.now() - cachedEntry.ts < PATIENTS_CACHE_TTL_MS &&
      isPhotoUrlFresh(cachedEntry.pet)
    ) {
      return cachedEntry.pet;
    }
    const existingPromise = inFlightPetsById.get(id);
    if (existingPromise) {
      return existingPromise;
    }
    const promise = api
      .get<Pet>(`/api/v1/veterinarian/pets/${id}`)
      .then((pet) => {
        if (pet?.id) {
          cachedPetsById.set(pet.id, { ts: Date.now(), pet });
        }
        return pet;
      })
      .finally(() => {
        inFlightPetsById.delete(id);
      });
    inFlightPetsById.set(id, promise);
    return promise;
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
      const existing = existingMap?.[id];
      const cachedEntry = cachedPetsById.get(id);
      const cached =
        cachedEntry && Date.now() - cachedEntry.ts < PATIENTS_CACHE_TTL_MS
          ? cachedEntry.pet
          : undefined;
      if (existing && isPhotoUrlFresh(existing)) {
        out[id] = existing;
      } else if (cached && isPhotoUrlFresh(cached)) {
        out[id] = cached;
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

  getPatientsPage: async (
    pageOrOptions: number | VetPatientsQuery = 0,
    size = 20
  ): Promise<PageResponse<Pet>> => {
    syncCacheToken();
    const opts: VetPatientsQuery =
      typeof pageOrOptions === 'object' && pageOrOptions !== null
        ? pageOrOptions
        : { page: pageOrOptions, size };
    const query = new URLSearchParams({
      page: (opts.page ?? 0).toString(),
      size: (opts.size ?? 20).toString(),
    });
    if (opts.ownerId) query.append('ownerId', opts.ownerId);
    if (opts.speciesId) query.append('speciesId', opts.speciesId);
    if (opts.gender) query.append('gender', opts.gender);
    if (opts.isArchived !== undefined) query.append('isArchived', String(opts.isArchived));
    if (opts.name) query.append('name', opts.name);
    const res = await api.get<PageResponse<Pet>>(`/api/v1/veterinarian/pets?${query.toString()}`);
    if (Array.isArray(res?.items)) {
      const now = Date.now();
      for (const pet of res.items) {
        if (pet?.id) cachedPetsById.set(pet.id, { ts: now, pet });
      }
    }
    return res;
  },

  getPatientById: (id: string) => vetApi.getPatientPet(id),

  getPatients: async (forceRefresh = false): Promise<Pet[]> => {
    const token = syncCacheToken();
    if (
      !forceRefresh &&
      cachedPatients &&
      Date.now() - cachedPatients.ts < PATIENTS_CACHE_TTL_MS &&
      cachedPatients.data.every((p) => isPhotoUrlFresh(p))
    ) {
      return cachedPatients.data;
    }
    if (!forceRefresh && inFlightPatients && inFlightPatients.token === token) {
      return inFlightPatients.promise;
    }

    const promise = (async () => {
      const resolved = await fetchAllPages(
        (page, pageSize) => vetApi.getPatientsPage({ page, size: pageSize }),
        { pageSize: 100, maxPages: 2, concurrency: 2 }
      );
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
