'use client';

import { useState, useCallback, type MutableRefObject } from 'react';
import { clientApi } from '@/modules/client/api';
import type { Appointment } from '@/modules/client/types';
import { useToast } from '@/shared/components';
import { formatApiError } from '@/shared/lib';

/**
 * Хук управления модальным окном отмены записи на приём.
 */
export function useAppointmentCancel(params: {
  selectedAppt: Appointment | null;
  setSelectedAppt: React.Dispatch<React.SetStateAction<Appointment | null>>;
  loadAppointments: () => Promise<Appointment[] | null>;
  isMountedRef: MutableRefObject<boolean>;
}) {
  const { selectedAppt, setSelectedAppt, loadAppointments, isMountedRef } = params;
  const { toast } = useToast();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const openCancelModal = useCallback(() => {
    setCancelError(null);
    setCancelReason('');
    setIsCancelModalOpen(true);
  }, []);

  const closeCancelModal = useCallback(() => {
    if (!cancelling) {
      setIsCancelModalOpen(false);
    }
  }, [cancelling]);

  const handleCancelAppointment = useCallback(async () => {
    if (!selectedAppt) return;
    const targetId = selectedAppt.id;
    setCancelling(true);
    setCancelError(null);

    try {
      const updated = await clientApi.cancelAppointment(targetId, cancelReason.trim() || undefined);
      setIsCancelModalOpen(false);
      setCancelReason('');
      toast('Запись отменена', 'Врач получит уведомление об отмене');
      const freshItems = await loadAppointments();
      if (isMountedRef.current) {
        const matched = freshItems?.find((item) => item.id === targetId);
        setSelectedAppt(matched ?? updated ?? null);
      }
    } catch (err: unknown) {
      const msg = formatApiError(err, 'Не удалось отменить запись');
      setCancelError(msg);
      toast('Не удалось отменить запись', msg, 'err');
    } finally {
      if (isMountedRef.current) {
        setCancelling(false);
      }
    }
  }, [selectedAppt, cancelReason, loadAppointments, setSelectedAppt, isMountedRef, toast]);

  return {
    isCancelModalOpen,
    cancelReason,
    setCancelReason,
    cancelling,
    cancelError,
    openCancelModal,
    closeCancelModal,
    handleCancelAppointment,
  };
}
