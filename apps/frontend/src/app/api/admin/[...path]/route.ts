import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:3001';

async function proxyAdminRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path.join('/');
  const queryString = req.nextUrl.search;
  const backendTargetUrl = `${BACKEND_URL}/api/v1/admin/${subPath}${queryString}`;

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
  const contentType = req.headers.get('content-type') || '';

  if (!['GET', 'HEAD'].includes(req.method)) {
    try {
      if (contentType.includes('multipart/form-data')) {
        // Forward raw array buffer for multipart file uploads
        body = await req.arrayBuffer();
      } else {
        const text = await req.text();
        if (text) {
          body = text;
        }
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

    const isStream = backendRes.headers.get('content-type')?.includes('image/');
    if (isStream && backendRes.body) {
      return new NextResponse(backendRes.body as any, {
        status: backendRes.status,
        headers: {
          'Content-Type': backendRes.headers.get('content-type') || 'application/octet-stream',
          'Cache-Control': backendRes.headers.get('cache-control') || 'private, max-age=3600',
        },
      });
    }

    const responseBody = await backendRes.text();
    const clientRes = new NextResponse(responseBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
    });

    backendRes.headers.forEach((val, key) => {
      if (['set-cookie', 'content-type'].includes(key.toLowerCase())) {
        clientRes.headers.set(key, val);
      }
    });

    return clientRes;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_NETWORK_ERROR',
          message: `Gagal menghubungi backend API: ${message}`,
        },
      },
      { status: 502 },
    );
  }
}

export const GET = proxyAdminRequest;
export const POST = proxyAdminRequest;
export const PATCH = proxyAdminRequest;
export const PUT = proxyAdminRequest;
export const DELETE = proxyAdminRequest;
