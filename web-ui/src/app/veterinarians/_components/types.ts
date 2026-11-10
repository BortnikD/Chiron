import type { UserRole } from '@/shared/types';
import type { Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import type { WorkSchedule, ScheduleException } from '@/modules/admin/types';

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
}

export interface VeterinarianDetailIslandProps {
  vet: Veterinarian;
  specsMap: Record<string, string>;
  speciesMap: Record<string, string>;
  permissions: string[];
  schedules: WorkSchedule[];
  exceptions: ScheduleException[];
  onClose: () => void;
  isAuthenticated: boolean;
  role?: UserRole | null;
}
