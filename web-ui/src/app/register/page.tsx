'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login?mode=register');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center p-4 text-xs text-[var(--muted-foreground)]">
      Перенаправление на регистрацию...
    </div>
  );
}
