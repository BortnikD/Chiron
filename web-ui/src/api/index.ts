import { api, ApiError } from './client';
import {
  AuthResult,
  User,
  Pet,
  CreatePetRequest,
  UpdatePetRequest,
  Appointment,
  BookAppointmentRequest,
  CreateFollowUpRequest,
  AvailableSlotResponse,
  Service,
  Veterinarian,
  VeterinarianSpeciesPermission,
  Species,
  Specialization,
  ServiceSpecies,
  Vaccination,
  CreateVaccinationRequest,
  UpdateVaccinationRequest,
  PageResponse,
  WorkSchedule,
  ScheduleException,
  AppNotification,
  OverviewStatistics,
  TimelinePoint,
  ServiceStatistics,
  SpeciesStatistics,
  VeterinarianStatistics,
  AppointmentStatus,
  StatisticsGranularity,
  AdminCreateAppointmentRequest,
  AdminUpdateAppointmentRequest,
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
  CreateScheduleExceptionRequest,
  CreateServiceSpeciesRequest,
} from '../types';

// ─── Авторизация ──────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResult>('/api/v1/auth/login', data),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    middleName?: string;
  }) => api.post<AuthResult>('/api/v1/auth/register', data),
};

// ─── Профиль текущего пользователя ────────────────────────

export const userApi = {
  getMe: async (): Promise<User> => {
    try {
      return await api.get<User>('/api/v1/users/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Запасной путь для совместимости со старыми версиями бэкенда
        return await api.get<User>('/api/v1/auth/me');
      }
      throw err;
    }
  },

  updateMe: async (
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'middleName' | 'email' | 'phone'>>
  ): Promise<User> => {
    try {
      return await api.patch<User>('/api/v1/users/me', data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return await api.patch<User>('/api/v1/auth/me', data);
      }
      throw err;
    }
  },
};

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

// ─── Врачебные операции ───────────────────────────────────

export const vetApi = {
  getProfile: () => api.get<Veterinarian>('/api/v1/veterinarian/profile'),

  updateProfile: (data: { bio?: string | null; photoUrl?: string | null; experienceYears?: number }) =>
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
    try {
      const appts = await vetApi.getAppointments(0, 100);
      const petIds = Array.from(new Set((appts.items || []).map((a) => a.petId)));
      if (petIds.length === 0) return [];
      const pets = await Promise.all(
        petIds.map((id) => api.get<Pet>(`/api/v1/veterinarian/pets/${id}`).catch(() => null))
      );
      return pets.filter((p): p is Pet => p !== null);
    } catch {
      return [];
    }
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

// ─── Уведомления ──────────────────────────────────────────

export const notificationsApi = {
  getNotifications: (page = 0, size = 20, unreadOnly = false) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    return api.get<PageResponse<AppNotification>>(`/api/v1/notifications?${params.toString()}`);
  },

  getUnreadCount: () => api.get<number>('/api/v1/notifications/unread-count'),

  markAsRead: (id: string) => api.post<AppNotification>(`/api/v1/notifications/${id}/read`, {}),

  markAllAsRead: () => api.post<number>('/api/v1/notifications/read-all', {}),
};

// ─── Административные операции ────────────────────────────

export const adminApi = {
  getUsers: (page = 0, size = 20, role?: string) => {
    const query = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (role) query.append('role', role);
    return api.get<PageResponse<User>>(`/api/v1/admin/users?${query.toString()}`);
  },

  getUserById: (id: string) => api.get<User>(`/api/v1/admin/users/${id}`),

  createUser: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    middleName?: string;
  }) => api.post<User>('/api/v1/admin/users', data),

  updateUser: (id: string, data: Partial<User>) =>
    api.patch<User>(`/api/v1/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete<void>(`/api/v1/admin/users/${id}`),

  getAppointments: (
    page = 0,
    size = 20,
    filter?: {
      veterinarianId?: string;
      petId?: string;
      ownerId?: string;
      serviceId?: string;
      status?: string;
      from?: string;
      to?: string;
    }
  ) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (filter?.status) params.append('status', filter.status);
    if (filter?.veterinarianId) params.append('veterinarianId', filter.veterinarianId);
    if (filter?.petId) params.append('petId', filter.petId);
    if (filter?.ownerId) params.append('ownerId', filter.ownerId);
    if (filter?.serviceId) params.append('serviceId', filter.serviceId);
    if (filter?.from) params.append('from', filter.from);
    if (filter?.to) params.append('to', filter.to);
    return api.get<PageResponse<Appointment>>(`/api/v1/admin/appointments?${params.toString()}`);
  },

  getAppointmentById: (id: string) =>
    api.get<Appointment>(`/api/v1/admin/appointments/${id}`),

  createAppointment: (data: AdminCreateAppointmentRequest) =>
    api.post<Appointment>('/api/v1/admin/appointments', data),

  updateAppointment: (id: string, data: AdminUpdateAppointmentRequest) =>
    api.patch<Appointment>(`/api/v1/admin/appointments/${id}`, data),

  deleteAppointment: (id: string) =>
    api.delete<void>(`/api/v1/admin/appointments/${id}`),

  // Питомцы
  getPets: (
    page = 0,
    size = 20,
    filter?: { speciesId?: string; ownerId?: string; isArchived?: boolean; search?: string }
  ) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (filter?.speciesId) params.append('speciesId', filter.speciesId);
    if (filter?.ownerId) params.append('ownerId', filter.ownerId);
    if (filter?.isArchived !== undefined) params.append('isArchived', filter.isArchived.toString());
    if (filter?.search) params.append('search', filter.search);
    return api.get<PageResponse<Pet>>(`/api/v1/admin/pets?${params.toString()}`);
  },

  getPetById: (id: string) => api.get<Pet>(`/api/v1/admin/pets/${id}`),

  createPet: (data: CreatePetRequest) => api.post<Pet>('/api/v1/admin/pets', data),

  updatePet: (id: string, data: UpdatePetRequest) =>
    api.patch<Pet>(`/api/v1/admin/pets/${id}`, data),

  deletePet: (id: string) => api.delete<void>(`/api/v1/admin/pets/${id}`),

  // Графики врачей
  createWorkSchedule: (data: CreateWorkScheduleRequest) =>
    api.post<WorkSchedule>('/api/v1/admin/work-schedules', data),

  updateWorkSchedule: (id: string, data: UpdateWorkScheduleRequest) =>
    api.patch<WorkSchedule>(`/api/v1/admin/work-schedules/${id}`, data),

  deleteWorkSchedule: (id: string) =>
    api.delete<void>(`/api/v1/admin/work-schedules/${id}`),

  // Исключения расписания
  getScheduleExceptions: (page = 0, size = 20, veterinarianId?: string) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (veterinarianId) params.append('veterinarianId', veterinarianId);
    return api.get<PageResponse<ScheduleException>>(`/api/v1/admin/schedule-exceptions?${params.toString()}`);
  },

  createScheduleException: (data: CreateScheduleExceptionRequest) =>
    api.post<ScheduleException>('/api/v1/admin/schedule-exceptions', data),

  deleteScheduleException: (id: string) =>
    api.delete<void>(`/api/v1/admin/schedule-exceptions/${id}`),

  // Разрешения на виды животных для врачей
  grantVetSpeciesPermission: (veterinarianId: string, speciesId: string) =>
    api.post<VeterinarianSpeciesPermission>(
      `/api/v1/admin/veterinarians/${veterinarianId}/species/${speciesId}`,
      {}
    ),

  revokeVetSpeciesPermission: (veterinarianId: string, speciesId: string) =>
    api.delete<void>(`/api/v1/admin/veterinarians/${veterinarianId}/species/${speciesId}`),

  // Переопределения услуг по видам животных
  createServiceSpecies: (serviceId: string, data: CreateServiceSpeciesRequest) =>
    api.post<ServiceSpecies>(`/api/v1/admin/services/${serviceId}/species`, data),

  updateServiceSpecies: (serviceId: string, speciesId: string, data: Partial<CreateServiceSpeciesRequest>) =>
    api.patch<ServiceSpecies>(`/api/v1/admin/services/${serviceId}/species/${speciesId}`, data),

  deleteServiceSpecies: (serviceId: string, speciesId: string) =>
    api.delete<void>(`/api/v1/admin/services/${serviceId}/species/${speciesId}`),

  // Вакцинации
  getVaccinations: (
    filter?: {
      petId?: string;
      name?: string;
      nextDueFrom?: string;
      nextDueTo?: string;
    },
    page = 0,
    size = 50
  ) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (filter?.petId) params.append('petId', filter.petId);
    if (filter?.name) params.append('name', filter.name);
    if (filter?.nextDueFrom) params.append('nextDueFrom', filter.nextDueFrom);
    if (filter?.nextDueTo) params.append('nextDueTo', filter.nextDueTo);
    return api.get<PageResponse<Vaccination>>(`/api/v1/admin/vaccinations?${params.toString()}`);
  },

  getVaccinationById: (id: string) =>
    api.get<Vaccination>(`/api/v1/admin/vaccinations/${id}`),

  createVaccination: (data: CreateVaccinationRequest) =>
    api.post<Vaccination>('/api/v1/admin/vaccinations', data),

  updateVaccination: (id: string, data: UpdateVaccinationRequest) =>
    api.patch<Vaccination>(`/api/v1/admin/vaccinations/${id}`, data),

  deleteVaccination: (id: string) =>
    api.delete<void>(`/api/v1/admin/vaccinations/${id}`),

  getVeterinarians: () => api.get<Veterinarian[]>('/api/v1/admin/veterinarians'),

  getVeterinarianByUserId: (userId: string) =>
    api.get<Veterinarian>(`/api/v1/admin/veterinarians/by-user/${userId}`),

  createVeterinarian: (data: {
    userId: string;
    specializationId: string;
    bio?: string;
    photoUrl?: string;
    experienceYears: number;
    isActive: boolean;
  }) => api.post<Veterinarian>('/api/v1/admin/veterinarians', data),

  updateVeterinarian: (id: string, data: Partial<Veterinarian>) =>
    api.patch<Veterinarian>(`/api/v1/admin/veterinarians/${id}`, data),

  deleteVeterinarian: (id: string) =>
    api.delete<void>(`/api/v1/admin/veterinarians/${id}`),

  getServices: () => api.get<Service[]>('/api/v1/admin/services'),

  createService: (data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Service>('/api/v1/admin/services', data),

  updateService: (id: string, data: Partial<Service>) =>
    api.patch<Service>(`/api/v1/admin/services/${id}`, data),

  deleteService: (id: string) =>
    api.delete<void>(`/api/v1/admin/services/${id}`),

  createSpecies: (name: string) => api.post<Species>('/api/v1/admin/species', { name }),

  updateSpecies: (id: string, name: string) =>
    api.patch<Species>(`/api/v1/admin/species/${id}`, { name }),

  deleteSpecies: (id: string) =>
    api.delete<void>(`/api/v1/admin/species/${id}`),

  createSpecialization: (data: { name: string; description: string }) =>
    api.post<Specialization>('/api/v1/admin/specializations', data),

  updateSpecialization: (id: string, data: Partial<Specialization>) =>
    api.patch<Specialization>(`/api/v1/admin/specializations/${id}`, data),

  deleteSpecialization: (id: string) =>
    api.delete<void>(`/api/v1/admin/specializations/${id}`),

  // ─── Аналитика и статистика клиники ─────────────────────────
  getStatisticsOverview: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<OverviewStatistics>(`/api/v1/admin/statistics/overview${query}`);
  },

  getStatisticsTimeline: (granularity: StatisticsGranularity = 'DAY', from?: string, to?: string) => {
    const params = new URLSearchParams({ granularity });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return api.get<TimelinePoint[]>(`/api/v1/admin/statistics/timeline?${params.toString()}`);
  },

  getStatisticsVeterinarians: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<VeterinarianStatistics[]>(`/api/v1/admin/statistics/veterinarians${query}`);
  },

  getStatisticsServices: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<ServiceStatistics[]>(`/api/v1/admin/statistics/services${query}`);
  },

  getStatisticsSpecies: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<SpeciesStatistics[]>(`/api/v1/admin/statistics/species${query}`);
  },
};
