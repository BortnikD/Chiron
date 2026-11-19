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
    <div className="col" style={{ gap: '10px' }}>
      <div className="row between items-center">
        <span className="section-title" style={{ margin: 0, fontWeight: 700 }}>
          {isStarted || appointment.status === 'COMPLETED' ? 'Оказанные услуги' : 'Услуги приёма'} ({appointmentServices.length})
        </span>
        <span className="tnum" style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {formatCurrency(appointment.actualTotal ?? computedTotal)}
        </span>
      </div>

      {error && (
        <div className="alert alert-destructive" role="alert" style={{ padding: '8px 12px', fontSize: '13px' }}>
          <AlertCircle size={15} className="ic" />
          <span>{error}</span>
        </div>
      )}

      <div className="col" style={{ gap: '6px' }}>
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
              className="row between items-center"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: isNotDone ? 'transparent' : 'color-mix(in srgb, var(--card) 95%, transparent)',
                opacity: isNotDone ? 0.6 : 1,
                gap: '8px',
              }}
            >
              <div className="row items-center grow" style={{ gap: '10px', minWidth: 0 }}>
                {canEditServices && (isStarted || appointment.status === 'COMPLETED') ? (
                  <button
                    type="button"
                    className={`btn btn-sm btn-icon ${isDone ? 'btn-primary' : 'btn-outline'}`}
                    style={{ width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0 }}
                    onClick={() => handleTogglePerformed(svc.serviceId, svc.isPerformed)}
                    disabled={submitting}
                    title={isDone ? 'Отметить как не оказанную' : 'Отметить как оказанную'}
                  >
                    {isDone ? <Check size={14} /> : null}
                  </button>
                ) : (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isDone ? 'var(--primary)' : 'var(--muted)',
                      flexShrink: 0,
                    }}
                  />
                )}

                <div className="col" style={{ gap: '2px', minWidth: 0 }}>
                  <span
                    className="small"
                    style={{
                      fontWeight: 600,
                      textDecoration: isNotDone ? 'line-through' : 'none',
                      wordBreak: 'break-word',
                    }}
                  >
                    {svc.nameSnapshot}
                  </span>
                  <div className="row wrap items-center" style={{ gap: '6px' }}>
                    {svc.isPlanned ? (
                      <span className="badge badge-outline" style={{ fontSize: '11px', padding: '1px 6px' }}>
                        Запланирована
                      </span>
                    ) : (
                      <span className="badge badge-accent" style={{ fontSize: '11px', padding: '1px 6px' }}>
                        Добавлена врачом
                      </span>
                    )}
                    {isDone && (
                      <span className="small text-success" style={{ fontSize: '11px' }}>
                        ✓ Оказана
                      </span>
                    )}
                    {isNotDone && (
                      <span className="small muted" style={{ fontSize: '11px' }}>
                        Не оказана
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="row items-center" style={{ gap: '8px', flexShrink: 0 }}>
                <span className="small tnum" style={{ fontWeight: 600 }}>
                  {formatCurrency(svc.priceSnapshot)}
                </span>
                {canRemove && canEditServices && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{
                      color: 'var(--destructive)',
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                    }}
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
            <div
              className="col"
              style={{
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                background: 'color-mix(in srgb, var(--card) 95%, transparent)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div className="row between items-center">
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  Выберите процедуру или услугу:
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{ width: '22px', height: '22px' }}
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

              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted-foreground)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  className="input input-sm"
                  style={{ paddingLeft: '32px', width: '100%' }}
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  disabled={submitting}
                />
              </div>

              <div
                className="col"
                style={{
                  maxHeight: '190px',
                  overflowY: 'auto',
                  gap: '4px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  padding: '4px',
                }}
              >
                {filteredAvailableServices.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--muted-foreground)' }}>
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
                        className="row between items-center"
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          color: 'inherit',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 12%, var(--card))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                        onClick={() => handleAddService(s.id)}
                        disabled={submitting}
                      >
                        <div className="col" style={{ gap: '2px', minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {s.name}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                            {duration} мин
                          </span>
                        </div>
                        <span
                          className="tnum"
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            whiteSpace: 'nowrap',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                          }}
                        >
                          {formatCurrency(price)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {submitting && (
                <div className="row items-center justify-center" style={{ gap: '6px', fontSize: '12px', color: 'var(--muted-foreground)', padding: '4px 0' }}>
                  <Loader2 size={13} className="ic spin" />
                  <span>Сохранение услуг...</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-outline btn-sm btn-block"
              style={{ borderStyle: 'dashed' }}
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