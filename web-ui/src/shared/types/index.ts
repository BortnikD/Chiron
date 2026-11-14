/**
 * Базовые общесистемные типы и DTO системы Chiron.
 */

export type UserRole = 'CLIENT' | 'VETERINARIAN' | 'ADMIN';

export type Gender = 'MALE' | 'FEMALE';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type ScheduleExceptionType = 'ABSENCE' | 'CUSTOM_HOURS';

export type StatisticsGranularity = 'DAY' | 'WEEK' | 'MONTH';

export type NotificationType =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_NO_SHOW'
  | 'FOLLOW_UP_SCHEDULED'
  | 'APPOINTMENT_REMINDER'
  | 'VACCINATION_DUE';

export interface ApiResponse<T> {
  success: boolean;
  result: T;
  error: ApiErrorResponse | null;
  timestamp: string;
}

export interface ApiErrorResponse {
  exception?: string;
  name?: string;
  message: string;
  status: number | string;
  path: string;
  violations?: FieldViolation[];
}

export interface FieldViolation {
  field: string;
  message: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  accessToken: string;
  user: User;
}

export interface PhotoLinks {
  photoUrl: string;
  photoThumbnailUrl: string;
  photoUrlExpiresAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actorId?: string | null;
  appointmentId?: string | null;
  petId?: string | null;
  vaccinationId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

/**
 * Базовые сущности доменной модели Chiron.
 * Используются как фундамент для расширенных интерфейсов в modules/*
 * и позволяют типизировать запросы через Pick/Omit без дублирования полей.
 */

export interface BasePet {
  id: string;
  name: string;
  ownerId: string;
  speciesId: string;
  gender: Gender;
  breed?: string | null;
  chipNumber?: string | null;
  birthDate?: string | null;
  weightKg?: number | null;
  notes?: string | null;
  isArchived: boolean;
  photoUrl?: string | null;
  photoThumbnailUrl?: string | null;
  photoUrlExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaseAppointment {
  id: string;
  veterinarianId: string;
  petId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  priceSnapshot: number;
  followUpOf?: string | null;
  clientComment?: string | null;
  vetNotes?: string | null;
  cancelReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaseVeterinarian {
  id: string;
  userId: string;
  specializationId: string;
  experienceYears: number;
  isActive: boolean;
  bio?: string | null;
  photoUrl?: string | null;
  photoThumbnailUrl?: string | null;
  photoUrlExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaseVaccination {
  id: string;
  petId: string;
  appointmentId?: string | null;
  name: string;
  administeredOn: string;
  nextDueOn?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
}

