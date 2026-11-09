import { Gender, AppointmentStatus } from '../../shared/types';
import { Service, Veterinarian } from '../clinic/types';

/**
 * Типы сущностей и запросов для личного кабинета клиента.
 */

export interface Pet {
  id: string;
  name: string;
  ownerId: string;
  speciesId: string;
  speciesName?: string;
  species?: any;
  breed?: string | null;
  chipNumber?: string | null;
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
  ownerId?: string;
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
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  priceSnapshot: number;
  price?: number;
  clientComment?: string | null;
  vetNotes?: string | null;
  notes?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookAppointmentRequest {
  veterinarianId: string;
  petId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  clientComment?: string | null;
}

export interface Vaccination {
  id: string;
  petId: string;
  appointmentId?: string | null;
  name: string;
  administeredOn: string;
  nextDueOn?: string | null;
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
