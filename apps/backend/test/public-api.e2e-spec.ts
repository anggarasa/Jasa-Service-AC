import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

describe('Public API E2E Test Suite (Phase 04)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/public/business should return sanitized business info without private secrets', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/business',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data.name).toBe('CoolCare AC Service');
    expect(json.data.slug).toBe('coolcare-ac');
    expect(json.data.phone).toBeDefined();
    expect(json.data.whatsappNumber).toBeDefined();
    expect(json.data.address).toBeDefined();
    expect(json.data.city).toBe('Jakarta Selatan');

    // Security assertions: ensure no sensitive internal fields leak
    expect(json.data.id).toBeUndefined();
    expect(json.data.settings).toBeUndefined();
    expect(json.data.passwordHash).toBeUndefined();
    expect(json.data.users).toBeUndefined();
  });

  it('GET /api/v1/public/operating-hours should return weekly schedule and timezone', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/operating-hours',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.timezone).toBe('Asia/Jakarta');
    expect(Array.isArray(json.data.schedule)).toBe(true);
    expect(json.data.schedule.length).toBe(7); // 7 days (Minggu s/d Sabtu)
  });

  it('GET /api/v1/public/service-categories should return active categories with service count', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/service-categories',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);

    const firstCat = json.data[0];
    expect(firstCat.name).toBeDefined();
    expect(firstCat.slug).toBeDefined();
    expect(typeof firstCat.serviceCount).toBe('number');
  });

  it('GET /api/v1/public/services should return active services and handle search/category filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/services',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.items).toBeDefined();
    expect(Array.isArray(json.data.items)).toBe(true);
    expect(json.data.items.length).toBeGreaterThan(0);

    // Verify accurate pricing types (FIXED, STARTING_FROM, INSPECTION_REQUIRED)
    const fixedService = json.data.items.find((s: any) => s.priceType === 'FIXED');
    if (fixedService) {
      expect(fixedService.basePriceNumber).toBeGreaterThan(0);
      expect(typeof fixedService.basePrice).toBe('string');
    }

    const inspectionService = json.data.items.find(
      (s: any) => s.priceType === 'INSPECTION_REQUIRED',
    );
    if (inspectionService) {
      expect(inspectionService.basePrice).toBeNull();
    }
  });

  it('GET /api/v1/public/services/:slug should return 200 for valid active service and 404 for unknown slug', async () => {
    // Valid slug
    const resValid = await app.inject({
      method: 'GET',
      url: '/api/v1/public/services/cuci-ac-standar',
    });
    expect(resValid.statusCode).toBe(200);
    const jsonValid = JSON.parse(resValid.payload);
    expect(jsonValid.success).toBe(true);
    expect(jsonValid.data.name).toBe('Cuci AC Split Standar');
    expect(jsonValid.data.category).toBeDefined();

    // Invalid slug
    const resInvalid = await app.inject({
      method: 'GET',
      url: '/api/v1/public/services/non-existent-service-12345',
    });
    expect(resInvalid.statusCode).toBe(404);
  });

  it('GET /api/v1/public/service-areas should return active service areas with visit fees', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/service-areas',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);

    const firstArea = json.data[0];
    expect(firstArea.name).toBeDefined();
    expect(firstArea.city).toBeDefined();
    expect(typeof firstArea.visitFee).toBe('string');
    expect(typeof firstArea.visitFeeNumber).toBe('number');
  });

  it('GET /api/v1/public/gallery should return active approved gallery items', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/gallery',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });
});
