import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-6">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 — Страница не найдена</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Запрашиваемый ресурс был перемещен или никогда не существовал. Проверьте правильность адреса.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button leftIcon={<Home className="w-4 h-4" />}>
            Вернуться на главную
          </Button>
        </Link>
      </div>
    </div>
  );
}
