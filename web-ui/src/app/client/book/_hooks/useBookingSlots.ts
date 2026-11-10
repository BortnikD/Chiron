'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet } from '@/modules/client/types';
import type { Service, Veterinarian, AvailableSlotResponse } from '@/modules/clinic/types';
import { formatApiError, formatDateShort, getMoscowDateKey, getMoscowTodayIso } from '@/shared/lib';

export interface GroupedDaySlots {
  dateLabel: string;
  dow: string;
  note: string;
  slots: AvailableSlotResponse[];
}

export interface BookingSlotsState {
  todayStr: string;
  fromDate: string;
  onFromDateChange: (val: string) => void;
  horizonDays: number;
  onHorizonDaysChange: (val: number) => void;
  durationInfoText?: string;
  loadingSlots: boolean;
  slotsError: string | null;
  reloadSlots: () => void;
  availableSlots: AvailableSlotResponse[];
  slotsByDay: GroupedDaySlots[];
  selectedSlot: AvailableSlotResponse | null;
  onSelectSlot: (slot: AvailableSlotResponse | null) => void;
}

function groupSlotsByDay(slots: AvailableSlotResponse[], todayStr: string): GroupedDaySlots[] {
  const groups: Record<string, AvailableSlotResponse[]> = {};

  slots.forEach((slot) => {
    const key = formatDateShort(slot.startAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  });

  return Object.entries(groups).map(([dateLabel, daySlots]) => {
    const firstSlot = new Date(daySlots[0].startAt);
    const moscowDate = getMoscowDateKey(daySlots[0].startAt);
    const rawDow = firstSlot.toLocaleDateString('ru-RU', {
      weekday: 'short',
      timeZone: 'Europe/Moscow',
    });
    const dow = rawDow.charAt(0).toUpperCase() + rawDow.slice(1);
    const isToday = moscowDate === todayStr;

    return {
      dateLabel,
      dow,
      note: isToday ? 'сегодня' : `${daySlots.length} окон`,
      slots: daySlots,
    };
  });
}

function addDaysIso(baseIso: string, offsetDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  if (!y || !m || !d) return getMoscowTodayIso(offsetDays);
  const endDate = new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0));
  return endDate.toISOString().slice(0, 10);
}

/**
 * Хук поиска и управления свободными слотами для записи на приём.
 */
export function useBookingSlots(
  selectedPet: Pet | null,
  selectedService: Service | null,
  isAnyVet: boolean,
  selectedVet: Veterinarian | null,
  initialSlot?: string | null
): BookingSlotsState {
  const todayStr = useMemo(() => getMoscowTodayIso(0), []);
  const [fromDate, setFromDate] = useState<string>(() => {
    const slotDate = initialSlot ? getMoscowDateKey(initialSlot) : '';
    const maxDefault = getMoscowTodayIso(6);
    if (slotDate && slotDate > maxDefault) return slotDate;
    return todayStr;
  });
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotResponse[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const appliedSlotRef = useRef<string | null>(null);

  const reloadSlots = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  const petId = selectedPet?.id ?? null;
  const isPetArchived = Boolean(selectedPet?.isArchived);
  const speciesId = selectedPet?.speciesId ?? null;
  const serviceId = selectedService?.id ?? null;
  const vetId = isAnyVet ? undefined : selectedVet?.id;

  useEffect(() => {
    if (!petId || !speciesId || !serviceId || isPetArchived) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      setSlotsError(null);
      return;
    }

    let cancelled = false;
    const toDate = addDaysIso(fromDate, horizonDays - 1);

    setLoadingSlots(true);
    setSlotsError(null);

    clinicApi
      .findAvailableSlots({
        speciesId,
        serviceId,
        veterinarianId: vetId,
        from: fromDate,
        to: toDate,
      })
      .then((slots) => {
        if (cancelled) return;
        const safeSlots = (Array.isArray(slots) ? slots : []).sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );
        setAvailableSlots(safeSlots);

        let autoMatched: AvailableSlotResponse | null = null;
        if (initialSlot && appliedSlotRef.current !== initialSlot) {
          const targetMs = new Date(initialSlot).getTime();
          autoMatched =
            safeSlots.find(
              (s) =>
                s.startAt === initialSlot ||
                (!Number.isNaN(targetMs) && new Date(s.startAt).getTime() === targetMs)
            ) ?? null;
          if (autoMatched) {
            appliedSlotRef.current = initialSlot;
          }
        }

        setSelectedSlot((prev) => {
          if (autoMatched) return autoMatched;
          return prev && safeSlots.some((s) => s.startAt === prev.startAt) ? prev : null;
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAvailableSlots([]);
        setSelectedSlot(null);
        setSlotsError(formatApiError(err, 'Не удалось загрузить свободные окна'));
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [petId, isPetArchived, speciesId, serviceId, vetId, fromDate, horizonDays, reloadTick, initialSlot]);

  const slotsByDay = useMemo(() => groupSlotsByDay(availableSlots, todayStr), [availableSlots, todayStr]);

  const durationInfoText = useMemo(() => {
    if (!selectedService) return undefined;
    const dur = selectedService.effectiveDurationMin ?? selectedService.baseDurationMin ?? 30;
    const buf = selectedService.bufferAfterMin ?? 10;
    return `Шаг 15 мин · окно ${dur + buf} мин (приём ${dur} мин + буфер ${buf} мин)`;
  }, [selectedService]);

  return {
    todayStr,
    fromDate,
    onFromDateChange: setFromDate,
    horizonDays,
    onHorizonDaysChange: setHorizonDays,
    durationInfoText,
    loadingSlots,
    slotsError,
    reloadSlots,
    availableSlots,
    slotsByDay,
    selectedSlot,
    onSelectSlot: setSelectedSlot,
  };
}
