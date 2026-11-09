import { Appointment, Species } from '../../../../types';

/**
 * Возвращает название вида животного по его ID
 */
export function getSpeciesName(speciesList: Species[], spId?: string): string {
  if (!spId) return '—';
  const s = speciesList.find((sp) => sp.id === spId);
  return s ? s.name : '—';
}

/**
 * Рассчитывает возраст животного по дате рождения в читаемом формате
 */
export function calculateAge(birthDate?: string | null): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0) return `${years} г. ${months > 0 ? `${months} м.` : ''}`.trim();
  if (months > 0) return `${months} мес.`;
  return 'Меньше месяца';
}

/**
 * Возвращает приёмы конкретного пациента
 */
export function getPatientAppointments(appointments: Appointment[], petId: string): Appointment[] {
  return appointments.filter((a) => a.petId === petId);
}

/**
 * Дата последнего прошедшего приёма пациента
 */
export function getLastAppointment(appointments: Appointment[], petId: string): string {
  const list = getPatientAppointments(appointments, petId)
    .filter((a) => new Date(a.startAt) <= new Date())
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  if (list.length === 0) return '—';
  return list[0].startAt.slice(0, 10);
}

/**
 * Дата следующего запланированного приёма пациента
 */
export function getNextAppointment(appointments: Appointment[], petId: string): string {
  const list = getPatientAppointments(appointments, petId)
    .filter((a) => new Date(a.startAt) > new Date() && a.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  if (list.length === 0) return '—';
  const d = new Date(list[0].startAt);
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = list[0].startAt.slice(0, 10);
  if (dateStr === today) {
    return `сегодня ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return dateStr;
}
