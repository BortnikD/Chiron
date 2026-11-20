import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Наши врачи',
  description: 'Квалифицированные врачи-ветеринары клиники Chiron: специализации, стаж, опыт и расписание приёма.',
  openGraph: {
    title: 'Наши врачи | Chiron',
    description: 'Квалифицированные врачи-ветеринары клиники Chiron: специализации, стаж, опыт и расписание приёма.',
  },
};

export default function VeterinariansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
