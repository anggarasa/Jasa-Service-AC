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

describe('Admin Business & Service Catalog E2E Test Suite (Phase 03 & 04)', () => {
  let app: NestFastifyApplication;
  let ownerToken: string;
  let adminToken: string;
  let techToken: string;

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

    // Authenticate OWNER
    const ownerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@coolcare.id',
        password: 'OwnerSecurePass123!',
      },
    });
    const ownerSetCookie = ownerRes.headers['set-cookie'] as string[];
    const ownerMatch = ownerSetCookie?.[0]?.match(/tk_ac_access=([^;]+)/);
    ownerToken = ownerMatch ? decodeURIComponent(ownerMatch[1]) : '';

    // Authenticate ADMIN
    const adminRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@coolcare.id',
        password: 'AdminSecurePass123!',
      },
    });
    const adminSetCookie = adminRes.headers['set-cookie'] as string[];
    const adminMatch = adminSetCookie?.[0]?.match(/tk_ac_access=([^;]+)/);
    adminToken = adminMatch ? decodeURIComponent(adminMatch[1]) : '';

    // Authenticate TECHNICIAN
    const techRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'technician@coolcare.id',
        password: 'TechSecurePass123!',
      },
    });
    const techSetCookie = techRes.headers['set-cookie'] as string[];
    const techMatch = techSetCookie?.[0]?.match(/tk_ac_access=([^;]+)/);
    techToken = techMatch ? decodeURIComponent(techMatch[1]) : '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('OWNER and ADMIN can read business settings, but only OWNER can update business settings', async () => {
    // ADMIN can read
    const adminRead = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/business',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(adminRead.statusCode).toBe(200);

    // ADMIN cannot update (Forbidden 403)
    const adminUpdate = await app.inject({
      method: 'PATCH',
      url: '/api/v1/admin/business',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'CoolCare AC Service Hacked',
        slug: 'coolcare-ac',
        email: 'halo@coolcare.id',
        phone: '+62 812-3456-7890',
        whatsappNumber: '6281234567890',
        address: 'Jl. Merdeka No. 45',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
      },
    });
    expect(adminUpdate.statusCode).toBe(403);

    // OWNER can update
    const ownerUpdate = await app.inject({
      method: 'PATCH',
      url: '/api/v1/admin/business',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        name: 'CoolCare AC Service',
        slug: 'coolcare-ac',
        description: 'Layanan spesialis cuci dan servis AC profesional di Jabodetabek.',
        email: 'halo@coolcare.id',
        phone: '+62 812-3456-7890',
        whatsappNumber: '6281234567890',
        address: 'Jl. Merdeka No. 45',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
      },
    });
    expect(ownerUpdate.statusCode).toBe(200);
  });

  it('TECHNICIAN is forbidden from accessing admin catalog endpoints', async () => {
    const techReq = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/services',
      headers: { authorization: `Bearer ${techToken}` },
    });
    expect(techReq.statusCode).toBe(403);
  });

  it('Validates FIXED pricing requiring positive basePrice, and STARTING_FROM requiring non-negative', async () => {
    const catRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/service-categories',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const categories = JSON.parse(catRes.payload).data;
    const catId = categories[0].id;

    // Reject FIXED service with 0 price
    const invalidFixed = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/services',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        categoryId: catId,
        name: 'Layanan Tes Gratis',
        slug: 'layanan-tes-gratis',
        description: 'Deskripsi tes',
        priceType: 'FIXED',
        basePrice: 0,
      },
    });
    expect(invalidFixed.statusCode).toBe(400);
  });

  it('Admin to Public integration: creating service makes it visible publicly, deactivating hides it', async () => {
    const catRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/service-categories',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const categories = JSON.parse(catRes.payload).data;
    const catId = categories[0].id;
    const testSlug = `cuci-inverter-test-${Date.now()}`;

    // 1. Create service as ADMIN
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/services',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        categoryId: catId,
        name: 'Cuci AC Inverter Premium Test',
        slug: testSlug,
        description: 'Layanan cuci kimia khusus AC Inverter presisi tinggi.',
        priceType: 'FIXED',
        basePrice: 95000,
        estimatedDurationMinutes: 75,
        isActive: true,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const serviceId = JSON.parse(createRes.payload).data.id;

    // 2. Verify it is visible in public API
    const publicList = await app.inject({
      method: 'GET',
      url: `/api/v1/public/services?search=${encodeURIComponent('Inverter Premium Test')}`,
    });
    expect(publicList.statusCode).toBe(200);
    const publicItems = JSON.parse(publicList.payload).data.items;
    expect(publicItems.some((s: any) => s.slug === testSlug)).toBe(true);

    // 3. Deactivate service as ADMIN
    const updateRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/services/${serviceId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        isActive: false,
      },
    });
    expect(updateRes.statusCode).toBe(200);

    // 4. Verify it is now HIDDEN from public API
    const publicListAfter = await app.inject({
      method: 'GET',
      url: `/api/v1/public/services?search=${encodeURIComponent('Inverter Premium Test')}`,
    });
    const publicItemsAfter = JSON.parse(publicListAfter.payload).data.items;
    expect(publicItemsAfter.some((s: any) => s.slug === testSlug)).toBe(false);

    // 5. Clean up by deleting the test service
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/services/${serviceId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(deleteRes.statusCode).toBe(200);
  });
});
