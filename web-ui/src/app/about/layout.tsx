import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'О клинике',
  description: 'О ветеринарной клинике Chiron: наша миссия, стандарты лечения, современное оборудование и контакты.',
  openGraph: {
    title: 'О клинике | Chiron',
    description: 'О ветеринарной клинике Chiron: наша миссия, стандарты лечения, современное оборудование и контакты.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
