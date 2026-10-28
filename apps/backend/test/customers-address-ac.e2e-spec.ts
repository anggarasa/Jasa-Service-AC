import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

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

describe('Phase 05 — Customer, Service Address & AC Unit Management E2E Test Suite', () => {
  let app: NestFastifyApplication;
  let ownerToken: string;
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

  it('1. TECHNICIAN is denied access to customer directory (403 Forbidden)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/customers',
      headers: {
        authorization: `Bearer ${techToken}`,
      },
    });
    expect(res.statusCode).toBe(403);
  });

  let customer1Id: string;
  let customer2Id: string;
  let address1Id: string;
  let address2Id: string;
  let customer2AddressId: string;
  let acUnit1Id: string;
  let acUnit2Id: string;
  let acUnit3Id: string;

  it('2. OWNER creates Customer 1 with phone normalization and unique customerCode', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/customers',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        name: 'Budi Santoso',
        phone: '0812-3456-7890',
        email: 'budi@example.com',
        notes: 'Pelanggan residensial setia',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.customerCode).toMatch(/^CUS-\d{6}$/);
    expect(body.data.normalizedPhone).toBe('+6281234567890');
    expect(body.data.displayPhone).toBe('0812-3456-7890');
    customer1Id = body.data.id;
  });

  it('3. Check duplicate endpoint detects potential duplicate phone number', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/customers/check-duplicate?phone=+6281234567890',
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.isDuplicateCandidate).toBe(true);
    expect(body.data.candidates.length).toBeGreaterThan(0);
    expect(body.data.candidates[0].name).toBe('Budi Santoso');
  });

  it('4. Create Customer 2 with same family phone without crashing or silent merge', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/customers',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        name: 'Siti Rahma (Istri Budi)',
        phone: '081234567890',
        email: 'siti@example.com',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.id).not.toBe(customer1Id);
    expect(body.data.customerCode).not.toBe('');
    customer2Id = body.data.id;

    // Create an address for customer 2 for cross-customer relationship tests
    const addrRes = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer2Id}/addresses`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        label: 'Rumah Siti',
        fullAddress: 'Jl. Melati No. 12',
        city: 'Jakarta Selatan',
        district: 'Cilandak',
      },
    });
    expect(addrRes.statusCode).toBe(201);
    customer2AddressId = JSON.parse(addrRes.body).data.id;
  });

  it('5. Add Address 1 (Home) for Customer 1 -> automatically primary', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/addresses`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        label: 'Rumah',
        fullAddress: 'Jl. Senopati No. 45, Kebayoran Baru',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
        recipientName: 'Budi Santoso',
        recipientPhone: '081234567890',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.isPrimary).toBe(true);
    address1Id = body.data.id;
  });

  it('6. Add Address 2 (Office) for Customer 1 -> default not primary', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/addresses`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        label: 'Kantor',
        fullAddress: 'Gedung Wisma Sudirman Lt. 8, Setiabudi',
        city: 'Jakarta Selatan',
        district: 'Setiabudi',
        isPrimary: false,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.isPrimary).toBe(false);
    address2Id = body.data.id;
  });

  it('7. Set Address 2 as Primary -> Address 1 is demoted, exactly 1 active primary', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/addresses/${address2Id}/set-primary`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.isPrimary).toBe(true);

    // Verify Address 1 is now false
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/customers/${customer1Id}/addresses`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    const addresses = JSON.parse(listRes.body).data;
    const primaryCount = addresses.filter((a: any) => a.isPrimary).length;
    expect(primaryCount).toBe(1);
    const addr1 = addresses.find((a: any) => a.id === address1Id);
    expect(addr1.isPrimary).toBe(false);
  });

  it('8. Validate service area endpoint', async () => {
    // Valid covered area (seeded: Kebayoran Baru)
    const validRes = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/addresses/validate-area`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
      },
    });
    expect(validRes.statusCode).toBe(200);
    const validBody = JSON.parse(validRes.body).data;
    expect(validBody.serviceable).toBe(true);
    expect(validBody.status).toBe('SERVICEABLE');

    // Unverified area
    const unverifiedRes = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/addresses/validate-area`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        city: 'Surabaya',
        district: 'Wonokromo',
      },
    });
    expect(unverifiedRes.statusCode).toBe(200);
    const unverifiedBody = JSON.parse(unverifiedRes.body).data;
    expect(unverifiedBody.serviceable).toBe(false);
    expect(unverifiedBody.status).toBe('UNVERIFIED');
  });

  it('9. Create AC Unit 1 (Daikin 1 PK Split) at Address 1', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/ac-units`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        customerAddressId: address1Id,
        unitLabel: 'AC Kamar Utama',
        brand: 'Daikin',
        model: 'FTKQ25UVM4',
        type: 'SPLIT',
        capacityPk: '1',
        installationRoom: 'Kamar Utama',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.unitCode).toMatch(/^AC-\d{6}$/);
    expect(body.data.capacityPk).toBe('1');
    acUnit1Id = body.data.id;
  });

  it('10. Create AC Unit 2 (Panasonic 0.5 PK Split) at Address 1 with fractional PK', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/ac-units`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        customerAddressId: address1Id,
        unitLabel: 'AC Kamar Anak',
        brand: 'Panasonic',
        type: 'SPLIT',
        capacityPk: '0.5',
        installationRoom: 'Kamar Anak',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.capacityPk).toBe('0.5');
    acUnit2Id = body.data.id;
  });

  it('11. Create AC Unit 3 (LG 2 PK Cassette) at Address 2', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/ac-units`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        customerAddressId: address2Id,
        unitLabel: 'AC Ruang Kerja',
        brand: 'LG',
        type: 'CASSETTE',
        capacityPk: '2',
        installationRoom: 'Lantai 8',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.type).toBe('CASSETTE');
    acUnit3Id = body.data.id;
  });

  it('12. Attempt to create AC unit using address of another customer is rejected (400 Bad Request)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/customers/${customer1Id}/ac-units`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        customerAddressId: customer2AddressId, // Belongs to Customer 2!
        unitLabel: 'AC Ilegal Cross-Customer',
        brand: 'Sharp',
        capacityPk: '1',
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('13. Move AC Unit 1 from Address 1 to Address 2 (same customer) succeeds', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/ac-units/${acUnit1Id}/move-address`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        newCustomerAddressId: address2Id,
        newInstallationRoom: 'Ruang Direktur',
        notes: 'Dipindahkan karena kantor baru butuh AC tambahan',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.customerAddressId).toBe(address2Id);
    expect(body.data.installationRoom).toBe('Ruang Direktur');
  });

  it('14. Attempt to move AC unit to address of another customer is rejected (400 Bad Request)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/ac-units/${acUnit1Id}/move-address`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        newCustomerAddressId: customer2AddressId, // Belongs to Customer 2!
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('15. Archiving Address 2 (primary) automatically reassigns primary to Address 1', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/customers/${customer1Id}/addresses/${address2Id}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);

    // Verify Address 1 is now auto-promoted back to primary
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/customers/${customer1Id}/addresses`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    const addresses = JSON.parse(listRes.body).data;
    expect(addresses.length).toBe(1);
    expect(addresses[0].id).toBe(address1Id);
    expect(addresses[0].isPrimary).toBe(true);
  });

  it('16. Archive AC Unit 2 preserves record with isActive: false', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/ac-units/${acUnit2Id}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/ac-units/${acUnit2Id}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    const body = JSON.parse(getRes.body);
    expect(body.data.isActive).toBe(false);
  });

  it('17. Customer history returns empty state without fake data', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/customers/${customer1Id}/history`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.totalBookings).toBe(0);
    expect(body.data.bookings).toEqual([]);
    expect(body.data.lastServiceDate).toBeNull();
  });

  it('18. Customer directory listing with search and pagination', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/customers?search=Budi&status=active&page=1&limit=10',
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.data.some((c: any) => c.name.includes('Budi'))).toBe(true);
    expect(body.data.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('19. Global AC directory listing with search and filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/ac-units?brand=Daikin&status=active',
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.data.every((u: any) => u.brand.toLowerCase() === 'daikin')).toBe(true);
  });
});
