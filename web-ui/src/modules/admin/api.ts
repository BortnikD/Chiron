import { api } from '@/shared/api/client';
import type { AppointmentStatus, Gender, User, PageResponse, PhotoLinks, StatisticsGranularity } from '@/shared/types';
import type {
  Veterinarian,
  Service,
  Species,
  Specialization,
  ServiceSpecies,
  VeterinarianSpeciesPermission,
} from '@/modules/clinic/types';
import type {
  Appointment,
  Pet,
  CreatePetRequest,
  UpdatePetRequest,
  Vaccination,
  CreateVaccinationRequest,
  UpdateVaccinationRequest,
} from '@/modules/client/types';
import type {
  WorkSchedule,
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
  ScheduleException,
  CreateScheduleExceptionRequest,
  UpdateScheduleExceptionRequest,
  AdminCreateAppointmentRequest,
  AdminUpdateAppointmentRequest,
  CreateServiceSpeciesRequest,
  OverviewStatistics,
  TimelinePoint,
  VeterinarianStatistics,
  ServiceStatistics,
  SpeciesStatistics,
} from './types';

// ─── Административные операции ────────────────────────────

export const adminApi = {
  getUsers: (
    page = 0,
    size = 20,
    filterOrRole?:
      | string
      | {
          role?: string;
          search?: string;
          createdFrom?: string;
          createdTo?: string;
        },
    options?: { signal?: AbortSignal }
  ) => {
    const query = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (typeof filterOrRole === 'string') {
      if (filterOrRole && filterOrRole !== 'ALL') query.append('role', filterOrRole);
    } else if (filterOrRole) {
      if (filterOrRole.role && filterOrRole.role !== 'ALL') query.append('role', filterOrRole.role);
      if (filterOrRole.search) query.append('search', filterOrRole.search);
      if (filterOrRole.createdFrom) query.append('createdFrom', filterOrRole.createdFrom);
      if (filterOrRole.createdTo) query.append('createdTo', filterOrRole.createdTo);
    }
    return api.get<PageResponse<User>>(`/api/v1/admin/users?${query.toString()}`, options);
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
      status?: AppointmentStatus | AppointmentStatus[] | string;
      from?: string;
      to?: string;
    },
    options?: { signal?: AbortSignal }
  ) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (filter?.status) {
      if (Array.isArray(filter.status)) {
        filter.status.forEach((s) => {
          if (s) params.append('status', s);
        });
      } else {
        params.append('status', filter.status);
      }
    }
    if (filter?.veterinarianId) params.append('veterinarianId', filter.veterinarianId);
    if (filter?.petId) params.append('petId', filter.petId);
    if (filter?.ownerId) params.append('ownerId', filter.ownerId);
    if (filter?.serviceId) params.append('serviceId', filter.serviceId);
    if (filter?.from) params.append('from', filter.from);
    if (filter?.to) params.append('to', filter.to);
    return api.get<PageResponse<Appointment>>(
      `/api/v1/admin/appointments?${params.toString()}`,
      options
    );
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
    filter?: {
      speciesId?: string;
      ownerId?: string;
      gender?: Gender | string;
      isArchived?: boolean;
      search?: string;
    },
    options?: { signal?: AbortSignal }
  ) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (filter?.speciesId) params.append('speciesId', filter.speciesId);
    if (filter?.ownerId) params.append('ownerId', filter.ownerId);
    if (filter?.gender) params.append('gender', filter.gender);
    if (filter?.isArchived !== undefined) params.append('isArchived', filter.isArchived.toString());
    if (filter?.search) {
      params.append('name', filter.search);
      params.append('search', filter.search);
    }
    return api.get<PageResponse<Pet>>(`/api/v1/admin/pets?${params.toString()}`, options);
  },

  getPetById: (id: string) => api.get<Pet>(`/api/v1/admin/pets/${id}`),

  createPet: (data: CreatePetRequest) => api.post<Pet>('/api/v1/admin/pets', data),

  updatePet: (id: string, data: UpdatePetRequest) =>
    api.patch<Pet>(`/api/v1/admin/pets/${id}`, data),

  uploadPetPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.putForm<PhotoLinks>(`/api/v1/admin/pets/${id}/photo`, formData);
  },

  deletePetPhoto: (id: string) => api.delete<void>(`/api/v1/admin/pets/${id}/photo`),

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

  updateScheduleException: (id: string, data: UpdateScheduleExceptionRequest) =>
    api.patch<ScheduleException>(`/api/v1/admin/schedule-exceptions/${id}`, data),

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
    bio?: string | null;
    experienceYears: number;
    isActive: boolean;
  }) => api.post<Veterinarian>('/api/v1/admin/veterinarians', data),

  updateVeterinarian: (
    id: string,
    data: Partial<Pick<Veterinarian, 'specializationId' | 'bio' | 'experienceYears' | 'isActive'>>
  ) => api.patch<Veterinarian>(`/api/v1/admin/veterinarians/${id}`, data),

  uploadVeterinarianPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.putForm<PhotoLinks>(`/api/v1/admin/veterinarians/${id}/photo`, formData);
  },

  deleteVeterinarianPhoto: (id: string) =>
    api.delete<void>(`/api/v1/admin/veterinarians/${id}/photo`),

  deleteVeterinarian: (id: string) =>
    api.delete<void>(`/api/v1/admin/veterinarians/${id}`),

  getServices: (filter?: { specializationId?: string; speciesId?: string; isActive?: boolean }) => {
    const params = new URLSearchParams();
    if (filter?.specializationId) params.append('specializationId', filter.specializationId);
    if (filter?.speciesId) params.append('speciesId', filter.speciesId);
    if (filter?.isActive !== undefined) params.append('isActive', String(filter.isActive));
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Service[]>(`/api/v1/admin/services${query}`);
  },

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
