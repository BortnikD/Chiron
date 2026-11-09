import { useState, useEffect, useMemo } from 'react';
import { clientApi, clinicApi } from '../../../../api';
import { Pet, Service, Veterinarian, Specialization, Species } from '../../../../types';

/**
 * Хук загрузки справочников и инициализации выбранных сущностей записи.
 */
export function useBookingData(initialServiceId: string | null, initialVetId: string | null, onSetStep: (step: number) => void) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAnyVet, setIsAnyVet] = useState<boolean>(true);
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);

  useEffect(() => {
    Promise.all([
      clientApi.getPets(),
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
    ])
      .then(([petsData, svcData, vetsData, specData, spData]) => {
        const safePets = Array.isArray(petsData) ? petsData : [];
        const safeSvc = Array.isArray(svcData) ? svcData : [];
        const safeVets = Array.isArray(vetsData) ? vetsData : [];
        setPets(safePets);
        setServices(safeSvc);
        setVeterinarians(safeVets);
        setSpecializations(Array.isArray(specData) ? specData : []);
        setSpeciesList(Array.isArray(spData) ? spData : []);

        const activePets = safePets.filter((p) => !p.isArchived);
        if (activePets.length > 0) setSelectedPet(activePets[0]);

        if (initialServiceId) {
          const match = safeSvc.find((s) => s.id === initialServiceId);
          if (match) {
            setSelectedService(match);
            onSetStep(2);
          }
        }
        if (initialVetId) {
          const match = safeVets.find((v) => v.id === initialVetId);
          if (match) {
            setSelectedVet(match);
            setIsAnyVet(false);
          }
        }
      })
      .catch((err) => console.error('Ошибка загрузки справочников:', err));
  }, [initialServiceId, initialVetId, onSetStep]);

  const specsMap = useMemo(() => Object.fromEntries(specializations.map((s) => [s.id, s.name])), [specializations]);
  const speciesMap = useMemo(() => Object.fromEntries(speciesList.map((sp) => [sp.id, sp.name])), [speciesList]);

  return {
    pets,
    services,
    veterinarians,
    specializations,
    speciesList,
    selectedPet,
    setSelectedPet,
    selectedService,
    setSelectedService,
    isAnyVet,
    setIsAnyVet,
    selectedVet,
    setSelectedVet,
    specsMap,
    speciesMap,
  };
}
