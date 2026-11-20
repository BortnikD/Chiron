import type { UserRole } from '@/shared/types';
import type { Pet } from '@/modules/client/types';
import type {
  Service,
  Specialization,
  Species,
  ServiceSpecies,
  AvailableSlotResponse,
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
  specializations?: Specialization[];
  loading?: boolean;
  error?: string | null;
  hasFilters?: boolean;
  onReset?: () => void;
  onReload?: () => void;
  isAuthenticated?: boolean;
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
  loadingSlots?: boolean;
  isAuthenticated: boolean;
  role?: UserRole | null;
  clientPets?: Pet[];
  clientSpeciesIds?: Set<string>;
}
