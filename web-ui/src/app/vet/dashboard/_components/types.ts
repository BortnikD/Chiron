import type { AppointmentStatus } from '@/shared/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import type { Appointment, CreateVaccinationRequest, Pet } from '@/modules/client/types';
import type { CreateFollowUpRequest } from '@/modules/vet/types';

export interface VetActiveAppointmentDrawerProps {
  appointment: Appointment | null;
  appointments?: Appointment[];
  services: Service[];
  servicesMap: Record<string, string>;
  petsMap?: Record<string, Pet>;
  speciesMap?: Record<string, string>;
  vet?: Veterinarian | null;
  specsMap?: Record<string, string>;
  onClose: () => void;
  onSelectAppointment?: (appt: Appointment) => void;
  onUpdateStatus: (
    apptId: string,
    status: AppointmentStatus,
    cancelReason?: string | null
  ) => Promise<void> | void;
  onSaveNotes: (apptId: string, notes: string | null) => Promise<void>;
  onCreateFollowUp: (apptId: string, data: CreateFollowUpRequest) => Promise<void>;
  onCreateVaccination?: (payload: CreateVaccinationRequest) => Promise<void>;
}
