import { DayOfWeek, ScheduleExceptionType, AppointmentStatus } from '@/shared/types';
import type { WorkSchedule, ScheduleException } from '@/modules/clinic/types';

export type { WorkSchedule, ScheduleException };

/**
 * Типы для административной панели Chiron.
 */

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
  startTime: string;
  endTime: string;
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
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface UpdateScheduleExceptionRequest {
  type?: ScheduleExceptionType;
  startDate?: string;
  endDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface CreateServiceSpeciesRequest {
  speciesId: string;
  durationMin?: number | null;
  price?: number | null;
}

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
