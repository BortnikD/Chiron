import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MEDIA_PROXY_TARGET = (
  process.env.MEDIA_PROXY_TARGET || 'http://localhost:3900'
).replace(/\/+$/, '');

async function proxyMediaRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const targetUrl = `${MEDIA_PROXY_TARGET}/${path.join('/')}${req.nextUrl.search}`;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    redirect: 'manual',
  });

  const headers = new Headers();
  for (const key of ['content-type', 'cache-control', 'etag', 'last-modified', 'content-disposition']) {
    const val = upstream.headers.get(key);
    if (val) headers.set(key, val);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export const GET = proxyMediaRequest;
export const HEAD = proxyMediaRequest;
