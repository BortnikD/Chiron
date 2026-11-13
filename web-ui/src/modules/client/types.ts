import { Gender, AppointmentStatus } from '@/shared/types';
import { Service, Species, Veterinarian } from '@/modules/clinic/types';

/**
 * Типы сущностей и запросов для личного кабинета клиента.
 */

export interface PetNextAppointmentSummary {
  id: string;
  startAt: string;
  serviceId: string;
}

export interface PetSummary {
  completedVisits: number;
  appointmentsCount: number;
  vaccinationsCount: number;
  nextAppointment?: PetNextAppointmentSummary | null;
  nextVaccinationDueOn?: string | null;
  hasOverdueVaccination: boolean;
}

export interface Pet {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  speciesId: string;
  speciesName?: string;
  species?: Species;
  breed?: string | null;
  chipNumber?: string | null;
  birthDate?: string | null;
  weightKg?: number | null;
  gender: Gender;
  notes?: string | null;
  isArchived: boolean;
  photoUrl?: string | null;
  photoThumbnailUrl?: string | null;
  photoUrlExpiresAt?: string | null;
  summary?: PetSummary | null;
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

export interface ClientSummary {
  activePets: number;
  upcomingAppointments: number;
  completedAppointments: number;
  vaccinationsDue: number;
  vaccinationsOverdue: number;
  unreadNotifications: number;
  nextAppointment?: Appointment | null;
}
