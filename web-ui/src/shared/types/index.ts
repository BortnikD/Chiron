/**
 * Базовые общесистемные типы и DTO системы Chiron.
 * Автогенерированные типы импортируются из OpenAPI-схемы (schema.d.ts).
 */

import type { components, paths } from '@/shared/api/schema';

export type Schemas = components['schemas'];
export type Paths = paths;

// ─── Enums & Literals ──────────────────────────────────────────────

export type UserRole = NonNullable<Schemas['UserResponse']['role']>; // 'CLIENT' | 'VETERINARIAN' | 'ADMIN'
export type Gender = NonNullable<Schemas['PetResponse']['gender']>; // 'MALE' | 'FEMALE'
export type AppointmentStatus = NonNullable<Schemas['AppointmentResponse']['status']>; // 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type DayOfWeek = NonNullable<Schemas['WorkScheduleResponse']['dayOfWeek']>;
export type ScheduleExceptionType = NonNullable<Schemas['ScheduleExceptionResponse']['type']>;
export type NotificationType = NonNullable<Schemas['NotificationResponse']['type']>;
export type StatisticsGranularity = 'DAY' | 'WEEK' | 'MONTH';

// ─── API Wrapper & Error types ─────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  result: T | null;
  error: ApiError | null;
  timestamp: string;
}

export type ApiError = Schemas['ApiError'];
export type ApiViolation = Schemas['ApiViolation'];

// Алиасы для обратной совместимости
export type ApiErrorResponse = ApiError;
export type FieldViolation = ApiViolation;

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ─── OpenAPI DTOs: Responses ───────────────────────────────────────

export interface AppointmentServiceResponse {
  serviceId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  durationMinSnapshot?: number | null;
  bufferAfterMinSnapshot?: number | null;
  isPlanned: boolean;
  isPerformed?: boolean | null;
  addedBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
}

export type AppointmentResponse = Schemas['AppointmentResponse'] & {
  services?: AppointmentServiceResponse[];
  estimatedTotal?: number;
  actualTotal?: number | null;
  durationMin?: number | null;
  bufferAfterMin?: number | null;
};
export type PetResponse = Schemas['PetResponse'] & {
  /** Алиас для обратной совместимости со свойством archived */
  isArchived?: boolean;
  breed?: string | null;
  chipNumber?: string | null;
  speciesName?: string;
  species?: SpeciesResponse;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  summary?: PetSummaryResponse | null;
};
export type ClientPetResponse = Omit<Schemas['ClientPetResponse'], 'summary'> & {
  /** Алиас для обратной совместимости со свойством archived */
  isArchived?: boolean;
  breed?: string | null;
  chipNumber?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  speciesName?: string;
  species?: SpeciesResponse;
  summary?: PetSummaryResponse | null;
};
export type PetSummaryResponse = Schemas['PetSummaryResponse'];
export type PetNextAppointmentResponse = Schemas['PetNextAppointmentResponse'] & {
  serviceIds?: string[];
};
export type VaccinationResponse = Schemas['VaccinationResponse'] & {
  vaccineName?: string;
  administeredAt?: string;
  validUntil?: string;
  batchNumber?: string | null;
  notes?: string | null;
};
export type VeterinarianResponse = Schemas['VeterinarianResponse'] & {
  /** Алиас для обратной совместимости со свойством active */
  isActive?: boolean;
  specialization?: SpecializationResponse;
  user?: UserResponse;
  specializationIds?: string[];
  speciesIds?: string[];
};
export type ServiceResponse = Schemas['ServiceResponse'] & {
  /** Алиас для обратной совместимости со свойством active */
  isActive?: boolean;
  price?: number;
  durationMin?: number;
};
export type ServiceSpeciesResponse = Schemas['ServiceSpeciesResponse'];
export type SpeciesResponse = Schemas['SpeciesResponse'];
export type SpecializationResponse = Schemas['SpecializationResponse'];
export type UserResponse = Schemas['UserResponse'];
export type NotificationResponse = Schemas['NotificationResponse'];
export type WorkScheduleResponse = Schemas['WorkScheduleResponse'];
export type ScheduleExceptionResponse = Schemas['ScheduleExceptionResponse'];
export type VeterinarianSpeciesPermissionResponse = Schemas['VeterinarianSpeciesPermissionResponse'];
export type AvailableSlotResponse = Schemas['AvailableSlotResponse'];
export type AuthResponse = Schemas['AuthResponse'];
export type PhotoLinks = Schemas['PhotoLinks'];
export type ClientSummaryResponse = Schemas['ClientSummaryResponse'];
export type OverviewStatisticsResponse = Schemas['OverviewStatisticsResponse'];
export type TimelinePointResponse = Schemas['TimelinePointResponse'];
export type VeterinarianStatisticsResponse = Schemas['VeterinarianStatisticsResponse'];
export type ServiceStatisticsResponse = Schemas['ServiceStatisticsResponse'];
export type SpeciesStatisticsResponse = Schemas['SpeciesStatisticsResponse'];

// PageResponses
export type PageResponseVaccinationResponse = Schemas['PageResponseVaccinationResponse'];
export type PageResponsePetResponse = Schemas['PageResponsePetResponse'];
export type PageResponseAppointmentResponse = Schemas['PageResponseAppointmentResponse'];
export type PageResponseNotificationResponse = Schemas['PageResponseNotificationResponse'];
export type PageResponseUserResponse = Schemas['PageResponseUserResponse'];
export type PageResponseScheduleExceptionResponse = Schemas['PageResponseScheduleExceptionResponse'];

// ─── OpenAPI DTOs: Requests ────────────────────────────────────────

export type CreateVaccinationRequest = Schemas['CreateVaccinationRequest'];
export type UpdateVaccinationRequest = Partial<Schemas['UpdateVaccinationRequest']>;
export type CreateAppointmentRequest = Schemas['CreateAppointmentRequest'] & {
  serviceIds?: string[];
};
export type UpdateAppointmentRequest = Partial<Schemas['UpdateAppointmentRequest']> & {
  serviceIds?: string[];
  performedServiceIds?: string[];
  endAt?: string;
};
export type ClientCreateAppointmentRequest = Schemas['ClientCreateAppointmentRequest'] & {
  serviceIds?: string[];
};
export type CancelAppointmentRequest = Schemas['CancelAppointmentRequest'];
export type VeterinarianCreateFollowUpRequest = Schemas['VeterinarianCreateFollowUpRequest'] & {
  serviceIds?: string[];
};
export type VeterinarianUpdateAppointmentRequest = Partial<Schemas['VeterinarianUpdateAppointmentRequest']> & {
  serviceIds?: string[];
  performedServiceIds?: string[];
  endAt?: string;
};
export type VeterinarianUpdateProfileRequest = Partial<Schemas['VeterinarianUpdateProfileRequest']>;
export type CreatePetRequest = Schemas['CreatePetRequest'];
export type ClientCreatePetRequest = Schemas['ClientCreatePetRequest'];
export type UpdatePetRequest = Partial<Schemas['UpdatePetRequest']> & {
  isArchived?: boolean;
};
export type CreateUserRequest = Schemas['CreateUserRequest'];
export type UpdateUserRequest = Partial<Schemas['UpdateUserRequest']>;
export type CreateVeterinarianRequest = Schemas['CreateVeterinarianRequest'] & {
  specializationIds?: string[];
};
export type UpdateVeterinarianRequest = Partial<Schemas['UpdateVeterinarianRequest']> & {
  isActive?: boolean;
  specializationIds?: string[];
};
export type CreateWorkScheduleRequest = Schemas['CreateWorkScheduleRequest'];
export type UpdateWorkScheduleRequest = Partial<Schemas['UpdateWorkScheduleRequest']>;
export type CreateScheduleExceptionRequest = Schemas['CreateScheduleExceptionRequest'];
export type UpdateScheduleExceptionRequest = Partial<Schemas['UpdateScheduleExceptionRequest']>;
export type CreateServiceRequest = Schemas['CreateServiceRequest'];
export type UpdateServiceRequest = Partial<Schemas['UpdateServiceRequest']> & {
  isActive?: boolean;
};
export type CreateServiceSpeciesRequest = Schemas['CreateServiceSpeciesRequest'];
export type UpdateServiceSpeciesRequest = Partial<Schemas['UpdateServiceSpeciesRequest']>;
export type CreateSpeciesRequest = Schemas['CreateSpeciesRequest'];
export type UpdateSpeciesRequest = Partial<Schemas['UpdateSpeciesRequest']>;
export type CreateSpecializationRequest = Schemas['CreateSpecializationRequest'];
export type UpdateSpecializationRequest = Partial<Schemas['UpdateSpecializationRequest']>;
export type LoginRequest = Schemas['LoginRequest'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type ChangePasswordRequest = Schemas['ChangePasswordRequest'];

// ─── Доменные сущности (алиасы для совместимости UI) ───────────────

export type User = UserResponse;
export type AppNotification = NotificationResponse;

export interface AuthResult {
  accessToken: string;
  user: UserResponse;
}

export type BasePet = PetResponse;
export type BaseAppointment = AppointmentResponse;
export type BaseVeterinarian = VeterinarianResponse;
export type BaseVaccination = VaccinationResponse;

export type Pet = ClientPetResponse;
export type Appointment = AppointmentResponse & {
  veterinarianName?: string;
  veterinarian?: VeterinarianResponse;
  petName?: string;
  pet?: PetResponse;
  serviceName?: string;
  service?: ServiceResponse;
  price?: number;
  notes?: string | null;
  cancellationReason?: string | null;
};
export type Vaccination = VaccinationResponse;
export type Veterinarian = VeterinarianResponse;
export type Service = ServiceResponse;
export type Species = SpeciesResponse;
export type Specialization = SpecializationResponse;
export type WorkSchedule = WorkScheduleResponse;
export type ScheduleException = ScheduleExceptionResponse;
export type ServiceSpecies = ServiceSpeciesResponse;
export type VeterinarianSpeciesPermission = VeterinarianSpeciesPermissionResponse;
export type ClientSummary = ClientSummaryResponse;
export type PetSummary = PetSummaryResponse;
export type PetNextAppointmentSummary = PetNextAppointmentResponse;
