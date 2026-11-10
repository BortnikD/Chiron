'use client';

import { useState, useMemo, useCallback } from 'react';
import { clientApi } from '@/modules/client/api';
import type { Pet } from '@/modules/client/types';
import type { AvailableSlotResponse, Service, Veterinarian } from '@/modules/clinic/types';
import { formatApiError } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { useBookingData } from './useBookingData';
import { useBookingSlots } from './useBookingSlots';

function resolveDoctorDisplayName(
  isAnyVet: boolean,
  selectedVet: Veterinarian | null,
  selectedSlot: AvailableSlotResponse | null,
  veterinarians: Veterinarian[],
  specsMap: Record<string, string>
): string {
  if (!isAnyVet && selectedVet) {
    return getDoctorDisplay(selectedVet, specsMap).name;
  }
  if (selectedSlot && selectedSlot.veterinarianIds.length > 0) {
    const match = veterinarians.find((v) => v.id === selectedSlot.veterinarianIds[0]);
    return match?.userId ? getDoctorDisplay(match, specsMap).name : 'Дежурный врач';
  }
  return 'Любой врач';
}

function parseBookingError(err: unknown): string {
  const e = err as {
    message?: string;
    violations?: Array<{ field?: string; message?: string }>;
    rawError?: { message?: string; exception?: string; name?: string } | null;
  } | null;
  const rawName = (e?.rawError?.exception || e?.rawError?.name || '').toLowerCase();
  const violationText = Array.isArray(e?.violations)
    ? e.violations.map((v) => `${v.field ?? ''} ${v.message ?? ''}`).join(' ')
    : '';
  const msg = `${e?.message || ''} ${e?.rawError?.message || ''} ${violationText}`.toLowerCase();

  if (msg.includes('must be in the future') || msg.includes('past')) {
    return 'Нельзя записаться на прошедшее время. Выберите более позднее окно.';
  }
  if (rawName.includes('petarchived') || msg.includes('archived')) {
    return 'Профиль питомца находится в архиве. Запись невозможна.';
  }
  if (
    rawName.includes('veterinariannotpermittedforspecies') ||
    (msg.includes('not permitted') && msg.includes('species'))
  ) {
    return 'Выбранный врач не принимает животных данного вида.';
  }
  if (
    rawName.includes('servicenotavailableforspecies') ||
    msg.includes('not available for species') ||
    (msg.includes('species') && msg.includes('service'))
  ) {
    return 'Выбранная услуга недоступна для вида этого питомца.';
  }
  if (rawName.includes('veterinarianinactive') || rawName.includes('serviceinactive')) {
    return 'Выбранная услуга или врач сейчас недоступны для записи.';
  }
  if (msg.includes('match the service duration') || msg.includes('duration')) {
    return 'Длительность слота изменилась. Обновите список свободных окон и выберите время заново.';
  }
  if (
    msg.includes('does not work') ||
    msg.includes('sunday') ||
    msg.includes('monday') ||
    msg.includes('tuesday') ||
    msg.includes('wednesday') ||
    msg.includes('thursday') ||
    msg.includes('friday') ||
    msg.includes('saturday')
  ) {
    return 'Врач не ведёт приём в этот день недели.';
  }
  if (msg.includes('overlaps the break')) {
    return 'Выбранное время пересекается с перерывом врача.';
  }
  if (msg.includes('overlaps')) {
    return 'Выбранное время уже занято другим клиентом. Выберите другое окно.';
  }
  if (msg.includes('outside custom working hours') || msg.includes('outside working hours')) {
    return 'Выбранное время выходит за рамки рабочего графика врача.';
  }
  if (msg.includes('absent')) {
    return 'Врач отсутствует в этот день (отпуск или больничный).';
  }
  return formatApiError(err, 'Не удалось оформить запись. Попробуйте выбрать другое время.');
}

export function useBookingWizard(
  initialServiceId: string | null,
  initialVetId: string | null,
  initialPetId?: string | null,
  initialSlot?: string | null
) {
  const [step, setStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdApptId, setCreatedApptId] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = useBookingData(initialServiceId, initialVetId, setStep, initialPetId, initialSlot);
  const slots = useBookingSlots(
    data.selectedPet,
    data.selectedService,
    data.isAnyVet,
    data.selectedVet,
    initialSlot
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
  const { onSelectSlot } = slots;

  const handleSelectPet = useCallback(
    (pet: Pet) => {
      if (pet.isArchived) return;
      if (selectedPet?.id !== pet.id) {
        onSelectSlot(null);
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
    [selectedPet?.id, isAnyVet, selectedVet, setSelectedPet, setSelectedVet, setIsAnyVet, onSelectSlot]
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
    },
    [setSelectedService, isAnyVet, selectedVet, setSelectedVet, setIsAnyVet, onSelectSlot]
  );

  const doctorDisplay = useMemo(
    () =>
      resolveDoctorDisplayName(
        data.isAnyVet,
        data.selectedVet,
        slots.selectedSlot,
        data.veterinarians,
        data.specsMap
      ),
    [data.isAnyVet, data.selectedVet, slots.selectedSlot, data.veterinarians, data.specsMap]
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
    const targetVetId =
      !data.isAnyVet && data.selectedVet
        ? slots.selectedSlot.veterinarianIds.includes(data.selectedVet.id)
          ? data.selectedVet.id
          : undefined
        : slots.selectedSlot.veterinarianIds[0];

    if (!targetVetId) {
      setError('Выбранный врач недоступен на это время. Пожалуйста, выберите другое свободное окно.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await clientApi.bookAppointment({
        petId: data.selectedPet.id,
        serviceId: data.selectedService.id,
        veterinarianId: targetVetId,
        startAt: slots.selectedSlot.startAt,
        endAt: slots.selectedSlot.endAt,
        clientComment: comment.trim() || null,
      });
      setIsSuccess(true);
      setCreatedApptId(res?.id || null);
    } catch (err: unknown) {
      setError(parseBookingError(err));
    } finally {
      setSubmitting(false);
    }
  }, [data.selectedPet, data.selectedService, data.isAnyVet, data.selectedVet, slots.selectedSlot, comment]);

  const handleNewBooking = useCallback(() => {
    setIsSuccess(false);
    setStep(1);
    onSelectSlot(null);
    setComment('');
    setError(null);
  }, [onSelectSlot]);

  const isNextDisabled =
    (step === 1 && (!data.selectedPet || data.selectedPet.isArchived || data.loadingData)) ||
    (step === 2 && (data.loadingServices || !data.selectedService)) ||
    (step === 3 && (!slots.selectedSlot || (!data.isAnyVet && !data.selectedVet)));

  return {
    step,
    setStep,
    isSuccess,
    createdApptId,
    comment,
    setComment,
    submitting,
    error,
    data,
    slots,
    doctorDisplay,
    isNextDisabled,
    handleSelectPet,
    handleSelectService,
    handleConfirmBooking,
    handleNewBooking,
  };
}
