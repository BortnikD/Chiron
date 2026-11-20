import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Услуги и цены',
  description: 'Полный каталог ветеринарных услуг клиники Chiron: терапия, хирургия, диагностика, вакцинация и стационар.',
  openGraph: {
    title: 'Услуги и цены | Chiron',
    description: 'Полный каталог ветеринарных услуг клиники Chiron: терапия, хирургия, диагностика, вакцинация и стационар.',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
