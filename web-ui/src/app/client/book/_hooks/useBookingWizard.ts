'use client';

import { useState, useMemo, useCallback } from 'react';
import { clientApi } from '@/modules/client/api';
import type { Pet } from '@/modules/client/types';
import type { AvailableSlotResponse, Service } from '@/modules/clinic/types';
import { useToast } from '@/shared/components';
import {
  isSlotConflictError,
  parseBookingError,
  resolveDoctorDisplayName,
} from './bookingErrorHelpers';
import { useBookingData, isVaccinationService } from './useBookingData';
import { useBookingSlots } from './useBookingSlots';

export function useBookingWizard(
  initialServiceId: string | null,
  initialVetId: string | null,
  initialPetId?: string | null,
  initialSlot?: string | null,
  initialIntent?: string | null,
  initialVaccine?: string | null
) {
  const { toast } = useToast();
  const [step, setStepState] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdApptId, setCreatedApptId] = useState<string | null>(null);
  const [bookedVetDisplay, setBookedVetDisplay] = useState<string>('');
  const [comment, setComment] = useState<string>(() =>
    initialVaccine?.trim() ? `Ревакцинация: ${initialVaccine.trim()}`.slice(0, 1000) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotConflictError, setSlotConflictError] = useState<string | null>(null);

  const setStep = useCallback((next: number) => {
    setError(null);
    setStepState(next);
  }, []);

  const data = useBookingData(
    initialServiceId,
    initialVetId,
    setStepState,
    initialPetId,
    initialSlot,
    initialIntent
  );

  const isVaccination = isVaccinationService(data.selectedService);
  const slots = useBookingSlots(
    data.selectedPet,
    data.selectedService,
    data.isAnyVet,
    data.selectedVet,
    initialSlot,
    data.vetsMap
  );

  const {
    selectedPet,
    setSelectedPet,
    setSelectedService,
    selectedVet,
    isAnyVet,
    setSelectedVet,
    setIsAnyVet,
  } = data;
  const { onSelectSlot, onSelectSlotVetId, reloadSlots } = slots;

  const handleSelectPet = useCallback(
    (pet: Pet) => {
      if (pet.isArchived) return;
      if (selectedPet?.id !== pet.id) {
        onSelectSlot(null);
        setSlotConflictError(null);
        if (
          !isAnyVet &&
          selectedVet &&
          Array.isArray(selectedVet.speciesIds) &&
          !selectedVet.speciesIds.includes(pet.speciesId)
        ) {
          setSelectedVet(null);
          setIsAnyVet(true);
        }
      }
      setSelectedPet(pet);
    },
    [
      selectedPet?.id,
      isAnyVet,
      selectedVet,
      setSelectedPet,
      setSelectedVet,
      setIsAnyVet,
      onSelectSlot,
    ]
  );

  const handleSelectService = useCallback(
    (svc: Service) => {
      setSelectedService(svc);
      if (
        !isAnyVet &&
        selectedVet &&
        svc.specializationId &&
        selectedVet.specializationId !== svc.specializationId
      ) {
        setSelectedVet(null);
        setIsAnyVet(true);
      }
      onSelectSlot(null);
      setSlotConflictError(null);
    },
    [setSelectedService, isAnyVet, selectedVet, setSelectedVet, setIsAnyVet, onSelectSlot]
  );

  const handleSelectSlot = useCallback(
    (slot: AvailableSlotResponse | null) => {
      setSlotConflictError(null);
      setError(null);
      onSelectSlot(slot);
    },
    [onSelectSlot]
  );

  const handleSelectSlotVetId = useCallback(
    (vetId: string) => {
      setSlotConflictError(null);
      setError(null);
      onSelectSlotVetId(vetId);
    },
    [onSelectSlotVetId]
  );

  const resolvedVetId = useMemo(() => {
    if (!slots.selectedSlot) return null;
    if (!data.isAnyVet && data.selectedVet) {
      return slots.selectedSlot.veterinarianIds.includes(data.selectedVet.id)
        ? data.selectedVet.id
        : null;
    }
    if (
      slots.selectedSlotVetId &&
      slots.selectedSlot.veterinarianIds.includes(slots.selectedSlotVetId)
    ) {
      return slots.selectedSlotVetId;
    }
    return slots.selectedSlot.veterinarianIds[0] ?? null;
  }, [data.isAnyVet, data.selectedVet, slots.selectedSlot, slots.selectedSlotVetId]);

  const doctorDisplay = useMemo(
    () => resolveDoctorDisplayName(data.isAnyVet, data.selectedVet, data.specsMap),
    [data.isAnyVet, data.selectedVet, data.specsMap]
  );

  const handleConfirmBooking = useCallback(async () => {
    if (!data.selectedPet || !data.selectedService || !slots.selectedSlot) {
      setError('Пожалуйста, выберите питомца, услугу и подходящее окно.');
      return;
    }
    if (data.selectedPet.isArchived) {
      setError('Профиль питомца находится в архиве. Запись невозможна.');
      return;
    }
    if (!resolvedVetId) {
      setSlotConflictError('Выберите врача для выбранного времени.');
      setStepState(4);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSlotConflictError(null);
    try {
      const res = await clientApi.bookAppointment({
        petId: data.selectedPet.id,
        serviceId: data.selectedService.id,
        veterinarianId: resolvedVetId,
        startAt: slots.selectedSlot.startAt,
        endAt: slots.selectedSlot.endAt,
        clientComment: comment.trim() || null,
      });
      const assignedVetId = res?.veterinarianId || resolvedVetId;
      const assignedVet = data.vetsMap[assignedVetId] ?? null;
      setBookedVetDisplay(
        assignedVet
          ? resolveDoctorDisplayName(false, assignedVet, data.specsMap)
          : doctorDisplay
      );
      setIsSuccess(true);
      setCreatedApptId(res?.id || null);
      toast('Запись создана', 'Статус «Ожидает подтверждения» — врач получит уведомление');
    } catch (err: unknown) {
      const parsedMsg = parseBookingError(err);
      if (isSlotConflictError(err)) {
        onSelectSlot(null);
        setSlotConflictError(parsedMsg);
        setStepState(4);
        reloadSlots();
        toast('Слот недоступен', parsedMsg, 'err');
      } else {
        setError(parsedMsg);
        toast('Не удалось создать запись', parsedMsg, 'err');
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    data.selectedPet,
    data.selectedService,
    data.vetsMap,
    data.specsMap,
    slots.selectedSlot,
    resolvedVetId,
    comment,
    doctorDisplay,
    toast,
    onSelectSlot,
    reloadSlots,
  ]);

  const handleNewBooking = useCallback(() => {
    setIsSuccess(false);
    setCreatedApptId(null);
    setBookedVetDisplay('');
    setStepState(1);
    onSelectSlot(null);
    setComment('');
    setError(null);
    setSlotConflictError(null);
  }, [onSelectSlot]);

  const isNextDisabled =
    (step === 1 && (!data.selectedPet || data.selectedPet.isArchived || data.loadingData)) ||
    (step === 2 && (data.loadingServices || !data.selectedService)) ||
    (step === 3 && !data.isAnyVet && !data.selectedVet) ||
    (step === 4 && (!slots.selectedSlot || !resolvedVetId));

  return {
    step,
    setStep,
    isSuccess,
    createdApptId,
    bookedVetDisplay,
    comment,
    setComment,
    submitting,
    error,
    slotConflictError,
    data,
    slots,
    resolvedVetId,
    doctorDisplay,
    isVaccination,
    isVetPreselected: Boolean(
      initialVetId && !data.isAnyVet && data.selectedVet?.id === initialVetId
    ),
    isNextDisabled,
    handleSelectPet,
    handleSelectService,
    handleSelectSlot,
    handleSelectSlotVetId,
    handleConfirmBooking,
    handleNewBooking,
  };
}
