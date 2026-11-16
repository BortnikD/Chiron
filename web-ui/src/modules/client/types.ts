/**
 * Типы сущностей и запросов для личного кабинета клиента.
 * Синхронизированы с OpenAPI схемой через @/shared/types.
 */

import type {
  ClientCreateAppointmentRequest,
  CreatePetRequest as SharedCreatePetRequest,
  ClientCreatePetRequest as SharedClientCreatePetRequest,
  UpdatePetRequest as SharedUpdatePetRequest,
  CreateVaccinationRequest as SharedCreateVaccinationRequest,
  UpdateVaccinationRequest as SharedUpdateVaccinationRequest,
} from '@/shared/types';

export type {
  Pet,
  Appointment,
  Vaccination,
  PetSummary,
  PetNextAppointmentSummary,
  ClientSummary,
  PetResponse,
  ClientPetResponse,
  PetSummaryResponse,
  PetNextAppointmentResponse,
  ClientSummaryResponse,
  AppointmentResponse,
  VaccinationResponse,
} from '@/shared/types';

export type BookAppointmentRequest = ClientCreateAppointmentRequest;

// Разрешаем как полные типы схем, так и гибкие вариации для форм
export type CreatePetRequest = SharedCreatePetRequest | SharedClientCreatePetRequest;
export type UpdatePetRequest = SharedUpdatePetRequest;
export type CreateVaccinationRequest = SharedCreateVaccinationRequest & {
  vaccineName?: string;
  administeredAt?: string;
  validUntil?: string;
};
export type UpdateVaccinationRequest = SharedUpdateVaccinationRequest;
