import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import {
  BookingStatus,
  ChecklistItemStatus,
  InspectionStatus,
  UserRole,
  WorkOrderStatus,
} from '@prisma/client';

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

describe('Technician Workspace & Field Service Execution E2E Test Suite (Phase 09)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let techToken: string;
  let ownerToken: string;
  let testTechnicianId: string;
  let testBusinessId: string;
  let testWorkOrderId: string;
  let testWorkOrderItemId: string;
  let testBookingId: string;

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

    const business = await prisma.business.findFirst({ where: { slug: 'coolcare-ac' } });
    testBusinessId = business!.id;

    const tech = await prisma.technician.findFirst({
      where: { businessId: testBusinessId, isActive: true },
    });
    testTechnicianId = tech!.id;

    const customer = await prisma.customer.findFirst({
      where: { businessId: testBusinessId },
      include: { addresses: true, acUnits: true },
    });
    const service = await prisma.service.findFirst({
      where: { businessId: testBusinessId, isActive: true },
    });

    // Create a dedicated test booking
    const bookingCode = `ACB-P9-${Date.now()}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow.getTime() + 2 * 3600 * 1000);

    const booking = await prisma.booking.create({
      data: {
        businessId: testBusinessId,
        customerId: customer!.id,
        customerAddressId: customer!.addresses[0].id,
        serviceId: service!.id,
        technicianId: testTechnicianId,
        bookingCode,
        status: BookingStatus.ASSIGNED,
        scheduledStartAt: tomorrow,
        scheduledEndAt: tomorrowEnd,
        serviceNameSnapshot: service!.name,
        unitCount: 1,
        estimatedTotal: 150000,
      },
    });
    testBookingId = booking.id;

    // Create dedicated test work order
    const wo = await prisma.workOrder.create({
      data: {
        businessId: testBusinessId,
        bookingId: booking.id,
        customerId: customer!.id,
        customerAddressId: customer!.addresses[0].id,
        technicianId: testTechnicianId,
        workOrderNumber: `WO-P9-${Date.now()}`,
        status: WorkOrderStatus.ASSIGNED,
        scheduledStartAt: tomorrow,
        scheduledEndAt: tomorrowEnd,
      },
    });
    testWorkOrderId = wo.id;

    // Create work order item
    const woItem = await prisma.workOrderItem.create({
      data: {
        workOrderId: wo.id,
        acUnitId: customer!.acUnits[0]?.id || null,
        serviceId: service!.id,
        serviceNameSnapshot: service!.name,
        unitPriceSnapshot: 150000,
        quantity: 1,
        itemTotal: 150000,
      },
    });
    testWorkOrderItemId = woItem.id;
  });

  afterAll(async () => {
    // Cleanup test artifacts
    if (testWorkOrderId) {
      await prisma.workOrderServiceReport.deleteMany({ where: { workOrderId: testWorkOrderId } });
      await prisma.workOrderChecklistItem.deleteMany({ where: { workOrderId: testWorkOrderId } });
      await prisma.workOrderUnitInspection.deleteMany({ where: { workOrderId: testWorkOrderId } });
      await prisma.workOrderPhoto.deleteMany({ where: { workOrderId: testWorkOrderId } });
      await prisma.workOrderStatusHistory.deleteMany({ where: { workOrderId: testWorkOrderId } });
      await prisma.workOrderItem.deleteMany({ where: { workOrderId: testWorkOrderId } });
      await prisma.workOrder.deleteMany({ where: { id: testWorkOrderId } });
    }
    if (testBookingId && prisma) {
      await prisma.bookingAuditLog.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. Technician Dashboard & Scoped Listing (IDOR Protection)', () => {
    it('technician should access their dashboard successfully', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/technician/dashboard',
        headers: {
          authorization: `Bearer ${techToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.technician).toBeDefined();
      expect(body.data.metrics).toBeDefined();
      expect(typeof body.data.metrics.activeTotal).toBe('number');
    });

    it('non-technician (OWNER) should be rejected with 403 on technician dashboard', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/technician/dashboard',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it('technician should list work orders assigned to them', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/technician/work-orders',
        headers: {
          authorization: `Bearer ${techToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.items)).toBe(true);
      const found = body.data.items.find((item: any) => item.id === testWorkOrderId);
      expect(found).toBeDefined();
    });

    it('technician should load work order detail and auto-initialize checklist', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(testWorkOrderId);
      expect(body.data.customer).toBeDefined();
      expect(body.data.items.length).toBeGreaterThan(0);
      // Verify checklist items were initialized
      expect(body.data.items[0].checklistItems.length).toBeGreaterThan(0);
    });
  });

  describe('2. Work Order Status Machine Progression', () => {
    it('technician starts journey (ASSIGNED -> ON_THE_WAY)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}/start-journey`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe(WorkOrderStatus.ON_THE_WAY);
    });

    it('technician checks in arrival (ON_THE_WAY -> ARRIVED)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}/arrive`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
        payload: {
          notes: 'Sudah sampai di depan gerbang rumah pelanggan',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe(WorkOrderStatus.ARRIVED);
      expect(body.data.arrivedAt).toBeDefined();
    });

    it('technician starts work execution (ARRIVED -> IN_PROGRESS)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}/start`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
        payload: {
          notes: 'Mulai pengerjaan pencucian AC indoor dan outdoor',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(body.data.startedAt).toBeDefined();

      // Verify linked booking was synced to IN_PROGRESS
      const booking = await prisma.booking.findUnique({ where: { id: testBookingId } });
      expect(booking?.status).toBe(BookingStatus.IN_PROGRESS);
    });
  });

  describe('3. Unit Inspection & Checklist Execution', () => {
    it('technician saves unit inspection details', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}/items/${testWorkOrderItemId}/inspection`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
        payload: {
          inspectionStatus: InspectionStatus.GOOD,
          reportedComplaint: 'AC kurang dingin di siang hari',
          observedCondition: 'Filter sangat kotor dan berdebu',
          diagnosis: 'Penurunan sirkulasi udara akibat penumpukan debu',
          recommendedAction: 'Cuci steam indoor dan outdoor unit',
          requiresFollowUp: false,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.inspectionStatus).toBe(InspectionStatus.GOOD);
      expect(body.data.workOrderItemId).toBe(testWorkOrderItemId);
    });

    it('technician updates checklist items to DONE', async () => {
      // Get detail to fetch checklist item IDs
      const detailRes = await app.inject({
        method: 'GET',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
      });
      const detail = JSON.parse(detailRes.payload).data;
      const checklistItems = detail.items[0].checklistItems;
      expect(checklistItems.length).toBeGreaterThan(0);

      for (const item of checklistItems) {
        const checkRes = await app.inject({
          method: 'PUT',
          url: `/api/v1/technician/work-orders/${testWorkOrderId}/checklist/${item.id}`,
          headers: {
            authorization: `Bearer ${techToken}`,
          },
          payload: {
            status: ChecklistItemStatus.DONE,
            notes: 'Pemeriksaan normal',
          },
        });
        expect(checkRes.statusCode).toBe(200);
        const checkBody = JSON.parse(checkRes.payload);
        expect(checkBody.data.status).toBe(ChecklistItemStatus.DONE);
      }
    });
  });

  describe('4. Service Report & Validation Gate on Completion', () => {
    it('attempting to complete without service report should fail with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}/complete`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
        payload: {
          technicianNotes: 'Servis selesai',
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error?.message || body.message).toContain('Laporan servis');
    });

    it('technician saves service report', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}/report`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
        payload: {
          summary: 'Servis cuci AC 1 unit telah selesai dilakukan',
          workPerformed: 'Pencucian indoor, pembersihan kondensor outdoor, pengecekan freon dan arus listrik kompresor',
          issuesFound: 'Tidak ada kerusakan komponen, hanya kotor',
          recommendations: 'Disarankan cuci berkala setiap 3 bulan sekali',
          customerSignedName: 'Bapak Ahmad',
          technicianSignedName: 'Budi Santoso',
          isCompleted: true,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.summary).toContain('Servis cuci AC');
    });

    it('technician completes work order successfully', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${testWorkOrderId}/complete`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
        payload: {
          technicianNotes: 'Pelanggan puas dengan hasil dingin AC',
          customerSignedName: 'Bapak Ahmad',
          technicianSignedName: 'Budi Santoso',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe(WorkOrderStatus.COMPLETED);
      expect(body.data.completedAt).toBeDefined();

      // Verify linked booking was synced to COMPLETED
      const booking = await prisma.booking.findUnique({ where: { id: testBookingId } });
      expect(booking?.status).toBe(BookingStatus.COMPLETED);
    });
  });

  describe('5. Follow-Up Required Workflow', () => {
    let followUpWoId: string;
    let followUpBookingId: string;

    beforeAll(async () => {
      const customer = await prisma.customer.findFirst({
        where: { businessId: testBusinessId },
        include: { addresses: true },
      });
      const service = await prisma.service.findFirst({
        where: { businessId: testBusinessId, isActive: true },
      });

      const booking = await prisma.booking.create({
        data: {
          businessId: testBusinessId,
          customerId: customer!.id,
          customerAddressId: customer!.addresses[0].id,
          serviceId: service!.id,
          technicianId: testTechnicianId,
          bookingCode: `ACB-FU-${Date.now()}`,
          status: BookingStatus.IN_PROGRESS,
          scheduledStartAt: new Date(),
          scheduledEndAt: new Date(Date.now() + 2 * 3600 * 1000),
          serviceNameSnapshot: service!.name,
          unitCount: 1,
        },
      });
      followUpBookingId = booking.id;

      const wo = await prisma.workOrder.create({
        data: {
          businessId: testBusinessId,
          bookingId: booking.id,
          customerId: customer!.id,
          customerAddressId: customer!.addresses[0].id,
          technicianId: testTechnicianId,
          workOrderNumber: `WO-FU-${Date.now()}`,
          status: WorkOrderStatus.IN_PROGRESS,
          scheduledStartAt: new Date(),
          scheduledEndAt: new Date(Date.now() + 2 * 3600 * 1000),
        },
      });
      followUpWoId = wo.id;
    });

    afterAll(async () => {
      if (followUpWoId) {
        await prisma.workOrderStatusHistory.deleteMany({ where: { workOrderId: followUpWoId } });
        await prisma.workOrder.deleteMany({ where: { id: followUpWoId } });
      }
      if (followUpBookingId) {
        await prisma.booking.deleteMany({ where: { id: followUpBookingId } });
      }
    });

    it('technician requests follow up with reason', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${followUpWoId}/follow-up`,
        headers: {
          authorization: `Bearer ${techToken}`,
        },
        payload: {
          reason: 'Kapasitor kipas blower indoor melemah dan perlu diganti sparepart baru',
          notes: 'Dibutuhkan kapasitor 1.5uF 450V untuk unit Daikin',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.status).toBe(WorkOrderStatus.FOLLOW_UP_REQUIRED);
      expect(body.data.followUpReason).toContain('Kapasitor');
    });
  });
});
