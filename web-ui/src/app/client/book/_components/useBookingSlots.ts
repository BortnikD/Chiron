import { useState, useEffect, useMemo } from 'react';
import { clinicApi } from '../../../../api';
import { Pet, Service, Veterinarian, AvailableSlotResponse } from '../../../../types';
import { GroupedDaySlots } from './constants';
import { groupSlotsByDay } from './utils';

export interface BookingSlotsState {
  todayStr: string;
  fromDate: string;
  onFromDateChange: (val: string) => void;
  horizonDays: number;
  onHorizonDaysChange: (val: number) => void;
  durationInfoText?: string;
  loadingSlots: boolean;
  availableSlots: AvailableSlotResponse[];
  slotsByDay: GroupedDaySlots[];
  selectedSlot: AvailableSlotResponse | null;
  onSelectSlot: (slot: AvailableSlotResponse | null) => void;
}

/**
 * Хук поиска и управления свободными слотами для записи на приём.
 */
export function useBookingSlots(
  selectedPet: Pet | null,
  selectedService: Service | null,
  isAnyVet: boolean,
  selectedVet: Veterinarian | null
): BookingSlotsState {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotResponse[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!selectedPet || !selectedService) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }
    const end = new Date(new Date(fromDate).getTime() + (horizonDays - 1) * 86400000);
    setLoadingSlots(true);

    clinicApi
      .findAvailableSlots({
        speciesId: selectedPet.speciesId,
        serviceId: selectedService.id,
        veterinarianId: isAnyVet ? undefined : selectedVet?.id,
        from: fromDate,
        to: end.toISOString().split('T')[0],
      })
      .then((slots) => {
        const safeSlots = (Array.isArray(slots) ? slots : []).sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );
        setAvailableSlots(safeSlots);
        setSelectedSlot((prev) => (prev && safeSlots.some((s) => s.startAt === prev.startAt) ? prev : null));
      })
      .catch(() => {
        setAvailableSlots([]);
        setSelectedSlot(null);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedPet?.id, selectedService?.id, isAnyVet, selectedVet?.id, fromDate, horizonDays]);

  const slotsByDay = useMemo(() => groupSlotsByDay(availableSlots, todayStr), [availableSlots, todayStr]);

  const durationInfoText = useMemo(() => {
    if (!selectedService) return undefined;
    const dur = selectedService.baseDurationMin || 30;
    const buf = selectedService.bufferAfterMin || 10;
    return `Шаг 15 мин · окно ${dur + buf} мин`;
  }, [selectedService]);

  return {
    todayStr,
    fromDate,
    onFromDateChange: setFromDate,
    horizonDays,
    onHorizonDaysChange: setHorizonDays,
    durationInfoText,
    loadingSlots,
    availableSlots,
    slotsByDay,
    selectedSlot,
    onSelectSlot: setSelectedSlot,
  };
}
