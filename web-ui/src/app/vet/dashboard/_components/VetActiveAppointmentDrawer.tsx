'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Repeat, Syringe, PawPrint, Printer } from 'lucide-react';
import { vetApi } from '@/modules/vet/api';
import type { Appointment } from '@/modules/client/types';
import type { AppointmentStatus } from '@/shared/types';
import {
  APPOINTMENT_STATUS_META,
  canTransitionAppointmentStatus,
  formatApiError,
  formatCurrency,
  formatDateShort,
  formatSlotTime,
} from '@/shared/lib';
import { ConsultationPrintSheet } from '@/components/print/ConsultationPrintSheet';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { PatientQuickViewModal } from '@/components/patients/PatientQuickViewModal';
import { useAuth } from '@/context/AuthContext';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { VetAddVaccinationModal } from '../../patients/_components/VetAddVaccinationModal';
import type { VetActiveAppointmentDrawerProps } from './types';
import { getPetName } from './utils';
import { VetDrawerNotesSection } from './VetDrawerNotesSection';
import { VetFollowUpModal } from './VetFollowUpModal';
import { VetCancelAppointmentModal } from './VetCancelAppointmentModal';

const STATUS_ACTIONS: Array<{ to: AppointmentStatus; label: string; cls: string }> = [
  { to: 'CONFIRMED', label: 'Подтвердить', cls: 'btn-primary' },
  { to: 'COMPLETED', label: 'Завершить', cls: 'btn-primary' },
  { to: 'NO_SHOW', label: 'Неявка', cls: 'btn-outline' },
  { to: 'CANCELLED', label: 'Отменить', cls: 'btn-destructive-outline' },
];

export const VetActiveAppointmentDrawer: React.FC<VetActiveAppointmentDrawerProps> = ({
  appointment,
  appointments = [],
  services,
  servicesMap,
  petsMap,
  speciesMap,
  vet,
  specsMap,
  onClose,
  onSelectAppointment,
  onUpdateStatus,
  onSaveNotes,
  onCreateFollowUp,
  onCreateVaccination,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const [printNotes, setPrintNotes] = useState<string>(() => appointment?.vetNotes || '');
  const [statusBusy, setStatusBusy] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelErr, setCancelErr] = useState<string | null>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isVaccOpen, setIsVaccOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [origAppt, setOrigAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!appointment?.followUpOf) {
      setOrigAppt(null);
      return;
    }
    const found = appointments.find((a) => a.id === appointment.followUpOf);
    if (found) {
      setOrigAppt(found);
      return;
    }
    let cancelled = false;
    vetApi
      .getAppointmentById(appointment.followUpOf)
      .then((res) => {
        if (!cancelled) setOrigAppt(res);
      })
      .catch(() => {
        if (!cancelled) setOrigAppt(null);
      });
    return () => {
      cancelled = true;
    };
  }, [appointment?.followUpOf, appointments]);

  if (!appointment) return null;

  const pet = appointment.pet || petsMap?.[appointment.petId] || null;
  const petName = getPetName(appointment, petsMap);
  const tone = pet ? (pet.species?.name || pet.speciesName || pet.speciesId || 'cat').toLowerCase() : 'cat';
  const speciesName =
    pet?.species?.name ||
    pet?.speciesName ||
    (pet?.speciesId && speciesMap?.[pet.speciesId]) ||
    '—';
  const serviceName =
    appointment.serviceName ||
    appointment.service?.name ||
    servicesMap[appointment.serviceId] ||
    'Приём';

  const doctorSource = vet || appointment.veterinarian;
  const resolvedDoctor = doctorSource
    ? { ...doctorSource, user: doctorSource.user ?? user ?? undefined }
    : user
      ? { user }
      : null;
  const vetName = getDoctorDisplay(resolvedDoctor, specsMap).fullName;

  const allowedActions = STATUS_ACTIONS.filter(
    (act) => appointment.status !== act.to && canTransitionAppointmentStatus(appointment.status, act.to)
  );
  const isFinal = allowedActions.length === 0;
  const canFollowUp = appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED';
  const stMeta = APPOINTMENT_STATUS_META[appointment.status];

  const handleStatusAction = async (to: AppointmentStatus) => {
    if (to === 'CANCELLED') {
      setCancelErr(null);
      setCancelTarget(appointment);
      return;
    }
    setStatusBusy(true);
    try {
      await onUpdateStatus(appointment.id, to);
    } finally {
      setStatusBusy(false);
    }
  };

  const handleConfirmCancel = async (reason: string | null) => {
    if (!cancelTarget) return;
    setStatusBusy(true);
    setCancelErr(null);
    try {
      await onUpdateStatus(cancelTarget.id, 'CANCELLED', reason);
      setCancelTarget(null);
    } catch (err: unknown) {
      setCancelErr(formatApiError(err, 'Не удалось отменить запись'));
    } finally {
      setStatusBusy(false);
    }
  };

  const handleCreateVaccination = async (
    payload: Parameters<NonNullable<VetActiveAppointmentDrawerProps['onCreateVaccination']>>[0]
  ) => {
    if (onCreateVaccination) {
      await onCreateVaccination(payload);
    } else {
      await vetApi.createVaccination(payload);
    }
  };

  const openPatientPage = () => {
    router.push(`/vet/patients?sel=${appointment.petId}`);
  };

  const openOrigAppointment = () => {
    if (!origAppt) return;
    if (onSelectAppointment) {
      onSelectAppointment(origAppt);
    } else {
      router.push(`/vet/appointments?sel=${origAppt.id}`);
    }
  };

  return (
    <>
      <section className="island detail-island xl:w-[460px]" aria-label="Детали приёма">
        <div className="island-head">
          <div className="row" style={{ minWidth: 0, gap: 12, alignItems: 'center' }}>
            <PetAvatar
              pet={pet}
              tone={tone}
              species={tone}
              iconSize={20}
              variant="full"
              className={`t-ava tone-${tone} detail-head-ava`}
            />
            <div className="col" style={{ gap: '2px', minWidth: 0 }}>
              <span className="h2" style={{ wordBreak: 'break-word' }}>
                {petName} — {serviceName}
              </span>
              <span className="cell-sub tnum">
                {formatDateShort(appointment.startAt)}, {formatSlotTime(appointment.startAt)}–
                {formatSlotTime(appointment.endAt)}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X className="ic" />
          </button>
        </div>

        <div className="island-body">
          <div className="col" style={{ gap: '16px' }}>
            <div className="row wrap">
              <span className={`badge st badge-${appointment.status}`}>
                {stMeta?.label || appointment.status}
              </span>
              {appointment.followUpOf && (
                <span className="badge badge-accent">
                  <Repeat style={{ width: '12px', height: '12px' }} />
                  Повторный
                </span>
              )}
              {isFinal && <span className="small muted">Конечный статус — действий нет</span>}
            </div>

            {allowedActions.length > 0 && (
              <div className="row wrap" style={{ gap: '6px' }}>
                {allowedActions.map((act) => (
                  <button
                    key={act.to}
                    type="button"
                    className={`btn ${act.cls}`}
                    disabled={statusBusy}
                    onClick={() => void handleStatusAction(act.to)}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            <dl className="kv" style={{ margin: 0 }}>
              <dt>Пациент</dt>
              <dd>
                <button type="button" className="linkish" onClick={() => setIsQuickViewOpen(true)}>
                  {petName}
                </button>{' '}
                <span className="muted">· {speciesName}</span>
              </dd>
              <dt>Услуга</dt>
              <dd>{serviceName}</dd>
              <dt>Время</dt>
              <dd className="tnum">
                {formatDateShort(appointment.startAt)}, {formatSlotTime(appointment.startAt)}–
                {formatSlotTime(appointment.endAt)}
              </dd>
              <dt>Стоимость</dt>
              <dd className="tnum">
                {formatCurrency(appointment.priceSnapshot ?? appointment.price ?? 0)}
              </dd>
              {appointment.followUpOf && (
                <>
                  <dt>Исходный приём</dt>
                  <dd>
                    {origAppt ? (
                      <button type="button" className="linkish" onClick={openOrigAppointment}>
                        {formatDateShort(origAppt.startAt)},{' '}
                        {servicesMap[origAppt.serviceId] || 'Приём'}
                      </button>
                    ) : (
                      '—'
                    )}
                  </dd>
                </>
              )}
            </dl>

            <VetDrawerNotesSection
              appointment={appointment}
              vet={vet}
              pet={pet}
              currentUserId={user?.id}
              onSaveNotes={onSaveNotes}
              onNotesTextChange={setPrintNotes}
            />

            <div className="sep" />

            <div className="col" style={{ gap: '6px' }}>
              {canFollowUp && (
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  onClick={() => setIsFollowUpOpen(true)}
                >
                  <Repeat className="ic" />
                  <span>Назначить повторный приём</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => setIsVaccOpen(true)}
              >
                <Syringe className="ic" />
                <span>Внести прививку по этому приёму</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => setIsQuickViewOpen(true)}
              >
                <PawPrint className="ic" />
                <span>Карточка пациента</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => window.print()}
              >
                <Printer className="ic" />
                <span>Печать листа</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <VetFollowUpModal
        isOpen={isFollowUpOpen}
        appointment={appointment}
        pet={pet}
        vet={vet}
        services={services}
        onClose={() => setIsFollowUpOpen(false)}
        onSubmit={(payload) => onCreateFollowUp(appointment.id, payload)}
      />

      <VetAddVaccinationModal
        isOpen={isVaccOpen}
        mode="create"
        patient={pet}
        appointment={appointment}
        serviceName={serviceName}
        onClose={() => setIsVaccOpen(false)}
        onSubmit={handleCreateVaccination}
      />

      <VetCancelAppointmentModal
        appointment={cancelTarget}
        petsMap={petsMap}
        servicesMap={servicesMap}
        loading={statusBusy}
        error={cancelErr}
        onConfirm={handleConfirmCancel}
        onClose={() => !statusBusy && setCancelTarget(null)}
      />

      <ConsultationPrintSheet
        appointment={appointment}
        serviceName={serviceName}
        pet={pet}
        vetName={vetName}
        notes={printNotes}
      />

      <PatientQuickViewModal
        isOpen={isQuickViewOpen}
        pet={pet}
        speciesMap={speciesMap}
        servicesMap={servicesMap}
        appointments={appointments}
        onClose={() => setIsQuickViewOpen(false)}
        onOpenAppointment={onSelectAppointment}
      />
    </>
  );
};
