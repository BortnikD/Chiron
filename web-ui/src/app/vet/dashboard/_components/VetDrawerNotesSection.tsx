'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian } from '@/modules/clinic/types';
import { formatApiError, formatDateShort, formatSlotTime } from '@/shared/lib';
import { formatCancelledByLabel } from './vetHelpers';

export interface VetDrawerNotesSectionProps {
  appointment: Appointment;
  vet?: Veterinarian | null;
  pet?: Pet | null;
  currentUserId?: string | null;
  onSaveNotes: (apptId: string, notes: string | null) => Promise<void>;
  onNotesTextChange?: (val: string) => void;
}

export const VetDrawerNotesSection: React.FC<VetDrawerNotesSectionProps> = ({
  appointment,
  vet,
  pet,
  currentUserId,
  onSaveNotes,
  onNotesTextChange,
}) => {
  const [notesText, setNotesText] = useState<string>(() => appointment.vetNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    const initial = appointment.vetNotes || '';
    setNotesText(initial);
    setNotesError(null);
    onNotesTextChange?.(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment.id, appointment.vetNotes]);

  const savedNotes = appointment.vetNotes || '';
  const notesDirty = notesText !== savedNotes;

  const handleSave = async () => {
    setSavingNotes(true);
    setNotesError(null);
    try {
      await onSaveNotes(appointment.id, notesText.trim() || null);
    } catch (err: unknown) {
      setNotesError(formatApiError(err, 'Не удалось сохранить заметки'));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleClear = async () => {
    setSavingNotes(true);
    setNotesError(null);
    try {
      setNotesText('');
      onNotesTextChange?.('');
      await onSaveNotes(appointment.id, null);
    } catch (err: unknown) {
      setNotesError(formatApiError(err, 'Не удалось очистить заметки'));
    } finally {
      setSavingNotes(false);
    }
  };

  const cancelledAtText = appointment.cancelledAt
    ? `${formatDateShort(appointment.cancelledAt)} ${formatSlotTime(appointment.cancelledAt)}`
    : '—';

  return (
    <>
      <div className="col" style={{ gap: '6px' }}>
        <span className="section-title">Комментарий клиента</span>
        <div className="note">{appointment.clientComment || '—'}</div>
      </div>

      <div className="col" style={{ gap: '6px' }}>
        <div className="row between">
          <label className="section-title" htmlFor="vet-notes">
            Заметки врача
          </label>
          <span className="small muted tnum">{notesText.length} / 4000</span>
        </div>
        {notesError && (
          <div className="alert alert-destructive" role="alert">
            <AlertCircle className="ic" />
            <div>{notesError}</div>
          </div>
        )}
        <textarea
          id="vet-notes"
          className="textarea"
          style={{ minHeight: '110px' }}
          maxLength={4000}
          placeholder="Анамнез, назначения, рекомендации"
          value={notesText}
          onChange={(e) => {
            const next = e.target.value.slice(0, 4000);
            setNotesText(next);
            onNotesTextChange?.(next);
          }}
          disabled={savingNotes}
        />
        <div className="row between">
          <span className="small muted">
            {notesDirty ? 'Есть несохранённые изменения' : 'Сохранено'}
          </span>
          <div className="row" style={{ gap: '6px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={savingNotes || (!notesText && !savedNotes)}
              onClick={() => void handleClear()}
            >
              Очистить
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={savingNotes}
              onClick={() => void handleSave()}
            >
              {savingNotes ? 'Сохранение…' : 'Сохранить заметки'}
            </button>
          </div>
        </div>
      </div>

      {appointment.status === 'CANCELLED' && (
        <div className="col" style={{ gap: '6px' }}>
          <span className="section-title">Отмена</span>
          <dl className="kv" style={{ margin: 0 }}>
            <dt>Кто</dt>
            <dd>{formatCancelledByLabel(appointment, vet, pet, currentUserId)}</dd>
            <dt>Когда</dt>
            <dd className="tnum">{cancelledAtText}</dd>
            <dt>Причина</dt>
            <dd>{appointment.cancelReason || appointment.cancellationReason || 'Не указана'}</dd>
          </dl>
        </div>
      )}
    </>
  );
};
