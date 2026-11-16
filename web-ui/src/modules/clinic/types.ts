/**
 * Общеклинические сущности (справочники, услуги, врачи, расписания).
 * Все базовые типы синхронизированы со схемой OpenAPI через @/shared/types.
 */

export type {
  Species,
  Specialization,
  Service,
  ServiceSpecies,
  Veterinarian,
  VeterinarianSpeciesPermission,
  AvailableSlotResponse,
  WorkSchedule,
  ScheduleException,
  SpeciesResponse,
  SpecializationResponse,
  ServiceResponse,
  ServiceSpeciesResponse,
  VeterinarianResponse,
  VeterinarianSpeciesPermissionResponse,
  WorkScheduleResponse,
  ScheduleExceptionResponse,
} from '@/shared/types';
