import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

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

describe('Admin Bookings & Work Orders Management E2E Test Suite (Phase 08)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let techToken: string;
  let serviceId: string;
  let serviceAreaId: string;
  let technician1Id: string;
  let testBookingId: string;
  let testWorkOrderId: string;

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

    prisma = app.get(PrismaService);

    // Clean up test bookings and work orders
    await prisma.workOrderStatusHistory.deleteMany({
      where: { workOrder: { workOrderNumber: { startsWith: 'WO-TEST-' } } },
    });
    await prisma.workOrderAssignmentHistory.deleteMany({
      where: { workOrder: { workOrderNumber: { startsWith: 'WO-TEST-' } } },
    });
    await prisma.workOrderItem.deleteMany({
      where: { workOrder: { workOrderNumber: { startsWith: 'WO-TEST-' } } },
    });
    await prisma.workOrder.deleteMany({
      where: { workOrderNumber: { startsWith: 'WO-TEST-' } },
    });
    await prisma.bookingAuditLog.deleteMany({
      where: { booking: { bookingCode: { startsWith: 'ACB-TEST-' } } },
    });

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

    // Seed/Find fixtures
    const business = await prisma.business.findFirst({ where: { slug: 'coolcare-ac' } });
    const service = await prisma.service.findFirst({ where: { businessId: business!.id, isActive: true } });
    serviceId = service!.id;
    const area = await prisma.serviceArea.findFirst({ where: { businessId: business!.id, isActive: true } });
    serviceAreaId = area!.id;
    const tech = await prisma.technician.findFirst({ where: { businessId: business!.id, isActive: true } });
    technician1Id = tech!.id;
  });

  afterAll(async () => {
    // Cleanup created test booking and work orders
    if (testBookingId) {
      await prisma.workOrderStatusHistory.deleteMany({ where: { workOrder: { bookingId: testBookingId } } });
      await prisma.workOrderAssignmentHistory.deleteMany({ where: { workOrder: { bookingId: testBookingId } } });
      await prisma.workOrderItem.deleteMany({ where: { workOrder: { bookingId: testBookingId } } });
      await prisma.workOrder.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.bookingAuditLog.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.bookingItem.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.resourceOccupancy.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    await app.close();
  });

  it('1. TECHNICIAN is denied access to admin bookings list (403 Forbidden)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/bookings',
      headers: { authorization: `Bearer ${techToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('2. OWNER can view Dashboard Overview metrics and appointments', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/overview',
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.metrics).toBeDefined();
    expect(typeof body.data.metrics.totalBookingsToday).toBe('number');
    expect(typeof body.data.metrics.activeTechnicians).toBe('number');
    expect(Array.isArray(body.data.todayAppointments)).toBe(true);
  });

  it('3. OWNER can create manual booking via admin API', async () => {
    const targetDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days in future
    targetDate.setHours(10, 0, 0, 0);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/bookings',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        serviceId,
        serviceAreaId,
        selectedStartAt: targetDate.toISOString(),
        customerName: 'Ibu Rahmawati Admin Test',
        customerPhone: '081299887766',
        customerEmail: 'rahma.test@example.com',
        serviceAddress: {
          fullAddress: 'Jl. Senopati Raya No. 45',
          city: 'Jakarta Selatan',
          district: 'Kebayoran Baru',
          province: 'DKI Jakarta',
        },
        units: [
          {
            brand: 'Daikin',
            type: 'SPLIT',
            capacityPk: '1',
            installationRoom: 'Kamar Utama',
            notes: 'Unit AC kurang dingin',
          },
        ],
        status: 'PENDING',
        internalNotes: 'Pemesanan via telepon customer service',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.status).toBe('PENDING');
    expect(body.data.bookingSource).toBe('ADMIN_MANUAL');

    testBookingId = body.data.id;
  });

  it('4. OWNER can list bookings with pagination and filters', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/bookings?page=1&limit=10&search=Rahmawati',
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('5. OWNER can get detailed booking information including snapshots and audit logs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/bookings/${testBookingId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.id).toBe(testBookingId);
    expect(body.data.customer).toBeDefined();
    expect(body.data.bookingItems.length).toBe(1);
    expect(body.data.auditLogs.length).toBeGreaterThanOrEqual(1);
  });

  it('6. OWNER can confirm PENDING booking and update internal notes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/bookings/${testBookingId}/confirm`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        internalNotes: 'Sudah dihubungi dan setuju dengan waktu yang dijadwalkan.',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe('CONFIRMED');
    expect(body.data.internalNotes).toContain('Sudah dihubungi');
  });

  it('7. OWNER can assign a technician to the booking', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/bookings/${testBookingId}/assign-technician`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        technicianId: technician1Id,
        notes: 'Bawa tangga lipat dan alat steam tekanan tinggi',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe('ASSIGNED');
    expect(body.data.technicianId).toBe(technician1Id);
  });

  it('8. OWNER can reschedule the booking to a new time slot', async () => {
    const newDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    newDate.setHours(14, 0, 0, 0);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/bookings/${testBookingId}/reschedule`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        newStartAt: newDate.toISOString(),
        technicianId: technician1Id,
        reason: 'Permintaan pelanggan karena sedang ada acara keluarga di pagi hari',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.rescheduleCount).toBe(1);
  });

  it('9. OWNER can view admin calendar events', async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/bookings/calendar?startDate=${startDate.toISOString().slice(0, 10)}&endDate=${endDate.toISOString().slice(0, 10)}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('10. OWNER can view technician daily schedule and capacity', async () => {
    const targetDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/technicians/schedule?date=${targetDate}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('11. OWNER can create a Work Order (SPK) from the assigned booking', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/work-orders',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        bookingId: testBookingId,
        technicianId: technician1Id,
        adminInstructions: 'Pastikan cek tekanan freon sebelum dan sesudah cuci AC',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.workOrderNumber).toMatch(/^WO-\d{8}-\d{4}$/);
    expect(body.data.technicianId).toBe(technician1Id);

    testWorkOrderId = body.data.id;
  });

  it('12. Prevents creating a duplicate Work Order for the same booking (409 Conflict)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/work-orders',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        bookingId: testBookingId,
      },
    });

    expect(res.statusCode).toBe(409);
  });

  it('13. OWNER can list Work Orders and view Work Order detail', async () => {
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/work-orders?page=1&limit=10',
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    expect(listRes.statusCode).toBe(200);

    const detailRes = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/work-orders/${testWorkOrderId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    expect(detailRes.statusCode).toBe(200);
    const detailBody = JSON.parse(detailRes.body);
    expect(detailBody.data.id).toBe(testWorkOrderId);
    expect(detailBody.data.items.length).toBeGreaterThanOrEqual(1);
  });

  it('14. OWNER can update Work Order status and record field diagnosis', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/work-orders/${testWorkOrderId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        status: 'IN_PROGRESS',
        diagnosis: 'Tekanan freon R32 normal 140 psi, evaporator kotor berlendir tebal',
        technicianNotes: 'Sedang dilakukan pencucian menggunakan plastik cover dan pompa steam',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe('IN_PROGRESS');
    expect(body.data.diagnosis).toContain('140 psi');

    // Verify booking status was synchronized to IN_PROGRESS
    const booking = await prisma.booking.findUnique({ where: { id: testBookingId } });
    expect(booking?.status).toBe('IN_PROGRESS');
  });

  it('15. OWNER can cancel a booking, which safely cascades cancellation to linked work order and occupancies', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/bookings/${testBookingId}/cancel`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        reason: 'Pelanggan membatalkan pesanan karena pindah domisili',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe('CANCELLED');

    // Verify work order was cancelled
    const wo = await prisma.workOrder.findUnique({ where: { id: testWorkOrderId } });
    expect(wo?.status).toBe('CANCELLED');

    // Verify occupancy was cancelled
    const occs = await prisma.resourceOccupancy.findMany({ where: { bookingId: testBookingId } });
    expect(occs.every((o) => o.status === 'CANCELLED')).toBe(true);
  });
});
