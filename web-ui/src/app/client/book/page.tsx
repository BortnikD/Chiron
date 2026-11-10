'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarPlus, AlertCircle } from 'lucide-react';
import { useBookingWizard } from './_hooks/useBookingWizard';
import { BookingStepper } from './_components/BookingStepper';
import { StepPetSelection } from './_components/StepPetSelection';
import { StepServiceSelection } from './_components/StepServiceSelection';
import { StepDoctorAndSlotSelection } from './_components/StepDoctorAndSlotSelection';
import { StepConfirmation } from './_components/StepConfirmation';
import { BookingSuccessView } from './_components/BookingSuccessView';
import { BookingSummaryIsland } from './_components/BookingSummaryIsland';
import { BookingWizardFooter } from './_components/BookingWizardFooter';

function BookAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
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
  } = useBookingWizard(
    searchParams.get('serviceId'),
    searchParams.get('vetId'),
    searchParams.get('petId'),
    searchParams.get('slot')
  );

  return (
    <div className="content-row">
      <section className="island grow">
        <div className="island-head">
          <span className="island-title">
            <CalendarPlus className="ic" />
            Запись на приём
          </span>
          <BookingStepper currentStep={step} />
        </div>
        <div className="sep" />
        <div className="island-body" style={{ paddingTop: '16px' }}>
          {isSuccess ? (
            <BookingSuccessView
              petName={data.selectedPet?.name}
              serviceName={data.selectedService?.name}
              appointmentId={createdApptId}
              onNewBooking={handleNewBooking}
            />
          ) : (
            <>
              {data.dataError && (
                <div className="alert alert-destructive mb-3" role="alert">
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
                <div className="alert alert-destructive mb-3" role="alert">
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
                />
              )}
              {step === 2 && (
                <StepServiceSelection
                  services={data.services}
                  specializations={data.specializations}
                  selectedService={data.selectedService}
                  onSelectService={handleSelectService}
                  specsMap={data.specsMap}
                  speciesName={data.selectedPet ? data.speciesMap[data.selectedPet.speciesId] : undefined}
                  loading={data.loadingServices}
                />
              )}
              {step === 3 && (
                <StepDoctorAndSlotSelection
                  veterinarians={data.veterinarians}
                  serviceSpecializationId={data.selectedService?.specializationId}
                  petSpeciesId={data.selectedPet?.speciesId}
                  specsMap={data.specsMap}
                  isAnyVet={data.isAnyVet}
                  selectedVet={data.selectedVet}
                  onSelectAnyVet={() => {
                    data.setIsAnyVet(true);
                    data.setSelectedVet(null);
                    slots.onSelectSlot(null);
                  }}
                  onSelectVet={(v) => {
                    data.setIsAnyVet(false);
                    data.setSelectedVet(v);
                    slots.onSelectSlot(null);
                  }}
                  {...slots}
                  onRetrySlots={slots.reloadSlots}
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
        servicePrice={data.selectedService?.effectivePrice ?? data.selectedService?.basePrice}
        doctorDisplay={doctorDisplay}
        selectedSlotStartAt={slots.selectedSlot?.startAt}
      />
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
          Загрузка мастера записи...
        </div>
      }
    >
      <BookAppointmentContent />
    </Suspense>
  );
}
