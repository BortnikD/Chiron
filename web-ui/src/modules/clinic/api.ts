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

// ─── Публичные справочники клиники и расписание ────────────

export const clinicApi = {
  getServices: (specializationId?: string, speciesId?: string) => {
    const params = new URLSearchParams();
    if (specializationId) params.append('specializationId', specializationId);
    if (speciesId) params.append('speciesId', speciesId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Service[]>(`/api/v1/services${query}`);
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

  getSpecies: () => api.get<Species[]>('/api/v1/species'),

  getSpecializations: () => api.get<Specialization[]>('/api/v1/specializations'),

  getServiceSpecies: (serviceId: string) =>
    api.get<ServiceSpecies[]>(`/api/v1/services/${serviceId}/species`),

  getVetSpeciesPermissions: (vetId: string) =>
    api.get<VeterinarianSpeciesPermission[]>(`/api/v1/veterinarians/${vetId}/species`),

  getWorkSchedules: (vetId: string) =>
    api.get<WorkSchedule[]>(`/api/v1/work-schedules?veterinarianId=${vetId}`),

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

  findAvailableSlots: (params: {
    speciesId: string;
    serviceId: string;
    from: string;
    to: string;
    veterinarianId?: string;
  }) => {
    const query = new URLSearchParams({
      speciesId: params.speciesId,
      serviceId: params.serviceId,
      from: params.from,
      to: params.to,
    });
    if (params.veterinarianId) {
      query.append('veterinarianId', params.veterinarianId);
    }
    return api.get<AvailableSlotResponse[]>(`/api/v1/appointments/slots?${query.toString()}`);
  },
};
