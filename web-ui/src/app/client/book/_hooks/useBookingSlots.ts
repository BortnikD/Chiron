'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet } from '@/modules/client/types';
import type { Service, Veterinarian, AvailableSlotResponse } from '@/modules/clinic/types';
import { formatApiError, getMoscowDateKey, getMoscowTodayIso, pluralRu } from '@/shared/lib';

export interface GroupedDaySlots {
  dateKey: string;
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
  selectedSlotVetId: string | null;
  onSelectSlotVetId: (vetId: string | null) => void;
}

function groupSlotsByDay(slots: AvailableSlotResponse[], todayStr: string): GroupedDaySlots[] {
  const groups: Record<string, AvailableSlotResponse[]> = {};

  slots.forEach((slot) => {
    const key = getMoscowDateKey(slot.startAt);
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  });

  return Object.entries(groups).map(([dateKey, daySlots]) => {
    const firstSlot = new Date(daySlots[0].startAt);
    const rawDow = firstSlot.toLocaleDateString('ru-RU', {
      weekday: 'short',
      timeZone: 'Europe/Moscow',
    });
    const dow = rawDow.charAt(0).toUpperCase() + rawDow.slice(1);
    const dateLabel = firstSlot
      .toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Europe/Moscow',
      })
      .replace(/\.$/, '');
    const isToday = dateKey === todayStr;
    const slotsCountLabel = `${daySlots.length} ${pluralRu(daySlots.length, 'окно', 'окна', 'окон')}`;

    return {
      dateKey,
      dateLabel,
      dow,
      note: isToday ? `сегодня · ${slotsCountLabel}` : slotsCountLabel,
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

function filterSlotsBySpecialization(
  slots: AvailableSlotResponse[],
  isAnyVet: boolean,
  specializationId: string | undefined,
  vetsMap: Record<string, Veterinarian>
): AvailableSlotResponse[] {
  if (!isAnyVet || !specializationId) return slots;
  const allVets = Object.values(vetsMap);
  if (allVets.length === 0) return slots;
  const hasMatchingVet = allVets.some(
    (v) => v.isActive !== false && v.specializationId === specializationId
  );
  if (!hasMatchingVet) return slots;

  return slots
    .map((slot) => ({
      ...slot,
      veterinarianIds: slot.veterinarianIds.filter((id) => {
        const vet = vetsMap[id];
        return Boolean(
          vet && vet.isActive !== false && vet.specializationId === specializationId
        );
      }),
    }))
    .filter((slot) => slot.veterinarianIds.length > 0);
}

/**
 * Хук поиска и управления свободными окнами для записи на приём.
 */
export function useBookingSlots(
  selectedPet: Pet | null,
  selectedService: Service | null,
  isAnyVet: boolean,
  selectedVet: Veterinarian | null,
  initialSlot?: string | null,
  vetsMap: Record<string, Veterinarian> = {}
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
  const [selectedSlotVetId, setSelectedSlotVetId] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const appliedSlotRef = useRef<string | null>(null);
  const vetsMapRef = useRef(vetsMap);
  vetsMapRef.current = vetsMap;

  const reloadSlots = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  const petId = selectedPet?.id ?? null;
  const isPetArchived = Boolean(selectedPet?.isArchived);
  const speciesId = selectedPet?.speciesId ?? null;
  const serviceId = selectedService?.id ?? null;
  const serviceSpecializationId = selectedService?.specializationId;
  const vetId = isAnyVet ? undefined : selectedVet?.id;

  useEffect(() => {
    if (!petId || !speciesId || !serviceId || isPetArchived) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      setSelectedSlotVetId(null);
      setSlotsError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const toDate = addDaysIso(fromDate, horizonDays - 1);

    setLoadingSlots(true);
    setSlotsError(null);

    clinicApi
      .findAvailableSlots(
        {
          speciesId,
          serviceId,
          veterinarianId: vetId,
          from: fromDate,
          to: toDate,
        },
        { signal: controller.signal }
      )
      .then((slots) => {
        if (cancelled || controller.signal.aborted) return;
        const sortedSlots = (Array.isArray(slots) ? slots : []).sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );
        const safeSlots = filterSlotsBySpecialization(
          sortedSlots,
          isAnyVet,
          serviceSpecializationId,
          vetsMapRef.current
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

        if (autoMatched) {
          setSelectedSlot(autoMatched);
          setSelectedSlotVetId(
            !isAnyVet && selectedVet && autoMatched.veterinarianIds.includes(selectedVet.id)
              ? selectedVet.id
              : autoMatched.veterinarianIds.length === 1
              ? autoMatched.veterinarianIds[0]
              : null
          );
        } else {
          setSelectedSlot((prev) => {
            if (!prev) {
              setSelectedSlotVetId(null);
              return null;
            }
            const kept = safeSlots.find((s) => s.startAt === prev.startAt) ?? null;
            if (!kept) {
              setSelectedSlotVetId(null);
              return null;
            }
            setSelectedSlotVetId((prevVet) => {
              if (!isAnyVet && selectedVet && kept.veterinarianIds.includes(selectedVet.id)) {
                return selectedVet.id;
              }
              if (prevVet && kept.veterinarianIds.includes(prevVet)) return prevVet;
              return kept.veterinarianIds.length === 1 ? kept.veterinarianIds[0] : null;
            });
            return kept;
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setAvailableSlots([]);
        setSelectedSlot(null);
        setSelectedSlotVetId(null);
        setSlotsError(formatApiError(err, 'Не удалось загрузить свободные окна'));
      })
      .finally(() => {
        if (!cancelled && !controller.signal.aborted) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    petId,
    isPetArchived,
    speciesId,
    serviceId,
    serviceSpecializationId,
    vetId,
    isAnyVet,
    selectedVet,
    fromDate,
    horizonDays,
    reloadTick,
    initialSlot,
  ]);

  const onSelectSlot = useCallback(
    (slot: AvailableSlotResponse | null) => {
      setSelectedSlot(slot);
      if (!slot) {
        setSelectedSlotVetId(null);
        return;
      }
      if (!isAnyVet && selectedVet) {
        setSelectedSlotVetId(
          slot.veterinarianIds.includes(selectedVet.id) ? selectedVet.id : null
        );
        return;
      }
      setSelectedSlotVetId(
        slot.veterinarianIds.length === 1 ? slot.veterinarianIds[0] : null
      );
    },
    [isAnyVet, selectedVet]
  );

  const onFromDateChange = useCallback((val: string) => {
    setFromDate(val);
    setSelectedSlot(null);
    setSelectedSlotVetId(null);
  }, []);

  const scopedAvailableSlots = useMemo(
    () =>
      filterSlotsBySpecialization(
        availableSlots,
        isAnyVet,
        serviceSpecializationId,
        vetsMap
      ),
    [availableSlots, isAnyVet, serviceSpecializationId, vetsMap]
  );

  const slotsByDay = useMemo(
    () => groupSlotsByDay(scopedAvailableSlots, todayStr),
    [scopedAvailableSlots, todayStr]
  );

  const durationInfoText = useMemo(() => {
    if (!selectedService) return undefined;
    const dur =
      selectedService.effectiveDurationMin ??
      selectedService.baseDurationMin ??
      selectedService.durationMin ??
      30;
    const buf = selectedService.bufferAfterMin ?? 10;
    return `Шаг 15 мин · окно ${dur + buf} мин (приём ${dur} + буфер ${buf})`;
  }, [selectedService]);

  return {
    todayStr,
    fromDate,
    onFromDateChange,
    horizonDays,
    onHorizonDaysChange: setHorizonDays,
    durationInfoText,
    loadingSlots,
    slotsError,
    reloadSlots,
    availableSlots: scopedAvailableSlots,
    slotsByDay,
    selectedSlot,
    onSelectSlot,
    selectedSlotVetId,
    onSelectSlotVetId: setSelectedSlotVetId,
  };
}
