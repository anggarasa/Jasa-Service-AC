import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:3001';

async function proxyPublicRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path.join('/');
  const queryString = req.nextUrl.search;
  const backendTargetUrl = `${BACKEND_URL}/api/v1/public/${subPath}${queryString}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  headers.set('x-forwarded-for', ip);

  let body: BodyInit | null = null;
  if (!['GET', 'HEAD'].includes(req.method)) {
    try {
      const text = await req.text();
      if (text) {
        body = text;
      }
    } catch {
      body = null;
    }
  }

  try {
    const backendRes = await fetch(backendTargetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const resContentType = backendRes.headers.get('content-type') || '';
    const resHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      resHeaders.set(key, val);
    });

    if (resContentType.includes('application/json')) {
      const data = await backendRes.json();
      return NextResponse.json(data, {
        status: backendRes.status,
        headers: resHeaders,
      });
    }

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: `Gagal terhubung ke server backend publik: ${message}`,
        },
      },
      { status: 502 },
    );
  }
}

export const GET = proxyPublicRequest;
export const POST = proxyPublicRequest;
export const PATCH = proxyPublicRequest;
export const DELETE = proxyPublicRequest;
