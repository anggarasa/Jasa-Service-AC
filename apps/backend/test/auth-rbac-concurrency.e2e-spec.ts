import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { Roles } from '../src/modules/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Mock @fastify/cookie for Jest VM environment
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

@Controller('test-rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
class TestRbacController {
  @Get('owner-only')
  @Roles(UserRole.OWNER)
  ownerOnly() {
    return { access: 'granted', level: 'OWNER' };
  }

  @Get('admin-and-owner')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  adminAndOwner() {
    return { access: 'granted', level: 'ADMIN_OR_OWNER' };
  }

  @Get('technician-only')
  @Roles(UserRole.TECHNICIAN)
  technicianOnly() {
    return { access: 'granted', level: 'TECHNICIAN' };
  }
}

describe('Auth RBAC & Concurrency (e2e)', () => {
  let app: NestFastifyApplication;
  let ownerAccessCookie: string;
  let adminAccessCookie: string;
  let techAccessCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
      controllers: [TestRbacController],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    const fastifyCookie = require('@fastify/cookie');
    await app.register(fastifyCookie);
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Login OWNER
    const ownerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'owner@coolcare.id', password: 'OwnerSecurePass123!' },
    });
    const ownerSetCookie = ownerRes.headers['set-cookie'] as string[];
    ownerAccessCookie = (Array.isArray(ownerSetCookie) ? ownerSetCookie : [ownerSetCookie])
      .find((s) => s.startsWith('tk_ac_access='))!
      .split(';')[0];

    // Login ADMIN
    const adminRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@coolcare.id', password: 'AdminSecurePass123!' },
    });
    const adminSetCookie = adminRes.headers['set-cookie'] as string[];
    adminAccessCookie = (Array.isArray(adminSetCookie) ? adminSetCookie : [adminSetCookie])
      .find((s) => s.startsWith('tk_ac_access='))!
      .split(';')[0];

    // Login TECHNICIAN
    const techRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'technician@coolcare.id', password: 'TechSecurePass123!' },
    });
    const techSetCookie = techRes.headers['set-cookie'] as string[];
    techAccessCookie = (Array.isArray(techSetCookie) ? techSetCookie : [techSetCookie])
      .find((s) => s.startsWith('tk_ac_access='))!
      .split(';')[0];
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('RBAC Role Enforcement', () => {
    it('OWNER should access owner-only endpoint', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/test-rbac/owner-only',
        headers: { cookie: ownerAccessCookie },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).data.level).toBe('OWNER');
    });

    it('ADMIN should be rejected from owner-only endpoint with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/test-rbac/owner-only',
        headers: { cookie: adminAccessCookie },
      });
      expect(res.statusCode).toBe(403);
    });

    it('TECHNICIAN should be rejected from admin/owner endpoint with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/test-rbac/admin-and-owner',
        headers: { cookie: techAccessCookie },
      });
      expect(res.statusCode).toBe(403);
    });

    it('TECHNICIAN should access technician-only endpoint', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/test-rbac/technician-only',
        headers: { cookie: techAccessCookie },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).data.level).toBe('TECHNICIAN');
    });

    it('Unauthenticated request should be rejected with 401 Unauthorized', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/test-rbac/owner-only',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Refresh Token Rotation Concurrency & Replay', () => {
    it('should handle sequential rotation and reject replaying consumed token', async () => {
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'owner@coolcare.id', password: 'OwnerSecurePass123!' },
      });
      const setCookies = loginRes.headers['set-cookie'] as string[];
      const initialRefreshStr = (Array.isArray(setCookies) ? setCookies : [setCookies])
        .find((s) => s.startsWith('tk_ac_refresh='))!
        .split(';')[0];

      // Rotate token once
      const rotateRes1 = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { cookie: initialRefreshStr },
      });
      expect(rotateRes1.statusCode).toBe(200);

      // Attempt to REPLAY the consumed initial token -> Must fail with 401
      const replayRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { cookie: initialRefreshStr },
      });

      expect(replayRes.statusCode).toBe(401);
      const replayBody = JSON.parse(replayRes.payload);
      expect(replayBody.error.message).toContain('penggunaan ulang token');
    });
  });
});
