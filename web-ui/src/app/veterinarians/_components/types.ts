import type { UserRole } from '@/shared/types';
import type {
  Veterinarian,
  Specialization,
  Service,
  Species,
  WorkSchedule,
  ScheduleException,
} from '@/modules/clinic/types';

export interface VeterinariansFiltersProps {
  specializations: Specialization[];
  speciesList: Species[];
  selectedSpec: string;
  onSelectSpec: (specId: string) => void;
  selectedSpecies: string;
  onSelectSpecies: (speciesId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetFilters: () => void;
  hasFilters: boolean;
}

export interface VeterinariansGridProps {
  vets: Veterinarian[];
  selectedVet: Veterinarian | null;
  onSelectVet: (vet: Veterinarian) => void;
  specsMap: Record<string, string>;
  speciesMap: Record<string, string>;
  vetPermissions: Record<string, string[]>;
  loading?: boolean;
  hasFilters?: boolean;
  onReset?: () => void;
}

export interface VeterinarianDetailIslandProps {
  vet: Veterinarian;
  specsMap: Record<string, string>;
  speciesMap: Record<string, string>;
  services?: Service[];
  permissions: string[];
  schedules: WorkSchedule[];
  exceptions: ScheduleException[];
  onClose: () => void;
  isAuthenticated: boolean;
  role?: UserRole | null;
}
