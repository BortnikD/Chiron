import { UserRole } from '../../../../types';

export const ROLE_META: Record<UserRole, { label: string; cls: string }> = {
  CLIENT: { label: 'Клиент', cls: 'badge-outline' },
  VETERINARIAN: { label: 'Ветеринар', cls: 'badge-accent' },
  ADMIN: { label: 'Администратор', cls: 'badge-CONFIRMED' },
};

export const getUserInitials = (u: { firstName?: string; lastName?: string }) => {
  const f = (u.firstName || '').trim();
  const l = (u.lastName || '').trim();
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  return 'ПЛ';
};
