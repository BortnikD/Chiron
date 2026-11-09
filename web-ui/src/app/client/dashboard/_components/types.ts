import { Pet, Appointment, Vaccination, AppNotification, Service, Veterinarian } from '../../../../types';

export interface NextAppointmentBannerProps {
  nextAppointment?: Appointment | null;
  nextAppt?: Appointment | null;
  pet?: Pet | null;
  service?: Service | null;
  veterinarian?: Veterinarian | null;
  speciesMap?: Record<string, string>;
}

export interface ClientPetsCarouselProps {
  pets: Pet[];
  speciesMap?: Record<string, string>;
  appointments?: Appointment[];
  vaccinations?: Vaccination[];
}

export interface ClientAppointmentsIslandProps {
  appointments: Appointment[];
  pets: Pet[];
  servicesMap?: Record<string, Service>;
  veterinariansMap?: Record<string, Veterinarian>;
  speciesMap?: Record<string, string>;
}

export interface ClientQuickActionsProps {
  upcomingCount: number;
  petsCount: number;
  vacAttnCount: number;
  unreadNotifsCount: number;
}

export interface ClientVaccinationsIslandProps {
  vaccinations: Vaccination[];
  pets: Pet[];
}

export interface ClientNotificationsIslandProps {
  notifications: AppNotification[];
}
