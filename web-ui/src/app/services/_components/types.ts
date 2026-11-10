import type { UserRole } from '@/shared/types';
import type {
  Service,
  Specialization,
  Species,
  ServiceSpecies,
  AvailableSlotResponse,
  Veterinarian,
} from '@/modules/clinic/types';

export type ServiceSortOption = 'default' | 'price-asc' | 'price-desc' | 'duration-asc' | 'duration-desc';

export interface ServicesFiltersProps {
  specializations: Specialization[];
  speciesList: Species[];
  selectedSpec: string;
  onSelectSpec: (specId: string) => void;
  selectedSpecies: string;
  onSelectSpecies: (speciesId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: ServiceSortOption;
  onSortChange: (sort: ServiceSortOption) => void;
  hasFilters: boolean;
  onReset: () => void;
}

export interface ServicesGridProps {
  services: Service[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
  specsMap: Record<string, string>;
  loading?: boolean;
}

export interface ServiceDetailIslandProps {
  service: Service;
  onClose: () => void;
  specsMap: Record<string, string>;
  speciesMap: Record<string, string>;
  speciesList: Species[];
  serviceSpeciesList: ServiceSpecies[];
  activeSpeciesTab: string;
  onSpeciesTabChange: (speciesId: string) => void;
  nearestSlots: AvailableSlotResponse[];
  veterinarians?: Veterinarian[];
  isAuthenticated: boolean;
  role?: UserRole | null;
}
