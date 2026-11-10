import { api } from '@/shared/api/client';
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

// ─── Врачебные операции ───────────────────────────────────

export const vetApi = {
  getProfile: () => api.get<Veterinarian>('/api/v1/veterinarian/profile'),

  updateProfile: (data: UpdateVetProfileRequest) =>
    api.patch<Veterinarian>('/api/v1/veterinarian/profile', data),

  getAppointments: (page = 0, size = 20, status?: string) => {
    const query = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) query.append('status', status);
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

  getPatientPet: (id: string) => api.get<Pet>(`/api/v1/veterinarian/pets/${id}`),

  getPatients: async (): Promise<Pet[]> => {
    const appts = await vetApi.getAppointments(0, 100);
    const petIds = Array.from(new Set((appts.items || []).map((a) => a.petId)));
    if (petIds.length === 0) return [];
    const pets = await Promise.all(
      petIds.map((id) => vetApi.getPatientPet(id).catch(() => null))
    );
    return pets.filter((p): p is Pet => p !== null);
  },

  getVaccinations: (page = 0, size = 20, petId?: string) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (petId) params.append('petId', petId);
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
