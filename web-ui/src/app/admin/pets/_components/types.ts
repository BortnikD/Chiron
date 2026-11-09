import {
  Pet,
  Species,
  Gender,
  User,
  Vaccination,
  Appointment,
} from '../../../../types';

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
  speciesFilter: string;
  onSpeciesFilterChange: (value: string) => void;
  genderFilter: GenderFilter;
  onGenderFilterChange: (value: GenderFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  speciesList: Species[];
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
  appointments: Appointment[];
  vaccinations: Vaccination[];
  onClose: () => void;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onAddVaccination: () => void;
}

export interface CreatePetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdPet: Pet) => void;
  speciesList: Species[];
  users: User[];
}

export interface EditPetModalProps {
  isOpen: boolean;
  pet: Pet | null;
  speciesList: Species[];
  onClose: () => void;
  onSuccess: () => void;
}

export interface DeletePetModalProps {
  isOpen: boolean;
  pet: Pet | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export interface AddVaccinationModalProps {
  isOpen: boolean;
  pet: Pet | null;
  onClose: () => void;
  onSuccess: () => void;
}
