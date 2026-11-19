import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_PROXY_TARGET = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_PROXY_TARGET ||
  'http://localhost:8080'
).replace(/\/+$/, '');

const DEV_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@chiron.local';
const DEV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const FEATURED_PET_IDS = [
  '5eed0007-0000-0000-0000-000000000001',
  '5eed0007-0000-0000-0000-000000000689',
  '5eed0007-0000-0000-0000-000000000556',
  '5eed0007-0000-0000-0000-000000000801',
  '5eed0007-0000-0000-0000-000000000154',
  '5eed0007-0000-0000-0000-000000000402',
];

interface CachedState {
  pets: any[];
  cachedAt: number;
}

let cachedState: CachedState | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 минут (S3 presigned ссылки живут 15 минут)

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }
  try {
    const res = await fetch(`${API_PROXY_TARGET}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json?.result?.accessToken) {
      cachedToken = json.result.accessToken;
      tokenExpiresAt = now + 3600 * 1000;
      return cachedToken;
    }
  } catch (err) {
    console.error('Failed to authenticate for featured pets:', err);
  }
  return null;
}

export async function GET() {
  const now = Date.now();
  if (cachedState && now - cachedState.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ success: true, result: cachedState.pets });
  }

  const token = await getAdminToken();
  if (!token) {
    if (cachedState) {
      return NextResponse.json({ success: true, result: cachedState.pets });
    }
    return NextResponse.json({ success: false, error: 'Authorization unavailable' }, { status: 500 });
  }

  try {
    const pets = await Promise.all(
      FEATURED_PET_IDS.map(async (id) => {
        try {
          const res = await fetch(`${API_PROXY_TARGET}/api/v1/admin/pets/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (!res.ok) return null;
          const data = await res.json();
          return data?.success ? data.result : null;
        } catch {
          return null;
        }
      })
    );

    const validPets = pets.filter(Boolean);
    if (validPets.length > 0) {
      cachedState = {
        pets: validPets,
        cachedAt: now,
      };
      return NextResponse.json({ success: true, result: validPets });
    }
  } catch (err) {
    console.error('Error fetching featured pets:', err);
  }

  if (cachedState) {
    return NextResponse.json({ success: true, result: cachedState.pets });
  }

  return NextResponse.json({ success: false, error: 'Failed to retrieve featured pets' }, { status: 500 });
}
