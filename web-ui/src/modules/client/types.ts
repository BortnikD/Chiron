import {
  Gender,
  AppointmentStatus,
  BasePet,
  BaseAppointment,
  BaseVaccination,
} from '@/shared/types';
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

export interface Pet extends BasePet {
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  speciesName?: string;
  species?: Species;
  summary?: PetSummary | null;
}

export type CreatePetRequest = Pick<BasePet, 'name' | 'speciesId' | 'gender'> &
  Partial<Pick<BasePet, 'birthDate' | 'weightKg' | 'notes' | 'ownerId'>>;

export type UpdatePetRequest = Partial<
  Pick<BasePet, 'name' | 'speciesId' | 'birthDate' | 'weightKg' | 'gender' | 'notes' | 'isArchived'>
>;

export interface Appointment extends BaseAppointment {
  veterinarianName?: string;
  veterinarian?: Veterinarian;
  petName?: string;
  pet?: Pet;
  serviceName?: string;
  service?: Service;
  price?: number;
  notes?: string | null;
  cancellationReason?: string | null;
}

export type BookAppointmentRequest = Pick<
  BaseAppointment,
  'veterinarianId' | 'petId' | 'serviceId' | 'startAt' | 'endAt'
> & {
  clientComment?: string | null;
};

export interface Vaccination extends BaseVaccination {
  vaccineName?: string;
  administeredAt?: string;
  validUntil?: string;
}

export type CreateVaccinationRequest = Pick<
  BaseVaccination,
  'petId' | 'name' | 'administeredOn'
> &
  Partial<
    Pick<BaseVaccination, 'appointmentId' | 'nextDueOn' | 'batchNumber' | 'notes'>
  > & {
    vaccineName?: string;
    administeredAt?: string;
    validUntil?: string;
  };

export type UpdateVaccinationRequest = Partial<
  Pick<BaseVaccination, 'name' | 'administeredOn' | 'nextDueOn'>
>;

export interface ClientSummary {
  activePets: number;
  upcomingAppointments: number;
  completedAppointments: number;
  vaccinationsDue: number;
  vaccinationsOverdue: number;
  unreadNotifications: number;
  nextAppointment?: Appointment | null;
}
