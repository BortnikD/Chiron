/**
 * Типы для кабинета ветеринарного врача.
 * Синхронизированы с OpenAPI схемой через @/shared/types.
 */

import type {
  VeterinarianCreateFollowUpRequest,
  VeterinarianUpdateProfileRequest,
  VeterinarianUpdateAppointmentRequest,
} from '@/shared/types';

export type CreateFollowUpRequest = VeterinarianCreateFollowUpRequest;
export type UpdateVetProfileRequest = VeterinarianUpdateProfileRequest;
export type UpdateVetAppointmentRequest = VeterinarianUpdateAppointmentRequest;
