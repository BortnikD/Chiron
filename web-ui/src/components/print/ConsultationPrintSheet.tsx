'use client';

import React from 'react';
import type { Appointment, Pet } from '@/modules/client/types';
import {
  APPOINTMENT_STATUS_META,
  formatDateRu,
  formatIsoDateDisplay,
  formatSlotTime,
} from '@/shared/lib';

interface ConsultationPrintSheetProps {
  appointment: Appointment | null;
  serviceName?: string;
  pet?: Pet | null;
  vetName?: string;
  notes?: string;
}

export const ConsultationPrintSheet: React.FC<ConsultationPrintSheetProps> = ({
  appointment,
  serviceName = 'Первичный приём и консультация',
  pet,
  vetName = 'Ветеринарный врач',
  notes = '',
}) => {
  if (!appointment) return null;

  const apptDate = formatDateRu(appointment.startAt, true);
  const apptTime = `${formatSlotTime(appointment.startAt)} – ${formatSlotTime(appointment.endAt)}`;
  const statusLabel = APPOINTMENT_STATUS_META[appointment.status]?.label || appointment.status;
  const clinicalNotes = (notes || appointment.vetNotes || '').trim();

  return (
    <div className="print-sheet print-only" id="consultation-sheet">
      <div className="print-sheet-header">
        <div>
          <h1 className="print-sheet-title">Ветеринарный клинический центр Chiron</h1>
          <div className="print-sheet-sub">
            Медицинский протокол амбулаторного приёма № {appointment.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: '11pt' }}>{apptDate}</div>
          <div className="print-sheet-sub">{apptTime}</div>
        </div>
      </div>

      <div className="print-sheet-grid">
        <div>
          <div className="print-sheet-label">Сведения о пациенте</div>
          <div><b>Кличка:</b> {pet?.name || 'Пациент'}</div>
          <div><b>Вид:</b> {pet?.species?.name || pet?.speciesName || 'Животное'}</div>
          {pet?.breed && <div><b>Порода:</b> {pet.breed}</div>}
          {pet?.birthDate && <div><b>Дата рождения:</b> {formatIsoDateDisplay(pet.birthDate)}</div>}
        </div>

        <div>
          <div className="print-sheet-label">Сведения о приёме</div>
          <div><b>Врач:</b> {vetName}</div>
          <div><b>Услуга:</b> {serviceName}</div>
          <div><b>Статус:</b> {statusLabel}</div>
        </div>
      </div>

      {appointment.clientComment && (
        <div className="print-sheet-section">
          <div className="print-sheet-label">Анамнез и жалобы владельца</div>
          <div className="print-sheet-content">{appointment.clientComment}</div>
        </div>
      )}

      <div className="print-sheet-section">
        <div className="print-sheet-label">Протокол осмотра, диагноз и назначения</div>
        <div className="print-sheet-content">
          {clinicalNotes || 'Записи осмотра не внесены.'}
        </div>
      </div>

      <div className="print-sheet-foot">
        <div>
          <div>Лечащий врач: ____________________ / {vetName} /</div>
          <div className="print-sheet-sub" style={{ marginTop: '4px' }}>
            Подпись и личная печать специалиста
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>М.П. Клиники Chiron</div>
          <div className="print-sheet-sub" style={{ marginTop: '4px' }}>
            Документ сформирован в ИС Chiron
          </div>
        </div>
      </div>
    </div>
  );
};
