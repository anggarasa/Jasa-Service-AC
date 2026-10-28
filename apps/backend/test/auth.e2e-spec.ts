import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

// Mock @fastify/cookie for Jest VM environment to prevent dynamic import callback crash
jest.mock('@fastify/cookie', () => {
  const fp = require('fastify-plugin');
  return fp(async (fastify: any) => {
    fastify.decorateRequest('cookies', null);
    fastify.addHook('onRequest', async (req: any) => {
      const raw = req.headers.cookie || '';
      const cookies: Record<string, string> = {};
      raw.split(';').forEach((part: string) => {
        const [k, ...vParts] = part.trim().split('=');
        if (k) cookies[k] = decodeURIComponent(vParts.join('='));
      });
      req.cookies = cookies;
    });

    fastify.decorateReply('setCookie', function (name: string, value: string, options: any) {
      const cookieStr = `${name}=${encodeURIComponent(value)}; Path=${options?.path || '/'}${
        options?.httpOnly ? '; HttpOnly' : ''
      }`;
      const existing = this.getHeader('set-cookie');
      if (existing) {
        const arr = Array.isArray(existing) ? existing : [existing];
        this.header('set-cookie', [...arr, cookieStr]);
      } else {
        this.header('set-cookie', cookieStr);
      }
      return this;
    });

    fastify.decorateReply('clearCookie', function (name: string, options: any) {
      const cookieStr = `${name}=; Path=${options?.path || '/'}; Max-Age=0`;
      const existing = this.getHeader('set-cookie');
      if (existing) {
        const arr = Array.isArray(existing) ? existing : [existing];
        this.header('set-cookie', [...arr, cookieStr]);
      } else {
        this.header('set-cookie', cookieStr);
      }
      return this;
    });
  });
});

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;
  let ownerAccessCookie: string;
  let ownerRefreshCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    const fastifyCookie = require('@fastify/cookie');
    await app.register(fastifyCookie);
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/auth/login (POST) - should login OWNER and set HttpOnly cookies', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@coolcare.id',
        password: 'OwnerSecurePass123!',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('owner@coolcare.id');
    expect(body.data.user.role).toBe('OWNER');

    // Verify Set-Cookie headers
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();

    const cookieStrings = Array.isArray(setCookie) ? setCookie : [setCookie as string];
    const accessStr = cookieStrings.find((s) => s.startsWith('tk_ac_access='));
    const refreshStr = cookieStrings.find((s) => s.startsWith('tk_ac_refresh='));

    expect(accessStr).toBeDefined();
    expect(accessStr).toContain('HttpOnly');
    expect(refreshStr).toBeDefined();
    expect(refreshStr).toContain('HttpOnly');

    const accessVal = accessStr?.split(';')[0];
    const refreshVal = refreshStr?.split(';')[0];

    ownerAccessCookie = accessVal!;
    ownerRefreshCookie = refreshVal!;
  });

  it('/api/v1/auth/login (POST) - should reject invalid credentials with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@coolcare.id',
        password: 'WrongPassword456!',
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('Email atau password tidak sesuai');
  });

  it('/api/v1/auth/me (GET) - should return authenticated profile when cookie is provided', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        cookie: ownerAccessCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('owner@coolcare.id');
    expect(body.data.role).toBe('OWNER');
  });

  it('/api/v1/auth/me (GET) - should reject unauthenticated request with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(res.statusCode).toBe(401);
  });

  it('/api/v1/auth/refresh (POST) - should rotate token and return new cookies', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      headers: {
        cookie: ownerRefreshCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();

    const cookieStrings = Array.isArray(setCookie) ? setCookie : [setCookie as string];
    const newAccess = cookieStrings.find((s) => s.startsWith('tk_ac_access='));
    const newRefresh = cookieStrings.find((s) => s.startsWith('tk_ac_refresh='));

    expect(newAccess).toBeDefined();
    expect(newRefresh).toBeDefined();

    ownerAccessCookie = newAccess?.split(';')[0]!;
    ownerRefreshCookie = newRefresh?.split(';')[0]!;
  });

  it('/api/v1/auth/sessions (GET) - should return active sessions list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/sessions',
      headers: {
        cookie: ownerAccessCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.sessions)).toBe(true);
    expect(body.data.sessions.length).toBeGreaterThan(0);
    expect(body.data.sessions.some((s: any) => s.isCurrent)).toBe(true);
  });

  it('/api/v1/auth/profile (PATCH) - should update user display name', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/auth/profile',
      headers: {
        cookie: ownerAccessCookie,
      },
      payload: {
        name: 'Owner CoolCare Update',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Owner CoolCare Update');
  });

  it('/api/v1/auth/logout (POST) - should logout and revoke active session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: {
        cookie: ownerAccessCookie,
      },
    });

    expect(res.statusCode).toBe(200);

    // After logout, accessing protected endpoint with old cookie must fail immediately
    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        cookie: ownerAccessCookie,
      },
    });

    expect(meRes.statusCode).toBe(401);
  });
});
