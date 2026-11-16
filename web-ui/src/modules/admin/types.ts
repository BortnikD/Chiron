/**
 * Типы для административной панели Chiron.
 * Синхронизированы с OpenAPI схемой через @/shared/types.
 */

import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  CreateWorkScheduleRequest as SharedCreateWorkScheduleRequest,
  UpdateWorkScheduleRequest as SharedUpdateWorkScheduleRequest,
  CreateScheduleExceptionRequest as SharedCreateScheduleExceptionRequest,
  UpdateScheduleExceptionRequest as SharedUpdateScheduleExceptionRequest,
  CreateServiceSpeciesRequest as SharedCreateServiceSpeciesRequest,
  OverviewStatisticsResponse,
  TimelinePointResponse,
  VeterinarianStatisticsResponse,
  ServiceStatisticsResponse,
  SpeciesStatisticsResponse,
} from '@/shared/types';

export type {
  WorkSchedule,
  ScheduleException,
  WorkScheduleResponse,
  ScheduleExceptionResponse,
} from '@/shared/types';

export type AdminCreateAppointmentRequest = CreateAppointmentRequest;
export type AdminUpdateAppointmentRequest = UpdateAppointmentRequest;

export type CreateWorkScheduleRequest = SharedCreateWorkScheduleRequest;
export type UpdateWorkScheduleRequest = SharedUpdateWorkScheduleRequest;
export type CreateScheduleExceptionRequest = SharedCreateScheduleExceptionRequest;
export type UpdateScheduleExceptionRequest = SharedUpdateScheduleExceptionRequest;
export type CreateServiceSpeciesRequest = SharedCreateServiceSpeciesRequest;

export type OverviewStatistics = OverviewStatisticsResponse;
export type TimelinePoint = TimelinePointResponse;
export type VeterinarianStatistics = VeterinarianStatisticsResponse;
export type ServiceStatistics = ServiceStatisticsResponse;
export type SpeciesStatistics = SpeciesStatisticsResponse;
