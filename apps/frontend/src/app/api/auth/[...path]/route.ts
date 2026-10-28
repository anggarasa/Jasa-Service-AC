import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:3001';

async function proxyAuthRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path.join('/');
  const backendTargetUrl = `${BACKEND_URL}/api/v1/auth/${subPath}`;

  // Forward incoming headers
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Avoid forwarding host or next-specific headers
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
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
      redirect: 'manual',
    });

    const responseBody = await backendRes.text();
    const clientRes = new NextResponse(responseBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
    });

    // Copy backend headers
    backendRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== 'set-cookie' && lower !== 'transfer-encoding') {
        clientRes.headers.set(key, value);
      }
    });

    // Forward Set-Cookie headers properly (Next.js supports getSetCookie())
    const setCookies =
      typeof backendRes.headers.getSetCookie === 'function'
        ? backendRes.headers.getSetCookie()
        : backendRes.headers.get('set-cookie')
        ? [backendRes.headers.get('set-cookie')!]
        : [];

    for (const cookieStr of setCookies) {
      clientRes.headers.append('set-cookie', cookieStr);
    }

    return clientRes;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backend connection error';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_GATEWAY_ERROR',
          message: `Gagal menghubungi backend autentikasi: ${msg}`,
        },
      },
      { status: 502 },
    );
  }
}

export const GET = proxyAuthRequest;
export const POST = proxyAuthRequest;
export const PATCH = proxyAuthRequest;
export const DELETE = proxyAuthRequest;
export const OPTIONS = proxyAuthRequest;
