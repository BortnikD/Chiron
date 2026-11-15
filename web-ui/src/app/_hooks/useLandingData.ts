'use client';

import { useDictionaries } from '@/shared/hooks';

export function useLandingData() {
  const {
    services,
    veterinarians: vets,
    specializations: specs,
    species,
    loading,
    error,
    refreshDictionaries,
  } = useDictionaries();

  return {
    services,
    vets,
    specs,
    species,
    loading,
    error,
    reload: () => {
      void refreshDictionaries();
    },
  };
}
