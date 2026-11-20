import { NextRequest, NextResponse } from 'next/server';
import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';

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

  const targetUrlObj = new URL(targetUrl);
  const hostHeader = process.env.STORAGE_PUBLIC_HOST || targetUrlObj.host;

  return new Promise<NextResponse>((resolve) => {
    const isHttps = targetUrlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options: http.RequestOptions = {
      protocol: targetUrlObj.protocol,
      hostname: targetUrlObj.hostname,
      port: targetUrlObj.port || (isHttps ? 443 : 80),
      path: targetUrlObj.pathname + targetUrlObj.search,
      method: req.method,
      headers: {
        Host: hostHeader,
      },
    };

    const upstreamReq = client.request(options, (upstreamRes) => {
      const resHeaders = new Headers();
      for (const [key, val] of Object.entries(upstreamRes.headers)) {
        if (val === undefined) continue;
        const lowerKey = key.toLowerCase();
        if (['content-type', 'cache-control', 'etag', 'last-modified', 'content-disposition', 'content-length'].includes(lowerKey)) {
          if (Array.isArray(val)) {
            val.forEach((v) => resHeaders.append(lowerKey, v));
          } else {
            resHeaders.set(lowerKey, val);
          }
        }
      }

      const webStream = Readable.toWeb(upstreamRes) as ReadableStream;

      resolve(
        new NextResponse(webStream, {
          status: upstreamRes.statusCode || 200,
          statusText: upstreamRes.statusMessage || 'OK',
          headers: resHeaders,
        })
      );
    });

    upstreamReq.on('error', (err) => {
      console.error('[MediaProxy] error:', err);
      resolve(
        new NextResponse('Internal proxy error', { status: 502 })
      );
    });

    upstreamReq.end();
  });
}

export const GET = proxyMediaRequest;
export const HEAD = proxyMediaRequest;
