import { api } from '../../api/client';
import {
  Pet,
  CreatePetRequest,
  UpdatePetRequest,
  Appointment,
  BookAppointmentRequest,
  Vaccination,
  PageResponse,
} from '../../types';

// ─── Клиентские операции ──────────────────────────────────

export const clientApi = {
  getPets: (isArchived?: boolean) => {
    const query = isArchived !== undefined ? `?isArchived=${isArchived}` : '';
    return api.get<Pet[]>(`/api/v1/client/pets${query}`);
  },

  getPetById: (id: string) => api.get<Pet>(`/api/v1/client/pets/${id}`),

  createPet: (data: CreatePetRequest) => api.post<Pet>('/api/v1/client/pets', data),

  updatePet: (id: string, data: UpdatePetRequest) =>
    api.patch<Pet>(`/api/v1/client/pets/${id}`, data),

  deletePet: (id: string) => api.delete<void>(`/api/v1/client/pets/${id}`),

  getAppointments: (page = 0, size = 20, status?: string) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) params.append('status', status);
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

  getVaccinations: (petId: string) =>
    api.get<Vaccination[]>(`/api/v1/client/vaccinations?petId=${petId}`),

  getVaccinationById: (id: string) =>
    api.get<Vaccination>(`/api/v1/client/vaccinations/${id}`),
};
