import React from 'react';
import { Appointment, AppointmentStatus, Service, Pet } from '../../../../types';

export interface VetQueueSummaryProps {
  /** Все приёмы на сегодня */
  todayAppointments: Appointment[];
  /** Следующий приём в очереди */
  nextAppointment: Appointment | null;
  /** Текущий приём (в процессе) */
  currentAppointment?: Appointment | null;
  /** Карта услуг (id -> название) */
  servicesMap: Record<string, string>;
  /** Карта питомцев (id -> Pet) */
  petsMap?: Record<string, Pet>;
  /** Выбор приёма для просмотра/ведения */
  onSelectAppointment?: (appt: Appointment) => void;
}

export interface VetQueueListProps {
  /** Все приёмы */
  appointments: Appointment[];
  /** Приёмы на сегодня */
  todayAppointments: Appointment[];
  /** Выбранный приём */
  selectedAppointment: Appointment | null;
  /** Следующий приём в очереди */
  nextAppointment: Appointment | null;
  /** Карта услуг */
  servicesMap: Record<string, string>;
  /** Карта питомцев */
  petsMap?: Record<string, Pet>;
  /** Флаг загрузки */
  loading?: boolean;
  /** Обработчик выбора приёма */
  onSelectAppointment: (appt: Appointment) => void;
  /** Обработчик смены статуса приёма */
  onUpdateStatus: (apptId: string, status: AppointmentStatus) => void;
}

export interface VetActiveAppointmentDrawerProps {
  /** Выбранный приём (null — панель скрыта) */
  appointment: Appointment | null;
  /** Список доступных услуг */
  services: Service[];
  /** Карта услуг */
  servicesMap: Record<string, string>;
  /** Карта питомцев */
  petsMap?: Record<string, Pet>;
  /** Закрыть карточку приёма */
  onClose: () => void;
  /** Обновить статус приёма */
  onUpdateStatus: (apptId: string, status: AppointmentStatus) => void;
  /** Обновить данные дашборда после изменений */
  onRefresh: () => Promise<void> | void;
}

export interface VetQuickScheduleIslandProps {
  /** Все приёмы врача */
  appointments: Appointment[];
  /** Записи, ожидающие подтверждения */
  pendingAppointments: Appointment[];
  /** Карта услуг */
  servicesMap: Record<string, string>;
  /** Карта питомцев */
  petsMap?: Record<string, Pet>;
  /** Обработчик выбора приёма */
  onSelectAppointment: (appt: Appointment) => void;
  /** Обработчик подтверждения или обновления статуса */
  onUpdateStatus: (apptId: string, status: AppointmentStatus) => void;
}
