import type { Pet } from '@/shared/types';

const PET_CACHE_TTL_MS = 60_000; // 1 минута TTL в оперативной памяти

interface CacheEntry {
  ts: number;
  data: Pet;
}

const petMemoryCache = new Map<string, CacheEntry>();
const inFlightPetPromises = new Map<string, Promise<Pet | null>>();

export const petCache = {
  get(id: string): Pet | null {
    if (!id) return null;
    const entry = petMemoryCache.get(id);
    if (entry && Date.now() - entry.ts < PET_CACHE_TTL_MS) {
      return entry.data;
    }
    return null;
  },

  set(pet: Pet): void {
    if (pet?.id) {
      petMemoryCache.set(pet.id, { ts: Date.now(), data: pet });
    }
  },

  setMany(pets: readonly Pet[] | null | undefined): void {
    if (!Array.isArray(pets) || pets.length === 0) return;
    const now = Date.now();
    for (const p of pets) {
      if (p?.id) {
        petMemoryCache.set(p.id, { ts: now, data: p });
      }
    }
  },

  invalidate(id?: string): void {
    if (id) {
      petMemoryCache.delete(id);
      inFlightPetPromises.delete(id);
    } else {
      petMemoryCache.clear();
      inFlightPetPromises.clear();
    }
  },

  async fetchWithCache(
    id: string,
    fetcher: (id: string) => Promise<Pet | null>
  ): Promise<Pet | null> {
    if (!id) return null;
    const cached = petCache.get(id);
    if (cached) return cached;

    const existingPromise = inFlightPetPromises.get(id);
    if (existingPromise) return existingPromise;

    const promise = fetcher(id)
      .then((pet) => {
        if (pet?.id) {
          petCache.set(pet);
        }
        return pet;
      })
      .catch(() => null)
      .finally(() => {
        inFlightPetPromises.delete(id);
      });

    inFlightPetPromises.set(id, promise);
    return promise;
  },
};
