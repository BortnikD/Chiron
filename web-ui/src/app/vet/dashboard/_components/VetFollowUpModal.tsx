'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Repeat, X } from 'lucide-react';
import { clinicApi } from '@/modules/clinic/api';
import type { Appointment, Pet } from '@/modules/client/types';
import type { AvailableSlotResponse, Service, Veterinarian } from '@/modules/clinic/types';
import type { CreateFollowUpRequest } from '@/modules/vet/types';
import { DatePicker, SearchCombobox } from '@/shared/components';
import {
  formatApiError,
  formatCurrency,
  formatDateShort,
  formatSlotTime,
  getMoscowDateKey,
  getMoscowTodayIso,
  pluralRu,
} from '@/shared/lib';
import {
  getEffectiveServiceDuration,
  getEffectiveServicePrice,
  shiftIsoDate,
} from './vetHelpers';
import { groupFollowUpSlotsByDay } from './vetFollowUpUtils';

export interface VetFollowUpModalProps {
  isOpen: boolean;
  appointment: Appointment;
  pet?: Pet | null;
  vet?: Veterinarian | null;
  services: Service[];
  onClose: () => void;
  onSubmit: (data: CreateFollowUpRequest) => Promise<void>;
}

export const VetFollowUpModal: React.FC<VetFollowUpModalProps> = ({
  isOpen,
  appointment,
  pet,
  vet,
  services,
  onClose,
  onSubmit,
}) => {
  const todayIso = getMoscowTodayIso();
  const origDateIso = getMoscowDateKey(appointment.startAt);
  const minFromDate = origDateIso > todayIso ? origDateIso : todayIso;

  const [speciesServices, setSpeciesServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState(appointment.serviceId);
  const [fromDate, setFromDate] = useState(minFromDate);
  const [slots, setSlots] = useState<AvailableSlotResponse[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedServiceId(appointment.serviceId);
    setFromDate(minFromDate);
    setSelectedSlot(null);
    setSubmitError(null);
    setSlotsError(null);
  }, [isOpen, appointment.id, appointment.serviceId, minFromDate]);

  const speciesId = pet?.speciesId || appointment.pet?.speciesId || '';

  useEffect(() => {
    if (!isOpen || !speciesId) {
      setSpeciesServices([]);
      return;
    }
    let cancelled = false;
    clinicApi
      .getServices(vet?.specializationId, speciesId)
      .then((list) => {
        if (cancelled) return;
        const active = (Array.isArray(list) ? list : []).filter((s) => s.isActive !== false);
        setSpeciesServices(active);
      })
      .catch(() => {
        if (!cancelled) setSpeciesServices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, speciesId, vet?.specializationId]);

  const availableServices = useMemo(() => {
    if (speciesServices.length > 0) return speciesServices;
    return services.filter(
      (s) => s.isActive !== false && (!vet?.specializationId || s.specializationId === vet.specializationId)
    );
  }, [speciesServices, services, vet?.specializationId]);

  useEffect(() => {
    if (!isOpen || availableServices.length === 0) return;
    if (!availableServices.some((s) => s.id === selectedServiceId)) {
      setSelectedServiceId(availableServices[0].id);
    }
  }, [isOpen, availableServices, selectedServiceId]);

  const vetId = vet?.id || appointment.veterinarianId;

  useEffect(() => {
    if (!isOpen || !speciesId || !selectedServiceId || !fromDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    const toDate = shiftIsoDate(fromDate, 6);
    const origEndMs = new Date(appointment.endAt).getTime();

    setLoadingSlots(true);
    setSlotsError(null);
    setSelectedSlot(null);

    clinicApi
      .findAvailableSlots({
        speciesId,
        serviceId: selectedServiceId,
        veterinarianId: vetId,
        from: fromDate,
        to: toDate,
      })
      .then((res) => {
        if (cancelled) return;
        const filtered = (Array.isArray(res) ? res : [])
          .filter((sl) => new Date(sl.startAt).getTime() >= origEndMs)
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        setSlots(filtered);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSlots([]);
        setSlotsError(formatApiError(err, 'Не удалось загрузить свободные окна'));
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, speciesId, selectedServiceId, fromDate, vetId, appointment.endAt]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, submitting, onClose]);

  const serviceOptions = useMemo(
    () =>
      availableServices.map((s) => ({
        value: s.id,
        label: s.name,
        hint: `${getEffectiveServiceDuration(s)} мин · ${formatCurrency(getEffectiveServicePrice(s))}`,
      })),
    [availableServices]
  );

  const selectedService = useMemo(
    () => availableServices.find((s) => s.id === selectedServiceId) || availableServices[0] || null,
    [availableServices, selectedServiceId]
  );

  const groupedDays = useMemo(() => groupFollowUpSlotsByDay(slots), [slots]);

  if (!isOpen) return null;

  const petName = pet?.name || appointment.pet?.name || appointment.petName || 'Пациент';
  const origLabel = `${formatDateShort(appointment.startAt)} ${formatSlotTime(appointment.startAt)}–${formatSlotTime(appointment.endAt)}`;

  const summaryText =
    selectedSlot && selectedService
      ? `${selectedService.name} · ${formatDateShort(selectedSlot.startAt)} ${formatSlotTime(selectedSlot.startAt)} · ${formatCurrency(getEffectiveServicePrice(selectedService))}`
      : 'Выберите окно';

  const handleConfirm = async () => {
    if (!selectedSlot || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        serviceId: selectedServiceId || undefined,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
      });
      onClose();
    } catch (err: unknown) {
      setSubmitError(formatApiError(err, 'Не удалось назначить повторный приём'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Повторный приём"
      onClick={() => !submitting && onClose()}
    >
      <div className="dialog dialog-lg" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start', gap: '12px' }}>
            <div className="col" style={{ gap: '4px' }}>
              <span className="dialog-title">Повторный приём · {petName}</span>
              <span className="dialog-desc">
                После приёма {origLabel}. Запись сразу создаётся подтверждённой, владелец получит уведомление.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={submitting}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="dialog-body">
          {submitError && (
            <div className="alert alert-destructive" role="alert">
              <AlertCircle className="ic" />
              <div>{submitError}</div>
            </div>
          )}

          <div className="field">
            <span className="field-label">Услуга</span>
            <SearchCombobox
              value={selectedServiceId}
              options={serviceOptions}
              onChange={(val) => setSelectedServiceId(val)}
              placeholder="Выберите услугу"
              disabled={submitting}
              ariaLabel="Выберите услугу"
            />
            <span className="field-hint">По умолчанию — услуга исходного приёма</span>
          </div>

          <div className="row wrap" style={{ gap: '12px', alignItems: 'flex-end' }}>
            <div className="field" style={{ width: '180px' }}>
              <label className="field-label" htmlFor="fu-from">
                С даты
              </label>
              <DatePicker
                id="fu-from"
                value={fromDate}
                min={minFromDate}
                onChange={(val) => val && setFromDate(val)}
                clearable={false}
                disabled={submitting}
              />
            </div>
            <span className="small muted" style={{ paddingBottom: '8px' }}>
              Свободные окна в вашем графике на 7 дней
            </span>
          </div>

          {slotsError && (
            <div className="alert alert-destructive" role="alert">
              <AlertCircle className="ic" />
              <div>{slotsError}</div>
            </div>
          )}

          <div className="col" style={{ gap: 0, maxHeight: '300px', overflow: 'auto' }}>
            {loadingSlots ? (
              <div className="col" style={{ gap: '8px', padding: '8px 0' }}>
                <div className="skeleton" style={{ height: '48px' }} />
                <div className="skeleton" style={{ height: '48px' }} />
              </div>
            ) : groupedDays.length === 0 ? (
              <div className="empty" style={{ padding: '20px' }}>
                <span>
                  {!speciesId
                    ? 'Не удалось определить вид пациента для подбора окон'
                    : 'Нет свободных окон, попробуйте другой период'}
                </span>
              </div>
            ) : (
              groupedDays.map((day) => (
                <div
                  key={day.dateIso}
                  className="col"
                  style={{ gap: '6px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <div className="row between">
                    <span className="cell-main">
                      {day.dow}, {day.dateLabel}
                    </span>
                    <span className="cell-sub">
                      {day.slots.length} {pluralRu(day.slots.length, 'окно', 'окна', 'окон')}
                    </span>
                  </div>
                  <div className="chips">
                    {day.slots.map((sl) => (
                      <button
                        key={sl.startAt}
                        type="button"
                        className={`slot ${selectedSlot?.startAt === sl.startAt ? 'on' : ''}`}
                        onClick={() => setSelectedSlot(sl)}
                      >
                        {formatSlotTime(sl.startAt)}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dialog-foot">
          <span className="small muted" style={{ marginRight: 'auto', alignSelf: 'center' }}>
            {summaryText}
          </span>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedSlot || submitting}
            onClick={handleConfirm}
          >
            <Repeat className="ic" />
            <span>{submitting ? 'Назначение…' : 'Назначить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
