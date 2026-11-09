import { User } from '../../shared/types';

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

export interface AvailableSlotResponse {
  startAt: string;
  endAt: string;
  veterinarianIds: string[];
}

export type AvailabilitySlot = AvailableSlotResponse;
