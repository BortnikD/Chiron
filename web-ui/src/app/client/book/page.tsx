'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientApi } from '../../../api';
import { AppShell } from '../../../components/layout/AppShell';
import { CalendarPlus, AlertCircle } from 'lucide-react';
import {
  BookingStepper,
  StepPetSelection,
  StepServiceSelection,
  StepDoctorAndSlotSelection,
  StepConfirmation,
  BookingSuccessView,
  BookingSummaryIsland,
  BookingWizardFooter,
  useBookingData,
  useBookingSlots,
  resolveDoctorDisplayName,
  parseBookingError,
} from './_components';

function BookAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdApptId, setCreatedApptId] = useState<string | null>(null);

  // Справочники и выбранные сущности
  const data = useBookingData(searchParams.get('serviceId'), searchParams.get('vetId'), setStep);

  // Свободные окна для записи
  const slots = useBookingSlots(data.selectedPet, data.selectedService, data.isAnyVet, data.selectedVet);

  // Комментарий и отправка
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctorDisplay = useMemo(
    () => resolveDoctorDisplayName(data.isAnyVet, data.selectedVet, slots.selectedSlot, data.veterinarians, data.specsMap),
    [data.isAnyVet, data.selectedVet, slots.selectedSlot, data.veterinarians, data.specsMap]
  );

  // Оформление записи на приём
  const handleConfirmBooking = async () => {
    if (!data.selectedPet || !data.selectedService || !slots.selectedSlot) {
      setError('Пожалуйста, выберите питомца, услугу и подходящее окно.');
      return;
    }
    const targetVetId = !data.isAnyVet && data.selectedVet
      ? slots.selectedSlot.veterinarianIds.includes(data.selectedVet.id) ? data.selectedVet.id : undefined
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
    } catch (err: any) {
      setError(parseBookingError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isNextDisabled =
    (step === 1 && !data.selectedPet) ||
    (step === 2 && !data.selectedService) ||
    (step === 3 && (!slots.selectedSlot || (!data.isAnyVet && !data.selectedVet)));

  return (
    <AppShell title="Запись на приём" currentSection="Запись">
      <div className="content-row">
        <section className="island grow">
          <div className="island-head">
            <span className="island-title"><CalendarPlus className="ic" />Запись на приём</span>
            <BookingStepper currentStep={step} />
          </div>
          <div className="sep" />
          <div className="island-body" style={{ paddingTop: '16px' }}>
            {isSuccess ? (
              <BookingSuccessView
                petName={data.selectedPet?.name}
                serviceName={data.selectedService?.name}
                appointmentId={createdApptId}
                onNewBooking={() => { setIsSuccess(false); setStep(1); slots.onSelectSlot(null); setComment(''); }}
              />
            ) : (
              <>
                {error && (
                  <div className="alert alert-destructive mb-3" role="alert">
                    <AlertCircle className="ic" />
                    <div><b>Ошибка оформления записи:</b> {error}</div>
                  </div>
                )}
                {step === 1 && (
                  <StepPetSelection
                    pets={data.pets}
                    selectedPet={data.selectedPet}
                    onSelectPet={data.setSelectedPet}
                    speciesMap={data.speciesMap}
                  />
                )}
                {step === 2 && (
                  <StepServiceSelection
                    services={data.services}
                    specializations={data.specializations}
                    selectedService={data.selectedService}
                    onSelectService={data.setSelectedService}
                    specsMap={data.specsMap}
                    speciesName={data.selectedPet ? data.speciesMap[data.selectedPet.speciesId] : undefined}
                  />
                )}
                {step === 3 && (
                  <StepDoctorAndSlotSelection
                    veterinarians={data.veterinarians}
                    specsMap={data.specsMap}
                    isAnyVet={data.isAnyVet}
                    selectedVet={data.selectedVet}
                    onSelectAnyVet={() => { data.setIsAnyVet(true); data.setSelectedVet(null); slots.onSelectSlot(null); }}
                    onSelectVet={(v) => { data.setIsAnyVet(false); data.setSelectedVet(v); slots.onSelectSlot(null); }}
                    {...slots}
                  />
                )}
                {step === 4 && (
                  <StepConfirmation
                    pet={data.selectedPet}
                    speciesName={data.selectedPet ? data.speciesMap[data.selectedPet.speciesId] || '' : ''}
                    service={data.selectedService}
                    doctorDisplay={doctorDisplay}
                    selectedSlot={slots.selectedSlot}
                    comment={comment}
                    onCommentChange={setComment}
                  />
                )}
              </>
            )}
          </div>
          {!isSuccess && (
            <BookingWizardFooter
              step={step}
              isNextDisabled={isNextDisabled}
              submitting={submitting}
              canSubmit={!!slots.selectedSlot}
              onPrev={() => (step > 1 ? setStep(step - 1) : router.push('/client/dashboard'))}
              onNext={() => setStep(step + 1)}
              onSubmit={handleConfirmBooking}
            />
          )}
        </section>

        <BookingSummaryIsland
          petName={data.selectedPet?.name}
          speciesName={data.selectedPet ? data.speciesMap[data.selectedPet.speciesId] : undefined}
          serviceName={data.selectedService?.name}
          servicePrice={data.selectedService?.basePrice}
          doctorDisplay={doctorDisplay}
          selectedSlotStartAt={slots.selectedSlot?.startAt}
        />
      </div>
    </AppShell>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка мастера записи...</div>}>
      <BookAppointmentContent />
    </Suspense>
  );
}
