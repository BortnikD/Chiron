'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, X, ReceiptText } from 'lucide-react';
import { formatCurrency, formatSlotTime } from '@/shared/lib';
import { BookingSummaryIsland } from './BookingSummaryIsland';
import type { Service, Veterinarian } from '@/modules/clinic/types';

export interface MobileBookingSummaryBarProps {
  petName?: string;
  speciesName?: string;
  serviceName?: string;
  selectedServices?: Service[];
  doctorDisplay: string;
  selectedSlotStartAt?: string | null;
  selectedSlotEndAt?: string | null;
  serviceDurationMin?: number | null;
  servicePrice?: number | null;
  availableVetsForSlot?: Veterinarian[];
  selectedSlotVetId?: string | null;
  onSelectSlotVetId?: (vetId: string) => void;
  specsMap?: Record<string, string>;
  showSlotVetPicker?: boolean;
}

export const MobileBookingSummaryBar: React.FC<MobileBookingSummaryBarProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasAnyData = Boolean(
    props.petName ||
      props.serviceName ||
      (props.selectedServices && props.selectedServices.length > 0) ||
      props.selectedSlotStartAt ||
      props.servicePrice
  );

  if (!hasAnyData) return null;

  const servicesLabel =
    props.selectedServices && props.selectedServices.length > 1
      ? `Услуги (${props.selectedServices.length})`
      : props.serviceName;

  const shortSummary = [
    props.petName,
    servicesLabel,
    props.selectedSlotStartAt ? formatSlotTime(props.selectedSlotStartAt) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      {/* Mobile Sticky Bar - Only visible on small screens (max-width: 860px) */}
      <div className="mobile-only-summary-bar">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="mobile-summary-trigger"
          aria-expanded={isOpen}
          aria-label="Сводка параметров записи"
        >
          <div className="row items-center" style={{ gap: '8px', minWidth: 0, flex: 1 }}>
            <span className="summary-icon-badge">
              <ReceiptText size={15} />
            </span>
            <div className="col" style={{ gap: '1px', textAlign: 'left', minWidth: 0 }}>
              <span className="summary-short-text">
                {shortSummary || 'Сводка записи'}
              </span>
              <span className="small muted">
                {props.servicePrice != null ? formatCurrency(props.servicePrice) : 'Нажмите для деталей'}
              </span>
            </div>
          </div>
          <div className="row items-center" style={{ gap: '4px', flexShrink: 0 }}>
            <span className="summary-toggle-btn">
              {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </span>
          </div>
        </button>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      {isOpen && (
        <div
          className="modal-backdrop mobile-summary-sheet-backdrop"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="mobile-summary-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Детали записи"
          >
            <div className="row between items-center mobile-summary-sheet-header">
              <span className="h3" style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Параметры записи
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mobile-summary-sheet-body">
              <BookingSummaryIsland {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
