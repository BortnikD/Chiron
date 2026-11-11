import { DayOfWeek, ScheduleExceptionType, User } from '@/shared/types';

/**
 * Типы общеклинических сущностей (справочники, услуги, врачи).
 */

export interface Species {
  id: string;
  name: string;
}

export interface Specialization {
  id: string;
  name: string;
  description: string;
}

export interface Service {
  id: string;
  specializationId: string;
  name: string;
  description: string;
  basePrice: number;
  baseDurationMin: number;
  bufferAfterMin: number;
  effectivePrice?: number | null;
  effectiveDurationMin?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Псевдонимы полей для обратной совместимости
  price?: number;
  durationMin?: number;
}

export interface ServiceSpecies {
  serviceId: string;
  speciesId: string;
  durationMin?: number | null;
  price?: number | null;
}

export interface Veterinarian {
  id: string;
  userId: string;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  fullName?: string;
  speciesIds?: string[];
  user?: User;
  specializationId: string;
  specialization?: Specialization;
  bio?: string | null;
  photoUrl?: string | null;
  photoThumbnailUrl?: string | null;
  photoUrlExpiresAt?: string | null;
  experienceYears: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VeterinarianSpeciesPermission {
  veterinarianId: string;
  speciesId: string;
}

export interface AvailableSlotResponse {
  startAt: string;
  endAt: string;
  veterinarianIds: string[];
}

export interface WorkSchedule {
  id: string;
  veterinarianId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

export interface ScheduleException {
  id: string;
  veterinarianId: string;
  type: ScheduleExceptionType;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}
