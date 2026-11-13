import type { UserRole } from '@/shared/types';
import type { Service, Specialization, Veterinarian } from '@/modules/clinic/types';

export interface PopularOffer {
  spec: string;
  specName: string;
  name: string;
  desc: string;
  dur: number;
  price: string;
  serviceId?: string;
}

export interface LandingHeroSectionProps {
  vetsCount: number;
  specsCount: number;
  servicesCount: number;
  speciesCount: number;
  loading?: boolean;
  isAuthenticated?: boolean;
  role?: UserRole | null;
}

export interface LandingServicesSectionProps {
  services?: Service[];
  vets?: Veterinarian[];
  specializations?: Specialization[];
  isAuthenticated?: boolean;
}
