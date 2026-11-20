'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Check, X, Search, AlertCircle, Loader2 } from 'lucide-react';
import type { Appointment, AppointmentServiceResponse } from '@/shared/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { formatCurrency, formatApiError } from '@/shared/lib';

export interface VetAppointmentServicesSectionProps {
  appointment: Appointment;
  services: Service[];
  vet?: Veterinarian | null;
  petSpeciesId?: string;
  onUpdateServices: (targetServiceIds: string[]) => Promise<void>;
  disabled?: boolean;
}

export const VetAppointmentServicesSection: React.FC<VetAppointmentServicesSectionProps> = ({
  appointment,
  services,
  vet,
  petSpeciesId,
  onUpdateServices,
  disabled = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStarted = useMemo(() => {
    return Date.now() >= new Date(appointment.startAt).getTime();
  }, [appointment.startAt]);

  // Список услуг из записи
  const appointmentServices: AppointmentServiceResponse[] = useMemo(() => {
    if (appointment.services && appointment.services.length > 0) {
      return appointment.services;
    }
    if (appointment.serviceId) {
      const catalogSvc = services.find((s) => s.id === appointment.serviceId);
      const price = catalogSvc?.effectivePrice ?? catalogSvc?.basePrice ?? catalogSvc?.price ?? 0;
      return [
        {
          serviceId: appointment.serviceId,
          nameSnapshot: appointment.serviceName || catalogSvc?.name || 'Основная услуга',
          priceSnapshot: appointment.priceSnapshot ?? price,
          durationMinSnapshot: catalogSvc?.durationMin ?? 20,
          bufferAfterMinSnapshot: 10,
          isPlanned: true,
          isPerformed: appointment.status === 'COMPLETED' ? true : null,
          addedBy: null,
          createdAt: appointment.createdAt,
          updatedBy: null,
          updatedAt: appointment.updatedAt,
        },
      ];
    }
    return [];
  }, [appointment, services]);

  // Разрешённые специализации врача
  const vetSpecIds = useMemo(() => {
    if (vet?.specializationIds && vet.specializationIds.length > 0) {
      return vet.specializationIds;
    }
    if (vet?.specializationId) {
      return [vet.specializationId];
    }
    return [];
  }, [vet]);

  // Доступные для добавления услуги клиники
  const availableServicesToAdd = useMemo(() => {
    const existingIds = new Set(appointmentServices.map((s) => s.serviceId));
    return services.filter((s) => {
      if (existingIds.has(s.id)) return false;
      if (s.isActive === false) return false;
      if (vetSpecIds.length > 0 && s.specializationId && !vetSpecIds.includes(s.specializationId)) {
        return false;
      }
      return true;
    });
  }, [services, appointmentServices, vetSpecIds]);

  // Фильтрация по поисковому запросу
  const filteredAvailableServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableServicesToAdd;
    return availableServicesToAdd.filter((s) => s.name.toLowerCase().includes(q));
  }, [availableServicesToAdd, searchQuery]);

  const canEditServices =
    !disabled &&
    (appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED' || appointment.status === 'PENDING');

  // Переключение статуса выполнения (для начавшихся или завершённых приёмов)
  const handleTogglePerformed = async (serviceId: string, currentPerformed: boolean | null | undefined) => {
    if (!canEditServices || submitting) return;

    const currentPerformedIds = new Set(
      appointmentServices
        .filter((s) => s.isPerformed === true || (s.isPerformed == null && s.isPlanned))
        .map((s) => s.serviceId)
    );

    if (currentPerformed === true || (currentPerformed == null && currentPerformedIds.has(serviceId))) {
      currentPerformedIds.delete(serviceId);
    } else {
      currentPerformedIds.add(serviceId);
    }

    setSubmitting(true);
    setError(null);
    try {
      await onUpdateServices(Array.from(currentPerformedIds));
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось обновить статус услуги'));
    } finally {
      setSubmitting(false);
    }
  };

  // Добавление услуги в один клик
  const handleAddService = async (serviceId: string) => {
    if (!serviceId || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      if (isStarted || appointment.status === 'COMPLETED') {
        const currentPerformedIds = new Set(
          appointmentServices
            .filter((s) => s.isPerformed === true || (s.isPerformed == null && s.isPlanned))
            .map((s) => s.serviceId)
        );
        currentPerformedIds.add(serviceId);
        await onUpdateServices(Array.from(currentPerformedIds));
      } else {
        const nextPlanned = [...appointmentServices.map((s) => s.serviceId), serviceId];
        await onUpdateServices(nextPlanned);
      }
      setSearchQuery('');
      setIsAdding(false);
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось добавить услугу к приёму'));
    } finally {
      setSubmitting(false);
    }
  };

  // Удаление услуги
  const handleRemoveService = async (serviceId: string) => {
    if (!canEditServices || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      if (isStarted || appointment.status === 'COMPLETED') {
        const nextIds = appointmentServices
          .filter((s) => s.serviceId !== serviceId && (s.isPerformed === true || (s.isPerformed == null && s.isPlanned)))
          .map((s) => s.serviceId);
        await onUpdateServices(nextIds);
      } else {
        if (appointmentServices.length <= 1) {
          setError('В записи должна оставаться хотя бы одна услуга');
          setSubmitting(false);
          return;
        }
        const nextIds = appointmentServices.filter((s) => s.serviceId !== serviceId).map((s) => s.serviceId);
        await onUpdateServices(nextIds);
      }
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось удалить услугу'));
    } finally {
      setSubmitting(false);
    }
  };

  // Расчёт фактической стоимости
  const computedTotal = useMemo(() => {
    return appointmentServices.reduce((sum, s) => {
      if (isStarted || appointment.status === 'COMPLETED') {
        const isCounted = s.isPerformed === true || (s.isPerformed == null && appointment.status !== 'CANCELLED');
        return isCounted ? sum + (s.priceSnapshot || 0) : sum;
      }
      return sum + (s.priceSnapshot || 0);
    }, 0);
  }, [appointmentServices, appointment.status, isStarted]);

  return (
    <div className="col gap-base">
      <div className="row between items-center">
        <span className="section-title m-0 font-bold">
          {isStarted || appointment.status === 'COMPLETED' ? 'Оказанные услуги' : 'Услуги приёма'} ({appointmentServices.length})
        </span>
        <span className="tnum font-bold text-primary">
          {formatCurrency(appointment.actualTotal ?? computedTotal)}
        </span>
      </div>

      {error && (
        <div className="alert alert-destructive p-xs text-sm" role="alert">
          <AlertCircle size={15} className="ic" />
          <span>{error}</span>
        </div>
      )}

      <div className="col gap-sm">
        {appointmentServices.map((svc) => {
          const isCompleted = appointment.status === 'COMPLETED';
          const isVisitActiveOrDone = isStarted || isCompleted;
          const isDone =
            svc.isPerformed === true || (isCompleted && svc.isPerformed !== false);
          const isNotDone = isCompleted && svc.isPerformed === false;
          const canRemove = !svc.isPlanned || isStarted || appointmentServices.length > 1;

          return (
            <div
              key={svc.serviceId}
              className={`service-item-row ${isNotDone ? 'opacity-60 bg-transparent' : ''}`}
            >
              <div className="row items-center grow gap-base min-w-0">
                {canEditServices && (isStarted || appointment.status === 'COMPLETED') ? (
                  <button
                    type="button"
                    className={`btn btn-sm btn-icon service-check-btn ${isDone ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleTogglePerformed(svc.serviceId, svc.isPerformed)}
                    disabled={submitting}
                    title={isDone ? 'Отметить как не оказанную' : 'Отметить как оказанную'}
                  >
                    {isDone ? <Check size={14} /> : null}
                  </button>
                ) : (
                  <span
                    className={`service-status-dot ${isDone ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}

                <div className="col gap-xs min-w-0">
                  <span
                    className={`small font-semibold break-words ${isNotDone ? 'line-through' : ''}`}
                  >
                    {svc.nameSnapshot}
                  </span>
                  <div className="row wrap items-center gap-sm">
                    {svc.isPlanned ? (
                      <span className="badge badge-outline badge-counter">
                        Запланирована
                      </span>
                    ) : (
                      <span className="badge badge-accent badge-counter">
                        Добавлена врачом
                      </span>
                    )}
                    {isDone && (
                      <span className="small text-success text-xs">
                        ✓ Оказана
                      </span>
                    )}
                    {isNotDone && (
                      <span className="small muted text-xs">
                        Не оказана
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="row items-center gap-md shrink-0">
                <span className="small tnum font-semibold">
                  {formatCurrency(svc.priceSnapshot)}
                </span>
                {canRemove && canEditServices && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm service-delete-btn"
                    onClick={() => handleRemoveService(svc.serviceId)}
                    disabled={submitting}
                    title="Удалить услугу"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canEditServices && (
        <>
          {isAdding ? (
            <div className="service-add-panel">
              <div className="row between items-center">
                <span className="text-xs font-semibold text-muted">
                  Выберите процедуру или услугу:
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => {
                    setIsAdding(false);
                    setSearchQuery('');
                  }}
                  disabled={submitting}
                  title="Закрыть"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="pos-rel">
                <Search
                  size={14}
                  className="pos-abs-l text-muted"
                />
                <input
                  type="text"
                  className="input input-sm search-input-with-icon w-full"
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  disabled={submitting}
                />
              </div>

              <div className="service-search-results">
                {filteredAvailableServices.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted">
                    {availableServicesToAdd.length === 0 ? 'Все доступные услуги уже добавлены' : 'Ничего не найдено'}
                  </div>
                ) : (
                  filteredAvailableServices.map((s) => {
                    const price = s.effectivePrice ?? s.basePrice ?? s.price ?? 0;
                    const duration = s.effectiveDurationMin ?? s.baseDurationMin ?? s.durationMin ?? 20;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        className="service-option-item"
                        onClick={() => handleAddService(s.id)}
                        disabled={submitting}
                      >
                        <div className="col gap-xs min-w-0">
                          <span className="text-sm font-medium truncate">
                            {s.name}
                          </span>
                          <span className="text-xs text-muted">
                            {duration} мин
                          </span>
                        </div>
                        <span className="tnum service-price-pill">
                          {formatCurrency(price)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {submitting && (
                <div className="row items-center justify-center gap-sm text-xs text-muted py-xs">
                  <Loader2 size={13} className="ic spin" />
                  <span>Сохранение услуг...</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-outline btn-sm btn-block border-dashed"
              onClick={() => setIsAdding(true)}
              disabled={submitting}
            >
              <Plus size={14} className="ic" />
              <span>
                {isStarted || appointment.status === 'COMPLETED'
                  ? 'Добавить проведённую услугу'
                  : 'Добавить услугу к записи'}
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
};