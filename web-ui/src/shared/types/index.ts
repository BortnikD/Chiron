/**
 * Базовые общесистемные типы и DTO системы Chiron.
 */

export type UserRole = 'CLIENT' | 'VETERINARIAN' | 'ADMIN';

export type Gender = 'MALE' | 'FEMALE';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
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
  exception: string;
  message: string;
  status: number;
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
