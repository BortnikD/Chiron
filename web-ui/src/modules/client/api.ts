import { api } from '@/shared/api/client';
import type { AppointmentStatus, PageResponse, PhotoLinks } from '@/shared/types';
import type {
  Pet,
  CreatePetRequest,
  UpdatePetRequest,
  Appointment,
  BookAppointmentRequest,
  Vaccination,
  ClientSummary,
} from './types';

export interface ClientPetsQuery {
  isArchived?: boolean;
  withSummary?: boolean;
}

export interface ClientAppointmentsQuery {
  page?: number;
  size?: number;
  petId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  from?: string;
  to?: string;
  direction?: 'ASC' | 'DESC';
}

export interface ClientVaccinationsQuery {
  petId?: string;
  nextDueFrom?: string;
  nextDueTo?: string;
}

// ─── Клиентские операции ──────────────────────────────────

export const clientApi = {
  getPets: (arg?: boolean | ClientPetsQuery) => {
    const params = new URLSearchParams();
    if (typeof arg === 'boolean') {
      params.append('isArchived', String(arg));
    } else if (arg) {
      if (arg.isArchived !== undefined) params.append('isArchived', String(arg.isArchived));
      if (arg.withSummary !== undefined) params.append('withSummary', String(arg.withSummary));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Pet[]>(`/api/v1/client/pets${query}`);
  },

  getPetById: (id: string, withSummary?: boolean) => {
    const query = withSummary ? '?withSummary=true' : '';
    return api.get<Pet>(`/api/v1/client/pets/${id}${query}`);
  },

  createPet: (data: CreatePetRequest) => api.post<Pet>('/api/v1/client/pets', data),

  updatePet: (id: string, data: UpdatePetRequest) =>
    api.patch<Pet>(`/api/v1/client/pets/${id}`, data),

  uploadPetPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.putForm<PhotoLinks>(`/api/v1/client/pets/${id}/photo`, formData);
  },

  deletePetPhoto: (id: string) => api.delete<void>(`/api/v1/client/pets/${id}/photo`),

  deletePet: (id: string) => api.delete<void>(`/api/v1/client/pets/${id}`),

  getAppointments: (
    pageOrOptions: number | ClientAppointmentsQuery = 0,
    size = 20,
    status?: AppointmentStatus | AppointmentStatus[] | string
  ) => {
    const opts: ClientAppointmentsQuery =
      typeof pageOrOptions === 'object' && pageOrOptions !== null
        ? pageOrOptions
        : {
            page: pageOrOptions,
            size,
            status: status as AppointmentStatus | AppointmentStatus[] | undefined,
          };
    const params = new URLSearchParams({
      page: (opts.page ?? 0).toString(),
      size: (opts.size ?? 20).toString(),
    });
    if (opts.petId) params.append('petId', opts.petId);
    if (opts.status) {
      if (Array.isArray(opts.status)) {
        opts.status.forEach((s) => params.append('status', s));
      } else {
        params.append('status', opts.status);
      }
    }
    if (opts.from) params.append('from', opts.from);
    if (opts.to) params.append('to', opts.to);
    if (opts.direction) params.append('direction', opts.direction);
    return api.get<PageResponse<Appointment>>(`/api/v1/client/appointments?${params.toString()}`);
  },

  getAppointmentById: (id: string) => api.get<Appointment>(`/api/v1/client/appointments/${id}`),

  bookAppointment: (data: BookAppointmentRequest) =>
    api.post<Appointment>('/api/v1/client/appointments', data),

  cancelAppointment: (id: string, reason?: string) =>
    api.post<Appointment>(
      `/api/v1/client/appointments/${id}/cancel`,
      reason ? { reason } : {}
    ),

  getVaccinations: (arg?: string | ClientVaccinationsQuery) => {
    const params = new URLSearchParams();
    if (typeof arg === 'string') {
      if (arg) params.append('petId', arg);
    } else if (arg) {
      if (arg.petId) params.append('petId', arg.petId);
      if (arg.nextDueFrom) params.append('nextDueFrom', arg.nextDueFrom);
      if (arg.nextDueTo) params.append('nextDueTo', arg.nextDueTo);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Vaccination[]>(`/api/v1/client/vaccinations${query}`);
  },

  getVaccinationById: (id: string) =>
    api.get<Vaccination>(`/api/v1/client/vaccinations/${id}`),

  getSummary: () => api.get<ClientSummary>('/api/v1/client/summary'),
};
