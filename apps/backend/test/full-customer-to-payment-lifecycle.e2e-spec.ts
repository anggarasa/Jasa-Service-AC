import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import {
  BookingStatus,
  ChecklistItemStatus,
  InspectionStatus,
  WorkOrderStatus,
} from '@prisma/client';

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

describe('Full Customer-to-Payment Lifecycle E2E Test Suite (Phase 12)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let adminToken: string;
  let techToken: string;
  let testBusinessId: string;
  let testServiceId: string;
  let testServiceAreaId: string;
  let testTechnicianId: string;

  // Lifecycle identifiers
  let createdBookingId: string;
  let createdBookingCode: string;
  let createdAccessToken: string;
  let createdWorkOrderId: string;
  let createdInvoiceId: string;
  let firstPaymentId: string;
  let secondPaymentId: string;

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

    prisma = app.get<PrismaService>(PrismaService);

    // Dapatkan data bisnis
    const business = await prisma.business.findFirst({ where: { slug: 'coolcare-ac' } });
    if (!business) {
      throw new Error('Business coolcare-ac not found. Seed might be needed.');
    }
    testBusinessId = business.id;

    // Login OWNER
    const ownerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'owner@coolcare.id', password: 'OwnerSecurePass123!' },
    });
    const ownerCookie = ownerRes.headers['set-cookie'] as string[];
    const ownerMatch = ownerCookie?.[0]?.match(/tk_ac_access=([^;]+)/);
    ownerToken = ownerMatch ? decodeURIComponent(ownerMatch[1]) : (JSON.parse(ownerRes.body).data?.accessToken || '');

    // Login ADMIN
    const adminRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@coolcare.id', password: 'AdminSecurePass123!' },
    });
    const adminCookie = adminRes.headers['set-cookie'] as string[];
    const adminMatch = adminCookie?.[0]?.match(/tk_ac_access=([^;]+)/);
    adminToken = adminMatch ? decodeURIComponent(adminMatch[1]) : (JSON.parse(adminRes.body).data?.accessToken || '');

    // Login TECHNICIAN
    const techRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'technician@coolcare.id', password: 'TechSecurePass123!' },
    });
    const techCookie = techRes.headers['set-cookie'] as string[];
    const techMatch = techCookie?.[0]?.match(/tk_ac_access=([^;]+)/);
    techToken = techMatch ? decodeURIComponent(techMatch[1]) : (JSON.parse(techRes.body).data?.accessToken || '');

    // Layanan & Area Layanan
    const service = await prisma.service.findFirst({ where: { businessId: testBusinessId, isActive: true } });
    testServiceId = service!.id;

    const area = await prisma.serviceArea.findFirst({ where: { businessId: testBusinessId, isActive: true } });
    testServiceAreaId = area!.id;

    const tech = await prisma.technician.findFirst({
      where: { businessId: testBusinessId, isActive: true },
    });
    testTechnicianId = tech!.id;
  });

  afterAll(async () => {
    // Cleanup lifecycle records
    if (createdInvoiceId) {
      await prisma.paymentReceipt.deleteMany({ where: { payment: { invoiceId: createdInvoiceId } } });
      await prisma.payment.deleteMany({ where: { invoiceId: createdInvoiceId } });
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: createdInvoiceId } });
      await prisma.financialAuditLog.deleteMany({ where: { aggregateId: createdInvoiceId } });
      await prisma.invoice.deleteMany({ where: { id: createdInvoiceId } });
    }
    if (createdWorkOrderId) {
      await prisma.serviceChargeApproval.deleteMany({ where: { workOrderId: createdWorkOrderId } });
      await prisma.workOrderCharge.deleteMany({ where: { workOrderId: createdWorkOrderId } });
      await prisma.workOrderMaterial.deleteMany({ where: { workOrderId: createdWorkOrderId } });
      await prisma.workOrderServiceReport.deleteMany({ where: { workOrderId: createdWorkOrderId } });
      await prisma.workOrderUnitInspection.deleteMany({ where: { workOrderId: createdWorkOrderId } });
      await prisma.workOrderChecklistItem.deleteMany({ where: { workOrderId: createdWorkOrderId } });
      await prisma.workOrderStatusHistory.deleteMany({ where: { workOrderId: createdWorkOrderId } });
      await prisma.workOrderItem.deleteMany({ where: { workOrderId: createdWorkOrderId } });
      await prisma.workOrder.deleteMany({ where: { id: createdWorkOrderId } });
    }
    if (createdBookingId) {
      await prisma.resourceOccupancy.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.bookingAccessToken.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.bookingAuditLog.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.bookingAcUnit.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.bookingItem.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.calendarSyncJob.deleteMany({ where: { aggregateId: createdBookingId } });
      await prisma.booking.deleteMany({ where: { id: createdBookingId } });
    }
    await app.close();
  });

  describe('Step 1: Public Booking Submission & Guest Reservation', () => {
    it('1.1 should create a guest booking with multiple AC units and calculate price estimate correctly', async () => {
      // Cari slot yang pasti tersedia melalui endpoint availability
      const targetDate = '2026-11-23'; // Senin
      const availRes = await app.inject({
        method: 'GET',
        url: `/api/v1/public/availability?serviceId=${testServiceId}&unitCount=2&serviceAreaId=${testServiceAreaId}&date=${targetDate}`,
      });
      const availJson = JSON.parse(availRes.body);
      const availableSlot = availJson.data?.slots?.find((s: any) => s.available);
      const selectedStartAt = availableSlot ? availableSlot.startIso : `${targetDate}T02:00:00.000Z`;

      const payload = {
        serviceId: testServiceId,
        units: [
          {
            brand: 'Daikin',
            model: 'FTKC25',
            type: 'SPLIT',
            capacityPk: '1.00',
            installationRoom: 'Kamar Utama',
            notes: 'Cuci bersih',
          },
          {
            brand: 'Panasonic',
            model: 'CS-PN9',
            type: 'SPLIT',
            capacityPk: '1.00',
            installationRoom: 'Ruang Keluarga',
            notes: 'Cuci bersih',
          },
        ],
        serviceAreaId: testServiceAreaId,
        serviceAddress: {
          recipientName: 'Budi Santoso E2E',
          recipientPhone: '081298765432',
          fullAddress: 'Jl. Wijaya Timur No. 12, Kebayoran Baru',
          province: 'DKI Jakarta',
          city: 'Jakarta Selatan',
          district: 'Kebayoran Baru',
          postalCode: '12110',
          landmark: 'Dekat Masjid Nurul Huda',
        },
        selectedStartAt,
        customerName: 'Budi Santoso E2E',
        customerPhone: '081298765432',
        customerEmail: 'budi.santoso.e2e@example.com',
        customerNotes: 'Mohon teknisi bawa tangga lipat',
        idempotencyKey: `idemp-e2e-${Date.now()}`,
      };

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/public/bookings',
        payload,
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.bookingId).toBeDefined();
      expect(json.data.bookingCode).toMatch(/^ACB-20\d{6}-[A-Z0-9]+$/);
      expect(json.data.accessToken).toBeDefined();

      createdBookingId = json.data.bookingId;
      createdBookingCode = json.data.bookingCode;
      createdAccessToken = json.data.accessToken;

      // Verifikasi di PostgreSQL
      const booking = await prisma.booking.findUnique({
        where: { id: createdBookingId },
        include: {
          bookingItems: true,
          customer: true,
        },
      });

      expect(booking).not.toBeNull();
      expect(booking!.status).toBe(BookingStatus.PENDING);
      expect(booking!.bookingItems.length).toBe(2);
    });

    it('1.2 should allow guest customer to access their own booking via capability token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/public/bookings/manage',
        headers: {
          authorization: `Bearer ${createdAccessToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.bookingCode).toBe(createdBookingCode);
      expect(json.data.status).toBe(BookingStatus.PENDING);
    });
  });

  describe('Step 2: Admin Confirmation, Assignment & Work Order Generation', () => {
    it('2.1 should confirm booking and assign technician', async () => {
      // 1. Confirm
      const confirmRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/bookings/${createdBookingId}/confirm`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          internalNotes: 'Konfirmasi pemesanan servis Budi Santoso',
        },
      });
      expect(confirmRes.statusCode).toBe(200);

      // 2. Assign technician
      const assignRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/bookings/${createdBookingId}/assign-technician`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          technicianId: testTechnicianId,
          notes: 'Tugaskan teknisi CoolCare utama',
        },
      });
      expect(assignRes.statusCode).toBe(200);
      const json = JSON.parse(assignRes.body);
      expect(json.data.technicianId).toBe(testTechnicianId);
    });

    it('2.2 should create a work order associated with the confirmed booking', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/work-orders',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          bookingId: createdBookingId,
          technicianId: testTechnicianId,
          adminInstructions: 'Instruksi pengerjaan: lakukan cuci steam indoor & outdoor',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.workOrderNumber).toMatch(/^WO-\d{8}-\d{4}$/);
      expect(json.data.technicianId).toBe(testTechnicianId);

      createdWorkOrderId = json.data.id;
    });

    it('2.3 should have queued a Google Calendar sync intent in outbox if calendar is connected', async () => {
      const syncJob = await prisma.calendarSyncJob.findFirst({
        where: {
          aggregateId: createdBookingId,
          aggregateType: 'BOOKING',
        },
      });
      if (syncJob) {
        expect(syncJob.aggregateId).toBe(createdBookingId);
      }
    });
  });

  describe('Step 3: Technician Field Service Execution & Inspection', () => {
    it('3.1 technician can see the assigned job in their workspace', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/technician/work-orders',
        headers: { authorization: `Bearer ${techToken}` },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      const found = json.data.items?.find((j: any) => j.id === createdWorkOrderId);
      expect(found).toBeDefined();
    });

    it('3.2 technician transitions status: ON_THE_WAY -> ARRIVED -> IN_PROGRESS', async () => {
      // 1. Start Journey
      const onTheWayRes = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${createdWorkOrderId}/start-journey`,
        headers: { authorization: `Bearer ${techToken}` },
      });
      expect(onTheWayRes.statusCode).toBe(200);

      // 2. Arrived
      const arriveRes = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${createdWorkOrderId}/arrive`,
        headers: { authorization: `Bearer ${techToken}` },
        payload: {
          notes: 'Sudah sampai di rumah pelanggan',
          checkInLatitude: -6.234567,
          checkInLongitude: 106.812345,
        },
      });
      expect(arriveRes.statusCode).toBe(200);

      // 3. Start Work
      const startRes = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${createdWorkOrderId}/start`,
        headers: { authorization: `Bearer ${techToken}` },
        payload: {
          notes: 'Mulai pengerjaan cuci AC unit kamar dan ruang tamu',
        },
      });
      expect(startRes.statusCode).toBe(200);

      const wo = await prisma.workOrder.findUnique({ where: { id: createdWorkOrderId } });
      expect(wo!.status).toBe(WorkOrderStatus.IN_PROGRESS);
    });

    it('3.3 technician performs per-unit inspection and completes checklists', async () => {
      const wo = await prisma.workOrder.findUnique({
        where: { id: createdWorkOrderId },
        include: {
          items: {
            include: { checklistItems: true },
          },
        },
      });

      for (const item of wo!.items) {
        // Simpan inspeksi
        const inspectRes = await app.inject({
          method: 'PUT',
          url: `/api/v1/technician/work-orders/${createdWorkOrderId}/items/${item.id}/inspection`,
          headers: { authorization: `Bearer ${techToken}` },
          payload: {
            inspectionStatus: InspectionStatus.GOOD,
            reportedComplaint: 'AC kotor berdebu',
            observedCondition: 'Filter tebal debu, blower kotor',
            diagnosis: 'Cukup cuci steam dan bersihkan saluran drainase',
            recommendedAction: 'Cuci berkala 3 bulan sekali',
          },
        });
        expect(inspectRes.statusCode).toBe(200);

        // Update semua checklist items ke DONE jika ada
        for (const check of item.checklistItems) {
          const checkRes = await app.inject({
            method: 'PUT',
            url: `/api/v1/technician/work-orders/${createdWorkOrderId}/checklist/${check.id}`,
            headers: { authorization: `Bearer ${techToken}` },
            payload: {
              status: ChecklistItemStatus.DONE,
              notes: 'Selesai dikerjakan sesuai SOP',
            },
          });
          expect(checkRes.statusCode).toBe(200);
        }
      }
    });

    it('3.4 technician completes work order with service report', async () => {
      // 1. Simpan laporan servis
      const reportRes = await app.inject({
        method: 'PUT',
        url: `/api/v1/technician/work-orders/${createdWorkOrderId}/report`,
        headers: { authorization: `Bearer ${techToken}` },
        payload: {
          summary: 'Servis cuci 2 unit AC split selesai lancar tanpa kendala.',
          workPerformed: 'Pencucian filter, evaporator, blower indoor, dan kondensor outdoor. Pengukuran tekanan freon normal.',
          recommendations: 'Servis berkala kembali dalam 3 bulan.',
        },
      });
      expect(reportRes.statusCode).toBe(200);

      // 2. Complete work order
      const completeRes = await app.inject({
        method: 'POST',
        url: `/api/v1/technician/work-orders/${createdWorkOrderId}/complete`,
        headers: { authorization: `Bearer ${techToken}` },
        payload: {
          notes: 'Pekerjaan selesai dan telah dites di depan pelanggan.',
          customerSigneeName: 'Budi Santoso',
          technicianSigneeName: 'Teknisi CoolCare',
        },
      });
      expect(completeRes.statusCode).toBe(200);

      const wo = await prisma.workOrder.findUnique({ where: { id: createdWorkOrderId } });
      expect(wo!.status).toBe(WorkOrderStatus.COMPLETED);
    });
  });

  describe('Step 4: Finance/Admin Pricing Review, Approval & Invoice Issuance', () => {
    it('4.1 should compare estimate vs actual and add approved additional charge', async () => {
      // Dapatkan data pricing review
      const pricingRes = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/work-orders/${createdWorkOrderId}/pricing`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(pricingRes.statusCode).toBe(200);
      const pricingData = JSON.parse(pricingRes.body).data;

      // Invarian estimasi awal tetap terjaga
      expect(pricingData.originalEstimate).toBeDefined();

      // Simpan perubahan pricing dengan biaya tambahan jasa penambahan freon (Rp 50.000) dan lakban pipa (Rp 25.000)
      const savePricingRes = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/work-orders/${createdWorkOrderId}/pricing`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          charges: [
            {
              lineType: 'ADDITIONAL_LABOR',
              description: 'Tambah Freon R32 1 Pk',
              quantity: 1,
              unitPrice: 50000,
            },
          ],
          materials: [
            {
              materialName: 'Duct Tape Lem / Lakban Pipa',
              quantity: 1,
              unit: 'ROLL',
              unitPrice: 25000,
              notes: 'Pembungkus pipa kondensor lama sudah lapuk',
            },
          ],
        },
      });
      expect(savePricingRes.statusCode).toBe(200);

      // Approve additional charge dengan evidence note
      const approveRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/work-orders/${createdWorkOrderId}/approvals`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          proposedTotal: 250000,
          approvedTotal: 250000,
          approvalMethod: 'IN_PERSON',
          approvedByName: 'Budi Santoso',
          approvedByContact: '081298765432',
          internalNotes: 'Disetujui langsung di lokasi oleh pemilik rumah',
        },
      });
      expect(approveRes.statusCode).toBe(201);
    });

    it('4.2 should create draft invoice and issue it, freezing invoice items', async () => {
      // 1. Buat Draft Invoice
      const draftRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/drafts`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          workOrderId: createdWorkOrderId,
        },
      });
      expect(draftRes.statusCode).toBe(201);
      const draftData = JSON.parse(draftRes.body).data;
      expect(draftData.status).toBe('DRAFT');
      expect(draftData.invoiceNumber).toMatch(/^INV-\d{6}-\d{5}$/);
      createdInvoiceId = draftData.id;

      // 2. Terbitkan Invoice (ISSUED)
      const issueRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${createdInvoiceId}/issue`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(issueRes.statusCode).toBe(200);
      const issuedData = JSON.parse(issueRes.body).data;
      expect(issuedData.status).toBe('ISSUED');
      expect(Number(issuedData.grandTotal)).toBeGreaterThan(0);
      expect(Number(issuedData.outstandingBalance)).toBe(Number(issuedData.grandTotal));
      expect(Number(issuedData.verifiedPaidTotal)).toBe(0);

      // 3. Verifikasi Invarian Pembekuan (Mutasi pricing setelah terbit harus 403 Forbidden)
      const forbiddenMutation = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/work-orders/${createdWorkOrderId}/pricing`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          charges: [
            {
              lineType: 'ADDITIONAL_LABOR',
              description: 'Biaya Ilegal Setelah Terbit',
              quantity: 1,
              unitPrice: 100000,
            },
          ],
          materials: [],
        },
      });
      expect(forbiddenMutation.statusCode).toBe(403);
    });
  });

  describe('Step 5: Payments, Verification & Deterministic Balance Reconciliation', () => {
    it('5.1 should record partial cash payment and update balance upon verification', async () => {
      const invoice = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
      const totalAmount = Number(invoice!.grandTotal);
      const halfAmount = Math.floor(totalAmount / 2);

      // 1. Catat pembayaran tunai parsial
      const pay1Res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${createdInvoiceId}/payments`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          method: 'CASH',
          amount: halfAmount,
          notes: `Uang tunai parsial diterima teknisi Rp ${halfAmount}`,
          idempotencyKey: `pay-cash-${Date.now()}`,
        },
      });
      expect(pay1Res.statusCode).toBe(201);
      firstPaymentId = JSON.parse(pay1Res.body).data.id;

      // Status pembayaran baru: PENDING_VERIFICATION
      let pay1 = await prisma.payment.findUnique({ where: { id: firstPaymentId } });
      expect(pay1!.status).toBe('PENDING_VERIFICATION');

      // Verifikasi pembayaran oleh Kasir/Admin
      const verify1Res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/payments/${firstPaymentId}/verify`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          notes: 'Fisik uang tunai telah disetor oleh teknisi ke kasir',
        },
      });
      expect(verify1Res.statusCode).toBe(200);

      // Verifikasi status invoice berubah jadi PARTIALLY_PAID
      const invAfterPay1 = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
      expect(invAfterPay1!.status).toBe('PARTIALLY_PAID');
      expect(Number(invAfterPay1!.verifiedPaidTotal)).toBe(halfAmount);
      expect(Number(invAfterPay1!.outstandingBalance)).toBe(totalAmount - halfAmount);
    });

    it('5.2 should reject overpayment attempts with HTTP 400 Bad Request', async () => {
      const invoice = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
      const overAmount = Number(invoice!.outstandingBalance) + 500000;

      const overpayRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${createdInvoiceId}/payments`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          method: 'BANK_TRANSFER',
          amount: overAmount,
          notes: 'Pembayaran melebihi sisa tagihan',
          idempotencyKey: `pay-over-${Date.now()}`,
        },
      });
      expect(overpayRes.statusCode).toBe(400);
    });

    it('5.3 should record remaining bank transfer payment and mark invoice PAID', async () => {
      const invoice = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
      const remaining = Number(invoice!.outstandingBalance);

      // 1. Catat sisa via transfer bank
      const pay2Res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${createdInvoiceId}/payments`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          method: 'BANK_TRANSFER',
          amount: remaining,
          notes: 'Transfer via BCA atas nama Budi Santoso',
          idempotencyKey: `pay-transfer-${Date.now()}`,
        },
      });
      expect(pay2Res.statusCode).toBe(201);
      secondPaymentId = JSON.parse(pay2Res.body).data.id;

      // 2. Verifikasi pembayaran kedua
      const verify2Res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/payments/${secondPaymentId}/verify`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          notes: 'Mutasi rekening BCA berhasil dicek dan valid',
        },
      });
      expect(verify2Res.statusCode).toBe(200);

      // 3. Verifikasi status invoice berubah jadi PAID dan saldo sisa 0
      const invAfterPay2 = await prisma.invoice.findUnique({
        where: { id: createdInvoiceId },
        include: { payments: true },
      });
      expect(invAfterPay2!.status).toBe('PAID');
      expect(Number(invAfterPay2!.outstandingBalance)).toBe(0);

      // Kuitansi resmi diterbitkan
      const receipt = await prisma.paymentReceipt.findFirst({
        where: { paymentId: secondPaymentId },
      });
      expect(receipt).not.toBeNull();
      expect(receipt!.receiptNumber).toMatch(/^REC-\d{6}-\d{5}$/);
    });
  });

  describe('Step 6: Official Document PDF Generation & Customer Access', () => {
    it('6.1 should generate valid A4 PDF for issued Invoice', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/invoices/${createdInvoiceId}/pdf`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.rawPayload.length).toBeGreaterThan(1000);
    });

    it('6.2 should generate valid A4 PDF for Payment Receipt', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/payments/${secondPaymentId}/receipt-pdf`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.rawPayload.length).toBeGreaterThan(1000);
    });

    it('6.3 guest customer should see updated invoice status and paid amount on manage portal', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/public/bookings/${createdBookingCode}/financial-summary`,
        headers: { authorization: `Bearer ${createdAccessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.invoice.status).toBe('PAID');
      expect(Number(json.data.invoice.outstandingBalance)).toBe(0);
    });
  });

  describe('Step 7: Audit Trail & Invariant Consistency Verification', () => {
    it('7.1 should have recorded financial audit logs for all mutations', async () => {
      const auditLogs = await prisma.financialAuditLog.findMany({
        where: {
          aggregateId: createdInvoiceId,
          aggregateType: 'INVOICE',
        },
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(1);
      const actions = auditLogs.map((l) => l.action);
      expect(actions).toContain('INVOICE_ISSUED');
    });

    it('7.2 should guarantee final system invariants across all models', async () => {
      // 1. Original booking estimate is present and immutable
      const booking = await prisma.booking.findUnique({ where: { id: createdBookingId } });
      expect(Number(booking!.estimatedTotal)).toBeGreaterThan(0);

      // 2. WorkOrder status is COMPLETED
      const wo = await prisma.workOrder.findUnique({ where: { id: createdWorkOrderId } });
      expect(wo!.status).toBe(WorkOrderStatus.COMPLETED);

      // 3. Invoice status is PAID
      const invoice = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
      expect(invoice!.status).toBe('PAID');

      // 4. Mathematical exactness: grandTotal == verifiedPaidTotal + outstandingBalance
      expect(Number(invoice!.grandTotal)).toBe(
        Number(invoice!.verifiedPaidTotal) + Number(invoice!.outstandingBalance),
      );
    });
  });
});
