import { Service, Veterinarian, Specialization } from '../../types';

export interface ClinicDirection {
  id: string;
  name: string;
  who: string;
}

export interface PopularOffer {
  spec: string;
  specName: string;
  name: string;
  desc: string;
  dur: number;
  price: string;
  serviceId?: string;
}

export interface AdvantageChip {
  id: string;
  label: string;
  desc: string;
}

export interface LandingHeroSectionProps {
  vetsCount?: number;
  specsCount?: number;
  servicesCount?: number;
}

export interface LandingDoctorsSectionProps {
  vets?: Veterinarian[];
  specializations?: Specialization[];
}

export interface LandingServicesSectionProps {
  services?: Service[];
}

export interface DoctorCardData {
  id: string;
  name: string;
  fullName: string;
  initials: string;
  specName: string;
  experienceYears: number;
  tone: string;
  bio?: string;
}
