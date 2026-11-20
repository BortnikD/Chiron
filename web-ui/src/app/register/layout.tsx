import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Регистрация',
  description: 'Создание учётной записи в системе Chiron для записи питомцев на приём и доступа к медкарте.',
  openGraph: {
    title: 'Регистрация | Chiron',
    description: 'Создание учётной записи в системе Chiron для записи питомцев на приём и доступа к медкарте.',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
