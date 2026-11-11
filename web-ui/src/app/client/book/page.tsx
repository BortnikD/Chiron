'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarPlus, AlertCircle } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { useBookingWizard } from './_hooks/useBookingWizard';
import { BookingStepper } from './_components/BookingStepper';
import { StepPetSelection } from './_components/StepPetSelection';
import { StepServiceSelection } from './_components/StepServiceSelection';
import { StepDoctorSelection } from './_components/StepDoctorSelection';
import { StepSlotSelection } from './_components/StepSlotSelection';
import { StepConfirmation } from './_components/StepConfirmation';
import { BookingSuccessView } from './_components/BookingSuccessView';
import { BookingSummaryIsland } from './_components/BookingSummaryIsland';
import { BookingWizardFooter } from './_components/BookingWizardFooter';

function BookAppointmentContent() {
  useShellHeader({ crumbGroup: 'Кабинет', crumb: 'Записи', crumb2: 'Новая запись' });

  const router = useRouter();
  const searchParams = useSearchParams();
  const {
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
    isNextDisabled,
    handleSelectPet,
    handleSelectService,
    handleSelectSlot,
    handleSelectSlotVetId,
    handleConfirmBooking,
    handleNewBooking,
  } = useBookingWizard(
    searchParams.get('serviceId'),
    searchParams.get('vetId'),
    searchParams.get('petId'),
    searchParams.get('slot')
  );

  const selectedService = data.selectedService;
  const serviceDurationMin = selectedService
    ? selectedService.effectiveDurationMin ??
      selectedService.baseDurationMin ??
      selectedService.durationMin ??
      null
    : null;
  const servicePrice = selectedService
    ? selectedService.effectivePrice ?? selectedService.basePrice ?? selectedService.price ?? null
    : null;

  return (
    <div className="content-row">
      <section className="island grow">
        <div className="island-head">
          <span className="island-title">
            <CalendarPlus className="ic" />
            Запись на приём
          </span>
          <BookingStepper currentStep={step} isSuccess={isSuccess} />
        </div>
        <div className="sep" />
        <div className="island-body" style={{ paddingTop: '16px' }}>
          {isSuccess ? (
            <BookingSuccessView
              petName={data.selectedPet?.name}
              serviceName={selectedService?.name}
              doctorDisplay={bookedVetDisplay || doctorDisplay}
              slotStartAt={slots.selectedSlot?.startAt}
              appointmentId={createdApptId}
              onNewBooking={handleNewBooking}
            />
          ) : (
            <div className="col" style={{ gap: '12px' }}>
              {data.dataError && (
                <div className="alert alert-destructive" role="alert">
                  <AlertCircle className="ic" />
                  <div className="row between wrap grow" style={{ gap: '8px', alignItems: 'center' }}>
                    <span>{data.dataError}</span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={data.reloadData}
                    >
                      Повторить
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <div className="alert alert-destructive" role="alert">
                  <AlertCircle className="ic" />
                  <div>
                    <b>Ошибка оформления записи:</b> {error}
                  </div>
                </div>
              )}
              {step === 1 && (
                <StepPetSelection
                  pets={data.pets}
                  selectedPet={data.selectedPet}
                  onSelectPet={handleSelectPet}
                  speciesMap={data.speciesMap}
                  loading={data.loadingData}
                />
              )}
              {step === 2 && (
                <StepServiceSelection
                  services={data.services}
                  specializations={data.specializations}
                  selectedService={selectedService}
                  onSelectService={handleSelectService}
                  specsMap={data.specsMap}
                  speciesName={data.selectedPet ? data.speciesMap[data.selectedPet.speciesId] : undefined}
                  loading={data.loadingServices}
                />
              )}
              {step === 3 && (
                <StepDoctorSelection
                  veterinarians={data.veterinarians}
                  serviceSpecializationId={selectedService?.specializationId}
                  petSpeciesId={data.selectedPet?.speciesId}
                  specsMap={data.specsMap}
                  isAnyVet={data.isAnyVet}
                  selectedVet={data.selectedVet}
                  onSelectAnyVet={() => {
                    data.setIsAnyVet(true);
                    data.setSelectedVet(null);
                    handleSelectSlot(null);
                  }}
                  onSelectVet={(v) => {
                    data.setIsAnyVet(false);
                    data.setSelectedVet(v);
                    handleSelectSlot(null);
                  }}
                />
              )}
              {step === 4 && (
                <StepSlotSelection
                  fromDate={slots.fromDate}
                  todayStr={slots.todayStr}
                  onFromDateChange={slots.onFromDateChange}
                  horizonDays={slots.horizonDays}
                  onHorizonDaysChange={slots.onHorizonDaysChange}
                  durationInfoText={slots.durationInfoText}
                  loadingSlots={slots.loadingSlots}
                  slotsError={slots.slotsError}
                  conflictError={slotConflictError}
                  onRetrySlots={slots.reloadSlots}
                  availableSlots={slots.availableSlots}
                  slotsByDay={slots.slotsByDay}
                  selectedSlot={slots.selectedSlot}
                  onSelectSlot={handleSelectSlot}
                  isAnyVet={data.isAnyVet}
                  selectedSlotVetId={slots.selectedSlotVetId}
                  onSelectSlotVetId={handleSelectSlotVetId}
                  vetsMap={data.vetsMap}
                  specsMap={data.specsMap}
                />
              )}
              {step === 5 && (
                <StepConfirmation
                  pet={data.selectedPet}
                  speciesName={data.selectedPet ? data.speciesMap[data.selectedPet.speciesId] || '' : ''}
                  service={selectedService}
                  doctorDisplay={doctorDisplay}
                  selectedSlot={slots.selectedSlot}
                  comment={comment}
                  onCommentChange={setComment}
                />
              )}
            </div>
          )}
        </div>
        {!isSuccess && (
          <BookingWizardFooter
            step={step}
            isNextDisabled={isNextDisabled}
            submitting={submitting}
            canSubmit={Boolean(slots.selectedSlot && resolvedVetId)}
            onPrev={() => (step > 1 ? setStep(step - 1) : router.push('/client/appointments'))}
            onNext={() => setStep(step + 1)}
            onSubmit={handleConfirmBooking}
          />
        )}
      </section>

      <BookingSummaryIsland
        petName={data.selectedPet?.name}
        speciesName={data.selectedPet ? data.speciesMap[data.selectedPet.speciesId] : undefined}
        serviceName={selectedService?.name}
        doctorDisplay={bookedVetDisplay || doctorDisplay}
        selectedSlotStartAt={slots.selectedSlot?.startAt}
        selectedSlotEndAt={slots.selectedSlot?.endAt}
        serviceDurationMin={serviceDurationMin}
        servicePrice={servicePrice}
      />
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <div className="spinner" />
            <span className="small muted">Загрузка мастера записи...</span>
          </div>
        </div>
      }
    >
      <BookAppointmentContent />
    </Suspense>
  );
}
