'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Repeat,
  Printer,
  AlertCircle,
  UserX,
} from 'lucide-react';
import {
  APPOINTMENT_STATUS_META,
  canTransitionAppointmentStatus,
  formatApiError,
  formatCurrency,
  formatDateShort,
  formatSlotTime,
  getSpeciesTone,
} from '@/shared/lib';
import { ConsultationPrintSheet } from '@/components/print/ConsultationPrintSheet';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { useAuth } from '@/context/AuthContext';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import type { VetActiveAppointmentDrawerProps } from './types';
import { getPetName, getOwnerDisplay } from './utils';
import { VetFollowUpModal } from './VetFollowUpModal';

/**
 * Боковая панель ведения текущего приёма:
 * позволяет врачу заполнять клинический протокол, заметки и назначения,
 * управлять статусом визита, назначать повторный приём и печатать лист консультации.
 */
export const VetActiveAppointmentDrawer: React.FC<VetActiveAppointmentDrawerProps> = ({
  appointment,
  services,
  servicesMap,
  petsMap,
  speciesMap,
  vet,
  specsMap,
  onClose,
  onUpdateStatus,
  onSaveNotes,
  onCreateFollowUp,
}) => {
  const { user } = useAuth();

  const [notesText, setNotesText] = useState<string>(() => appointment?.vetNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  const latestApptRef = useRef(appointment);
  latestApptRef.current = appointment;

  useEffect(() => {
    const current = latestApptRef.current;
    if (current) {
      setNotesText(current.vetNotes || '');
      setNotesError(null);
    }
  }, [appointment?.id]);

  if (!appointment) {
    return null;
  }

  const handleSaveNotesClick = async () => {
    setSavingNotes(true);
    setNotesError(null);
    try {
      await onSaveNotes(appointment.id, notesText);
    } catch (err: unknown) {
      setNotesError(formatApiError(err, 'Не удалось сохранить заметки'));
    } finally {
      setSavingNotes(false);
    }
  };

  const pet = appointment.pet || petsMap?.[appointment.petId] || null;
  const petName = getPetName(appointment, petsMap);
  const ownerName = getOwnerDisplay(appointment, petsMap);
  const serviceName = servicesMap[appointment.serviceId] || 'Приём';
  const speciesTone = getSpeciesTone(
    pet?.species?.name || pet?.speciesName || pet?.speciesId || 'cat',
    speciesMap
  );

  const doctorSource = vet || appointment.veterinarian;
  const resolvedDoctor = doctorSource
    ? { ...doctorSource, user: doctorSource.user ?? user ?? undefined }
    : user
      ? { user }
      : null;
  const vetName = getDoctorDisplay(resolvedDoctor, specsMap).fullName;

  const canConfirm =
    appointment.status !== 'CONFIRMED' &&
    canTransitionAppointmentStatus(appointment.status, 'CONFIRMED');
  const canComplete =
    appointment.status !== 'COMPLETED' &&
    canTransitionAppointmentStatus(appointment.status, 'COMPLETED');
  const canNoShow =
    appointment.status !== 'NO_SHOW' &&
    canTransitionAppointmentStatus(appointment.status, 'NO_SHOW');
  const canFollowUp =
    appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED';

  return (
    <>
      <section className="island detail-island" aria-label="Протокол приёма">
        <div className="island-head">
          <div className="col" style={{ gap: '2px', minWidth: 0 }}>
            <span className="h2" style={{ wordBreak: 'break-word' }}>
              {serviceName}
            </span>
            <span className="cell-sub tnum">
              {formatDateShort(appointment.startAt)} в {formatSlotTime(appointment.startAt)}–
              {formatSlotTime(appointment.endAt)}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Закрыть панель приёма"
            title="Закрыть панель приёма"
          >
            <X className="ic" />
          </button>
        </div>

        <div className="island-body">
          <div className="col" style={{ gap: '14px' }}>
            <div className="row wrap between items-center">
              <span className={`badge st badge-${appointment.status}`}>
                {APPOINTMENT_STATUS_META[appointment.status]?.short || appointment.status}
              </span>
              {appointment.priceSnapshot != null && (
                <span className="cell-main tnum" style={{ fontWeight: 650 }}>
                  {formatCurrency(appointment.priceSnapshot)}
                </span>
              )}
            </div>

            <div
              className="row items-center"
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius)',
                background: 'var(--muted)',
                gap: '10px',
              }}
            >
              <span className={`t-ava sm tone-${speciesTone}`}>
                <SpeciesIcon species={speciesTone} size={16} />
              </span>
              <div className="col" style={{ gap: 0, minWidth: 0 }}>
                <span className="cell-main" style={{ fontWeight: 600 }}>
                  {petName}
                </span>
                <span className="muted small">{ownerName}</span>
              </div>
            </div>

            {appointment.clientComment && (
              <div className="col" style={{ gap: '4px' }}>
                <span className="section-title">Жалобы владельца</span>
                <div className="note">{appointment.clientComment}</div>
              </div>
            )}

            <div className="col" style={{ gap: '6px' }}>
              <span className="section-title">Клинический протокол и назначения</span>
              {notesError && (
                <div className="alert alert-destructive" role="alert">
                  <AlertCircle className="ic" />
                  <div>{notesError}</div>
                </div>
              )}
              <textarea
                className="textarea"
                rows={5}
                maxLength={4000}
                placeholder="Опишите результаты осмотра, диагноз, назначенные препараты и дозировки..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
              />
              <div className="row between items-center">
                <span className="small muted tnum">{notesText.length} / 4000</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={savingNotes}
                  onClick={handleSaveNotesClick}
                >
                  {savingNotes ? 'Сохранение...' : 'Сохранить заметки'}
                </button>
              </div>
            </div>

            <div className="row wrap" style={{ gap: '6px', paddingTop: '8px' }}>
              {canConfirm && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onUpdateStatus(appointment.id, 'CONFIRMED')}
                >
                  <Check className="ic" />
                  <span>Подтвердить</span>
                </button>
              )}

              {canComplete && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onUpdateStatus(appointment.id, 'COMPLETED')}
                >
                  <Check className="ic" />
                  <span>Завершить приём</span>
                </button>
              )}

              {canNoShow && (
                <button
                  type="button"
                  className="btn btn-destructive-outline btn-sm"
                  onClick={() => onUpdateStatus(appointment.id, 'NO_SHOW')}
                >
                  <UserX size={13} className="ic" />
                  <span>Неявка</span>
                </button>
              )}

              {canFollowUp && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsFollowUpOpen(true)}
                >
                  <Repeat className="ic" />
                  <span>Повторный приём</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => window.print()}
                title="Распечатать медицинский протокол приёма"
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
        defaultServiceId={appointment.serviceId}
        services={services}
        onClose={() => setIsFollowUpOpen(false)}
        onSubmit={(payload) => onCreateFollowUp(appointment.id, payload)}
      />

      <ConsultationPrintSheet
        appointment={appointment}
        serviceName={serviceName}
        pet={pet}
        vetName={vetName}
        notes={notesText}
      />
    </>
  );
};
