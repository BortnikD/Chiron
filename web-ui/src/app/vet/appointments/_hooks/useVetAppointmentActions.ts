import { useCallback } from 'react';
import { vetApi } from '@/modules/vet/api';
import type { CreateFollowUpRequest } from '@/modules/vet/types';
import type { Appointment, CreateVaccinationRequest, Pet } from '@/modules/client/types';
import type { AppointmentStatus } from '@/shared/types';
import { useToast } from '@/shared/components';
import { formatApiError } from '@/shared/lib';

const STATUS_TOASTS: Partial<Record<AppointmentStatus, [string, string]>> = {
  CONFIRMED: ['Запись подтверждена', 'Владелец получит уведомление «Запись подтверждена»'],
  COMPLETED: ['Приём завершён', 'Не забудьте заполнить заметки и прививки'],
  NO_SHOW: ['Отмечена неявка', 'Статус приёма обновлён'],
  CANCELLED: ['Запись отменена', 'Владелец получит уведомление с причиной'],
};

export function notifyVetAppointmentsUpdated() {
  window.dispatchEvent(new CustomEvent('chiron:vet-appointments-updated'));
}

export function useVetAppointmentActions(options: {
  reloadAppointments: (silent?: boolean) => Promise<Appointment[]>;
  setSelectedAppt: React.Dispatch<React.SetStateAction<Appointment | null>>;
  petsMap: Record<string, Pet>;
  isMountedRef: React.MutableRefObject<boolean>;
}) {
  const { reloadAppointments, setSelectedAppt, petsMap, isMountedRef } = options;
  const { toast } = useToast();

  const handleUpdateStatus = useCallback(
    async (apptId: string, status: AppointmentStatus, cancelReason?: string | null) => {
      try {
        const updated = await vetApi.updateAppointment(apptId, {
          status,
          ...(status === 'CANCELLED' ? { cancelReason: cancelReason ?? null } : {}),
        });
        const freshItems = await reloadAppointments(true);
        if (!isMountedRef.current) return;
        const fresh = freshItems.find((a) => a.id === apptId) ?? updated;
        setSelectedAppt((prev) => (prev?.id === apptId ? fresh : prev));
        const msg = STATUS_TOASTS[status];
        if (msg) toast(msg[0], msg[1]);
        notifyVetAppointmentsUpdated();
      } catch (err: unknown) {
        const text = formatApiError(err, 'Ошибка обновления статуса');
        if (status === 'CANCELLED') throw new Error(text);
        toast('Не удалось обновить статус', text, 'err');
      }
    },
    [reloadAppointments, setSelectedAppt, isMountedRef, toast]
  );

  const handleSaveNotes = useCallback(
    async (apptId: string, notes: string | null) => {
      const updated = await vetApi.updateAppointment(apptId, { vetNotes: notes });
      const freshItems = await reloadAppointments(true);
      if (!isMountedRef.current) return;
      const fresh = freshItems.find((a) => a.id === apptId) ?? updated;
      setSelectedAppt((prev) => (prev?.id === apptId ? fresh : prev));
      toast(notes ? 'Заметки сохранены' : 'Заметки очищены');
      notifyVetAppointmentsUpdated();
    },
    [reloadAppointments, setSelectedAppt, isMountedRef, toast]
  );

  const handleCreateFollowUp = useCallback(
    async (apptId: string, data: CreateFollowUpRequest) => {
      await vetApi.createFollowUp(apptId, data);
      await reloadAppointments(true);
      toast('Повторный приём назначен', 'Запись подтверждена, владелец получит уведомление');
      notifyVetAppointmentsUpdated();
    },
    [reloadAppointments, toast]
  );

  const handleCreateVaccination = useCallback(
    async (payload: CreateVaccinationRequest) => {
      await vetApi.createVaccination(payload);
      const pName = petsMap[payload.petId]?.name || 'Пациент';
      toast('Прививка внесена', `${pName} — ${payload.name}`);
    },
    [petsMap, toast]
  );

  return {
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
    handleCreateVaccination,
  };
}
