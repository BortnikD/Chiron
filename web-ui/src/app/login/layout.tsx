import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход в личный кабинет',
  description: 'Авторизация в личном кабинете клиники Chiron для клиентов, врачей и администраторов.',
  openGraph: {
    title: 'Вход в личный кабинет | Chiron',
    description: 'Авторизация в личном кабинете клиники Chiron для клиентов, врачей и администраторов.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
