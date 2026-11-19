export interface AdminSentMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientRole?: string;
  title: string;
  body: string;
  createdAt: string;
}

const STORAGE_KEY = 'chiron:admin-sent-messages';

// Инициализируем сообщение, отправленное администратором пользователю client1@seed.chiron.local
const INITIAL_SENT_MESSAGES: AdminSentMessage[] = [
  {
    id: '5e6d2c43-bc9e-4d80-ae9c-437167de566f',
    recipientId: '5eed0005-0000-0000-0000-000000000001',
    recipientName: 'Иван Соколов',
    recipientEmail: 'client1@seed.chiron.local',
    recipientPhone: '+79100000001',
    recipientRole: 'CLIENT',
    title: 'Тест',
    body: 'не работаем',
    createdAt: '2026-11-18T23:28:33.178836Z',
  },
];

export function getAdminSentMessages(): AdminSentMessage[] {
  if (typeof window === 'undefined') return INITIAL_SENT_MESSAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SENT_MESSAGES));
      return INITIAL_SENT_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SENT_MESSAGES));
    return INITIAL_SENT_MESSAGES;
  } catch {
    return INITIAL_SENT_MESSAGES;
  }
}

export function saveAdminSentMessage(message: AdminSentMessage): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAdminSentMessages();
    const updated = [message, ...current.filter((m) => m.id !== message.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('chiron:admin-sent-messages-updated', { detail: message })
    );
  } catch (err) {
    console.error('Failed to save sent message to localStorage', err);
  }
}
