'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Repeat,
  Printer,
  AlertCircle,
  FileText,
  Play,
  UserX,
} from 'lucide-react';
import { VetActiveAppointmentDrawerProps } from './types';
import { STATUS_SHORT, formatSlotTime, getPetName, getOwnerDisplay } from './utils';
import { ConsultationPrintSheet } from '../../../../components/print/ConsultationPrintSheet';
import { SpeciesIcon } from '../../../../components/ui/SpeciesIcon';
import { vetApi } from '../../../../api';

/**
 * Боковая панель / модалка ведения текущего приёма:
 * позволяет врачу заполнять клинический протокол, диагноз, заметки и назначения,
 * управлять статусом визита, назначать повторный приём и печатать лист консультации.
 */
export const VetActiveAppointmentDrawer: React.FC<VetActiveAppointmentDrawerProps> = ({
  appointment,
  services,
  servicesMap,
  petsMap,
  onClose,
  onUpdateStatus,
  onRefresh,
}) => {
  // Заметки врача и клинический протокол
  const [notesText, setNotesText] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Диалог назначения повторного приёма
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpServiceId, setFollowUpServiceId] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  useEffect(() => {
    if (appointment) {
      setNotesText(appointment.vetNotes || '');
      setFollowUpServiceId(appointment.serviceId || (services[0]?.id ?? ''));
    }
  }, [appointment?.id, appointment?.vetNotes, appointment?.serviceId, services]);

  if (!appointment) {
    return (
      <section className="island" style={{ width: '100%', textAlign: 'center', padding: '32px 16px' }}>
        <div className="col items-center" style={{ gap: '8px', color: 'var(--muted-foreground)' }}>
          <FileText size={32} style={{ opacity: 0.4 }} />
          <span className="small" style={{ fontWeight: 500 }}>
            Выберите пациента из очереди для просмотра деталей и ведения клинического протокола
          </span>
        </div>
      </section>
    );
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await vetApi.updateAppointment(appointment.id, {
        vetNotes: notesText.trim() || undefined,
      });
      await onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Не удалось сохранить заметки');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFollowUp(true);
    setFollowUpError(null);
    try {
      const [hours, minutes] = followUpTime.split(':').map(Number);
      const start = new Date(`${followUpDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
      const targetSvc = services.find((s) => s.id === followUpServiceId) || services[0];
      const dur = targetSvc?.baseDurationMin || 30;
      const end = new Date(start.getTime() + dur * 60000);

      await vetApi.createFollowUp(appointment.id, {
        serviceId: targetSvc?.id || appointment.serviceId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      setIsFollowUpOpen(false);
      await onRefresh();
    } catch (err: any) {
      setFollowUpError(err?.message || 'Не удалось назначить повторный приём');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const petName = getPetName(appointment, petsMap);
  const ownerName = getOwnerDisplay(appointment, petsMap);
  const serviceName = servicesMap[appointment.serviceId] || 'Приём';

  return (
    <>
      <section className="island detail-island" style={{ width: '100%' }}>
        {/* Шапка протокола */}
        <div className="island-head">
          <div className="col" style={{ gap: '2px', minWidth: 0 }}>
            <span className="h2" style={{ wordBreak: 'break-word' }}>
              {serviceName}
            </span>
            <span className="cell-sub">
              {new Date(appointment.startAt).toLocaleDateString('ru-RU')} в{' '}
              {formatSlotTime(appointment.startAt)}–{formatSlotTime(appointment.endAt)}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            title="Закрыть панель приёма"
          >
            <X className="ic" />
          </button>
        </div>

        {/* Тело протокола */}
        <div className="island-body">
          <div className="col" style={{ gap: '14px' }}>
            {/* Статус и стоимость */}
            <div className="row wrap between items-center">
              <span className={`badge st badge-${appointment.status}`}>
                {STATUS_SHORT[appointment.status] || appointment.status}
              </span>
              {appointment.priceSnapshot != null && (
                <span className="cell-main tnum" style={{ fontWeight: 650 }}>
                  {appointment.priceSnapshot.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>

            {/* Карточка пациента и владельца */}
            <div
              className="row items-center"
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius)',
                background: 'var(--muted)',
                gap: '8px',
              }}
            >
              <span className="pet-ava sm" style={{ width: '28px', height: '28px' }}>
                <SpeciesIcon species="cat" size={16} />
              </span>
              <div className="col" style={{ gap: 0, minWidth: 0 }}>
                <span className="cell-main" style={{ fontWeight: 600 }}>
                  {petName}
                </span>
                <span className="muted small">{ownerName}</span>
              </div>
            </div>

            {/* Жалобы владельца */}
            {appointment.clientComment && (
              <div className="col" style={{ gap: '4px' }}>
                <span className="section-title">Жалобы владельца</span>
                <div className="note">{appointment.clientComment}</div>
              </div>
            )}

            {/* Поле протокола осмотра врача */}
            <div className="col" style={{ gap: '6px' }}>
              <span className="section-title">Клинический протокол и назначения</span>
              <textarea
                className="textarea"
                rows={5}
                maxLength={4000}
                placeholder="Опишите результаты осмотра, диагноз, назначенные препараты и дозировки..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
              />
              <div className="row between items-center">
                <span className="small muted">{notesText.length} / 4000</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={savingNotes}
                  onClick={handleSaveNotes}
                >
                  {savingNotes ? 'Сохранение...' : 'Сохранить заметки'}
                </button>
              </div>
            </div>

            {/* Кнопки управления статусом приёма */}
            <div className="row wrap" style={{ gap: '6px', paddingTop: '8px' }}>
              {appointment.status === 'CONFIRMED' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => onUpdateStatus(appointment.id, 'IN_PROGRESS')}
                >
                  <Play size={13} className="ic" />
                  <span>Начать приём</span>
                </button>
              )}

              {appointment.status === 'PENDING' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => onUpdateStatus(appointment.id, 'CONFIRMED')}
                >
                  Подтвердить
                </button>
              )}

              {appointment.status !== 'COMPLETED' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onUpdateStatus(appointment.id, 'COMPLETED')}
                >
                  <Check className="ic" />
                  <span>Завершить приём</span>
                </button>
              )}

              {appointment.status !== 'NO_SHOW' && appointment.status !== 'COMPLETED' && (
                <button
                  type="button"
                  className="btn btn-destructive-outline btn-sm"
                  onClick={() => onUpdateStatus(appointment.id, 'NO_SHOW')}
                >
                  <UserX size={13} className="ic" />
                  <span>Неявка</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setFollowUpServiceId(appointment.serviceId);
                  setIsFollowUpOpen(true);
                }}
              >
                <Repeat className="ic" />
                <span>Повторный приём</span>
              </button>

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

      {/* Диалог назначения повторного приёма */}
      {isFollowUpOpen && (
        <div className="dialog-backdrop">
          <div className="dialog" style={{ width: '440px', maxWidth: 'calc(100vw - 32px)' }}>
            <div className="dialog-head">
              <span className="dialog-title">Назначить повторный приём</span>
              <span className="dialog-desc">
                Создание связанного визита для контроля результатов лечения
              </span>
            </div>

            <form onSubmit={handleScheduleFollowUp}>
              <div className="dialog-body">
                {followUpError && (
                  <div className="alert alert-destructive">
                    <AlertCircle className="ic" />
                    <div>{followUpError}</div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="field span-2">
                    <label className="field-label" htmlFor="fu-svc">
                      Услуга
                    </label>
                    <select
                      id="fu-svc"
                      className="select"
                      value={followUpServiceId}
                      onChange={(e) => setFollowUpServiceId(e.target.value)}
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.baseDurationMin} мин)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="fu-date">
                      Дата приёма
                    </label>
                    <input
                      id="fu-date"
                      type="date"
                      className="input"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="fu-time">
                      Время
                    </label>
                    <input
                      id="fu-time"
                      type="time"
                      className="input"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsFollowUpOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingFollowUp}>
                  {submittingFollowUp ? 'Назначение...' : 'Назначить приём'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Печатный лист консультации */}
      <ConsultationPrintSheet
        appointment={appointment}
        serviceName={serviceName}
        notes={notesText}
      />
    </>
  );
};
