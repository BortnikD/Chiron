/**
 * Модели данных и типы API для системы ветеринарной клиники Chiron.
 * Полностью соответствуют сущностям и DTO Spring Boot бэкенда.
 */

// ─── Роли и перечисления (Enums) ──────────────────────────

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

// ─── Ответы API и ошибки ──────────────────────────────────

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

// ─── Пользователи и Авторизация ───────────────────────────

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

// ─── Питомцы (Pets) ───────────────────────────────────────

export interface Pet {
  id: string;
  name: string;
  ownerId: string;
  speciesId: string;
  speciesName?: string;
  species?: any;
  breed?: string | null;
  birthDate?: string | null;
  weightKg?: number | null;
  gender: Gender;
  notes?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetRequest {
  name: string;
  speciesId: string;
  birthDate?: string | null;
  weightKg?: number | null;
  gender: Gender;
  notes?: string | null;
  ownerId?: string; // Для создания администратором
}

export interface UpdatePetRequest {
  name?: string;
  speciesId?: string;
  birthDate?: string | null;
  weightKg?: number | null;
  gender?: Gender;
  notes?: string | null;
  isArchived?: boolean;
}

// ─── Справочники: Виды и Специализации ────────────────────

export interface Species {
  id: string;
  name: string;
}

export interface Specialization {
  id: string;
  name: string;
  description: string;
}

// ─── Услуги (Services) ────────────────────────────────────

export interface Service {
  id: string;
  specializationId: string;
  name: string;
  description: string;
  basePrice: number;
  baseDurationMin: number;
  bufferAfterMin: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Псевдонимы полей для обратной совместимости
  price?: number;
  durationMin?: number;
  baseDurationMinutes?: number;
}

export interface ServiceSpecies {
  serviceId: string;
  speciesId: string;
  durationMin?: number | null;
  price?: number | null;
}

// ─── Ветеринары (Veterinarians) ───────────────────────────

export interface Veterinarian {
  id: string;
  userId: string;
  user?: User;
  specializationId: string;
  specialization?: Specialization;
  bio?: string | null;
  photoUrl?: string | null;
  experienceYears: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VeterinarianSpeciesPermission {
  veterinarianId: string;
  speciesId: string;
}

// ─── Графики работы и исключения ──────────────────────────

export interface WorkSchedule {
  id: string;
  veterinarianId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00:00"
  endTime: string;   // "18:00:00"
  breakStart?: string | null;
  breakEnd?: string | null;
}

export interface ScheduleException {
  id: string;
  veterinarianId: string;
  type: ScheduleExceptionType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

// ─── Записи на прием (Appointments) ───────────────────────

export interface Appointment {
  id: string;
  veterinarianId: string;
  veterinarianName?: string;
  veterinarian?: Veterinarian;
  petId: string;
  petName?: string;
  pet?: Pet;
  serviceId: string;
  serviceName?: string;
  service?: Service;
  followUpOf?: string | null;
  startAt: string; // ISO-8601 Instant
  endAt: string;   // ISO-8601 Instant
  status: AppointmentStatus;
  priceSnapshot: number;
  price?: number; // Backwards-compatible alias for priceSnapshot
  clientComment?: string | null;
  vetNotes?: string | null;
  notes?: string | null; // Backwards-compatible alias for vetNotes
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  cancellationReason?: string | null; // Backwards-compatible alias for cancelReason
  createdAt: string;
  updatedAt: string;
}

export interface BookAppointmentRequest {
  veterinarianId: string;
  petId: string;
  serviceId: string;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
  clientComment?: string | null;
}

export interface AdminCreateAppointmentRequest {
  veterinarianId: string;
  petId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  priceSnapshot?: number;
  status?: AppointmentStatus;
  clientComment?: string | null;
  followUpOf?: string | null;
}

export interface AdminUpdateAppointmentRequest {
  veterinarianId?: string;
  startAt?: string;
  endAt?: string;
  status?: AppointmentStatus;
  clientComment?: string | null;
  vetNotes?: string | null;
  cancelReason?: string | null;
}

export interface CreateWorkScheduleRequest {
  veterinarianId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00:00"
  endTime: string;   // "18:00:00"
  breakStart?: string | null;
  breakEnd?: string | null;
}

export interface UpdateWorkScheduleRequest {
  startTime?: string;
  endTime?: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

export interface CreateScheduleExceptionRequest {
  veterinarianId: string;
  type: ScheduleExceptionType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface CreateServiceSpeciesRequest {
  speciesId: string;
  durationMin?: number | null;
  price?: number | null;
}

export interface CreateFollowUpRequest {
  serviceId?: string;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
}

export interface AvailableSlotResponse {
  startAt: string;
  endAt: string;
  veterinarianIds: string[];
}

// Псевдоним для удобства
export type AvailabilitySlot = AvailableSlotResponse;

// ─── Вакцинация (Vaccinations) ────────────────────────────

export interface Vaccination {
  id: string;
  petId: string;
  appointmentId?: string | null;
  name: string;
  administeredOn: string; // YYYY-MM-DD
  nextDueOn?: string | null; // YYYY-MM-DD
  // Псевдонимы для совместимости версий
  vaccineName?: string;
  administeredAt?: string;
  validUntil?: string;
  batchNumber?: string | null;
  notes?: string | null;
}

export interface CreateVaccinationRequest {
  petId: string;
  appointmentId?: string | null;
  name: string;
  administeredOn: string;
  nextDueOn?: string | null;
  // Псевдонимы для полей формы
  vaccineName?: string;
  administeredAt?: string;
  validUntil?: string;
  batchNumber?: string | null;
  notes?: string | null;
}

export interface UpdateVaccinationRequest {
  name?: string;
  administeredOn?: string;
  nextDueOn?: string | null;
}

// ─── Уведомления (Notifications) ──────────────────────────

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

// ─── Статистика клиники (Admin Statistics) ─────────────────

export interface OverviewStatistics {
  totalAppointments: number;
  appointmentsByStatus: Record<AppointmentStatus, number>;
  revenue: number;
  expectedRevenue: number;
  averageCheck: number | null;
  cancellationRate: number | null;
  noShowRate: number | null;
  followUps: number;
  newClients: number;
  newPets: number;
  actualRevenue?: number;
}

export interface TimelinePoint {
  periodStart: string;
  appointments: number;
  completed: number;
  revenue: number;
}

export interface ServiceStatistics {
  serviceId: string;
  name: string;
  specializationName: string;
  appointments: number;
  completed: number;
  revenue: number;
}

export interface SpeciesStatistics {
  speciesId: string;
  name: string;
  activePets: number;
  appointments: number;
  revenue: number;
}

export interface VeterinarianStatistics {
  veterinarianId: string;
  fullName: string;
  appointments: number;
  completed: number;
  cancelled: number;
  noShows: number;
  revenue: number;
}
