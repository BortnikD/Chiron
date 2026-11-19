'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet } from '@/modules/client/types';
import type { Service, Veterinarian, AvailableSlotResponse } from '@/modules/clinic/types';
import {
  formatApiError,
  formatMoscowMonthDay,
  formatWeekdayShortRu,
  getMoscowDateKey,
  getMoscowTodayIso,
  pluralRu,
} from '@/shared/lib';

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
    const firstSlot = daySlots[0].startAt;
    const dow = formatWeekdayShortRu(firstSlot);
    const dateLabel = formatMoscowMonthDay(firstSlot);
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

  const vetHasSpec = (v?: Veterinarian | null, specId?: string) => {
    if (!v || v.isActive === false || !specId) return false;
    if (v.specializationIds && v.specializationIds.length > 0) {
      return v.specializationIds.includes(specId);
    }
    return v.specializationId === specId;
  };

  const hasMatchingVet = allVets.some((v) => vetHasSpec(v, specializationId));
  if (!hasMatchingVet) return slots;

  return slots
    .map((slot) => ({
      ...slot,
      veterinarianIds: slot.veterinarianIds.filter((id) => {
        const vet = vetsMap[id];
        return Boolean(vet && vetHasSpec(vet, specializationId));
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
  vetsMap: Record<string, Veterinarian> = {},
  selectedServices: Service[] = []
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
  const serviceIds = useMemo(() => {
    if (selectedServices.length > 0) return selectedServices.map((s) => s.id);
    return selectedService ? [selectedService.id] : [];
  }, [selectedServices, selectedService]);
  const serviceIdsKey = serviceIds.join(',');

  const serviceId = serviceIds[0] ?? null;
  const serviceSpecializationId = selectedService?.specializationId;
  const vetId = isAnyVet ? undefined : selectedVet?.id;

  useEffect(() => {
    if (!petId || !speciesId || serviceIds.length === 0 || isPetArchived) {
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
          serviceId: serviceIds[0],
          serviceIds,
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

        const targetMs = initialSlot ? new Date(initialSlot).getTime() : NaN;
        const initialMatched = initialSlot
          ? safeSlots.find(
              (s) =>
                s.startAt === initialSlot ||
                (!Number.isNaN(targetMs) && new Date(s.startAt).getTime() === targetMs)
            ) ?? null
          : null;

        setSelectedSlot((prev) => {
          // 1. Попробуем сохранить текущий выбранный слот (если он доступен в safeSlots)
          if (prev) {
            const kept = safeSlots.find((s) => s.startAt === prev.startAt) ?? null;
            if (kept) {
              setSelectedSlotVetId((prevVet) => {
                if (!isAnyVet && selectedVet && kept.veterinarianIds.includes(selectedVet.id)) {
                  return selectedVet.id;
                }
                if (prevVet && kept.veterinarianIds.includes(prevVet)) return prevVet;
                return kept.veterinarianIds.length === 1 ? kept.veterinarianIds[0] : null;
              });
              return kept;
            }
          }

          // 2. Если текущий слот недоступен для нового врача, но initialSlot доступен
          // (например, при переключении на «Любой врач» или врача, который свободен в initialSlot)
          if (initialMatched) {
            setSelectedSlotVetId(
              !isAnyVet && selectedVet && initialMatched.veterinarianIds.includes(selectedVet.id)
                ? selectedVet.id
                : initialMatched.veterinarianIds.length === 1
                ? initialMatched.veterinarianIds[0]
                : null
            );
            return initialMatched;
          }

          // 3. Иначе слот недоступен
          setSelectedSlotVetId(null);
          return null;
        });
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
    serviceIdsKey,
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
      setSelectedSlotVetId((prev) => {
        if (prev && slot.veterinarianIds.includes(prev)) {
          return prev;
        }
        return slot.veterinarianIds[0] ?? null;
      });
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
    const list = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
    if (list.length === 0) return undefined;
    const dur = list.reduce(
      (sum, s) =>
        sum +
        (s.effectiveDurationMin ??
          s.baseDurationMin ??
          s.durationMin ??
          30),
      0
    );
    const buf = Math.max(...list.map((s) => s.bufferAfterMin ?? 10), 10);
    const complexPrefix = list.length > 1 ? `Комплекс (${list.length} услуг) · ` : '';
    return `${complexPrefix}окно ${dur + buf} мин (процедуры ${dur} мин + буфер ${buf} мин)`;
  }, [selectedServices, selectedService]);

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
