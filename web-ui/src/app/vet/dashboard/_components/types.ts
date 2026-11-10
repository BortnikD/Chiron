import type { AppointmentStatus } from '@/shared/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { CreateFollowUpRequest } from '@/modules/vet/types';

export interface VetQueueSummaryProps {
  /** Все приёмы на сегодня */
  todayAppointments: Appointment[];
  /** Следующий приём в очереди */
  nextAppointment: Appointment | null;
  /** Карта услуг (id -> название) */
  servicesMap: Record<string, string>;
  /** Карта питомцев (id -> Pet) */
  petsMap?: Record<string, Pet>;
  /** Карта видов животных (id -> название) */
  speciesMap?: Record<string, string>;
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
  /** Карта видов животных (id -> название) */
  speciesMap?: Record<string, string>;
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
  /** Карта видов животных (id -> название) */
  speciesMap?: Record<string, string>;
  /** Профиль текущего врача для печатного листа */
  vet?: Veterinarian | null;
  /** Карта специализаций */
  specsMap?: Record<string, string>;
  /** Закрыть карточку приёма */
  onClose: () => void;
  /** Обновить статус приёма */
  onUpdateStatus: (apptId: string, status: AppointmentStatus) => void;
  /** Сохранить заметки врача */
  onSaveNotes: (apptId: string, notes: string) => Promise<void>;
  /** Назначить повторный приём */
  onCreateFollowUp: (apptId: string, data: CreateFollowUpRequest) => Promise<void>;
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
  /** Флаг первичной загрузки */
  loading?: boolean;
  /** Обработчик выбора приёма */
  onSelectAppointment: (appt: Appointment) => void;
  /** Обработчик подтверждения или обновления статуса */
  onUpdateStatus: (apptId: string, status: AppointmentStatus) => void;
}
