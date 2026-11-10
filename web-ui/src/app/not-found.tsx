import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="auth-wrap"
      style={{ flexDirection: 'column', gap: '16px', textAlign: 'center', minHeight: '70vh' }}
    >
      <div className="t-ava lg" style={{ width: 64, height: 64 }}>
        <FileQuestion className="ic" style={{ width: 28, height: 28 }} />
      </div>
      <h1 className="hero-title" style={{ fontSize: '28px', margin: 0 }}>
        404 — Страница не найдена
      </h1>
      <p className="muted small" style={{ maxWidth: '420px', margin: 0 }}>
        Запрашиваемый ресурс был перемещен или никогда не существовал. Проверьте правильность адреса.
      </p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: '8px' }}>
        <Home className="ic" />
        <span>Вернуться на главную</span>
      </Link>
    </div>
  );
}
