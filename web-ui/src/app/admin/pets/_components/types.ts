import type {
  Pet,
  Vaccination,
  Appointment,
  CreatePetRequest,
  UpdatePetRequest,
  CreateVaccinationRequest,
} from '@/modules/client/types';
import type { Service, Species, Veterinarian } from '@/modules/clinic/types';
import type { Gender, User } from '@/shared/types';

export type GenderFilter = 'ALL' | 'MALE' | 'FEMALE';
export type StatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';
export type PetDetailTab = 'overview' | 'appointments' | 'vaccinations';

export interface CreatePetFormData {
  name: string;
  ownerId: string;
  speciesId: string;
  gender: Gender;
  birthDate: string;
  weightKg: string;
  notes: string;
}

export interface EditPetFormData {
  name: string;
  speciesId: string;
  gender: Gender;
  birthDate: string;
  weightKg: string;
  notes: string;
  isArchived: boolean;
}

export interface AddVaccinationFormData {
  name: string;
  administeredOn: string;
  nextDueOn: string;
}

export interface PetsFiltersProps {
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  speciesFilter: string;
  onSpeciesFilterChange: (value: string) => void;
  genderFilter: GenderFilter;
  onGenderFilterChange: (value: GenderFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  speciesList: Species[];
  users: User[];
  onOpenCreate: () => void;
}

export interface PetsTableProps {
  pets: Pet[];
  selectedPet: Pet | null;
  speciesList: Species[];
  users: User[];
  loading: boolean;
  onSelectPet: (pet: Pet) => void;
}

export interface PetDetailIslandProps {
  pet: Pet;
  speciesList: Species[];
  users: User[];
  services: Service[];
  veterinarians: Veterinarian[];
  appointments: Appointment[];
  vaccinations: Vaccination[];
  loadingDetails?: boolean;
  detailsError?: string | null;
  onClose: () => void;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onAddVaccination: () => void;
}

export interface CreatePetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreatePetRequest) => Promise<Pet>;
  speciesList: Species[];
  users: User[];
}

export interface EditPetModalProps {
  isOpen: boolean;
  pet: Pet | null;
  speciesList: Species[];
  onClose: () => void;
  onUpdate: (id: string, payload: UpdatePetRequest) => Promise<Pet>;
}

export interface AddVaccinationModalProps {
  isOpen: boolean;
  pet: Pet | null;
  onClose: () => void;
  onCreate: (payload: CreateVaccinationRequest) => Promise<Vaccination>;
}
