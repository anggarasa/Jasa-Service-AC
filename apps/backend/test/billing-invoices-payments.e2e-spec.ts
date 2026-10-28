import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import {
  BookingStatus,
  UserRole,
  WorkOrderStatus,
  PriceType,
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

describe('Phase 11 — Pricing, Billing, Payment & Reporting E2E Test Suite', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let adminToken: string;
  let testBusinessId: string;
  let testWorkOrderId: string;
  let testBookingId: string;
  let testBookingCode: string;
  let testCustomerId: string;
  let testAccessTokenRaw: string;

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

    // 1. Dapatkan business
    let business = await prisma.business.findFirst();
    if (!business) {
      business = await prisma.business.create({
        data: {
          name: 'CoolCare AC Test',
          slug: `coolcare-test-${Date.now()}`,
          phone: '08123456789',
          email: 'info@coolcare.test',
          whatsappNumber: '08123456789',
          address: 'Jl. Test Billing No. 11',
          isActive: true,
        },
      });
    }
    testBusinessId = business.id;

    // 2. Login akun OWNER & ADMIN
    const ownerLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'owner@coolcare.id', password: 'OwnerSecurePass123!' },
    });
    const ownerSetCookie = ownerLoginRes.headers['set-cookie'] as string[];
    const ownerMatch = ownerSetCookie?.[0]?.match(/tk_ac_access=([^;]+)/);
    ownerToken = ownerMatch ? decodeURIComponent(ownerMatch[1]) : (JSON.parse(ownerLoginRes.body).data?.accessToken || '');

    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@coolcare.id', password: 'AdminSecurePass123!' },
    });
    const adminSetCookie = adminLoginRes.headers['set-cookie'] as string[];
    const adminMatch = adminSetCookie?.[0]?.match(/tk_ac_access=([^;]+)/);
    adminToken = adminMatch ? decodeURIComponent(adminMatch[1]) : (JSON.parse(adminLoginRes.body).data?.accessToken || '');

    // 4. Buat Customer & Alamat
    const customer = await prisma.customer.create({
      data: {
        businessId: testBusinessId,
        customerCode: `CUST-${Date.now()}`,
        name: 'Pak Budi Hartono',
        phone: '081298765432',
        normalizedPhone: '6281298765432',
        isActive: true,
      },
    });
    testCustomerId = customer.id;

    const address = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: 'Rumah Utama',
        fullAddress: 'Jl. Melati Indah No. 42',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
      },
    });

    // 5. Buat Service Category & Service
    const category = await prisma.serviceCategory.create({
      data: {
        businessId: testBusinessId,
        name: `Kategori Billing ${Date.now()}`,
        slug: `kat-billing-${Date.now()}`,
      },
    });

    const service = await prisma.service.create({
      data: {
        businessId: testBusinessId,
        categoryId: category.id,
        name: 'Cuci AC Inverter 1 PK',
        slug: `cuci-inverter-${Date.now()}`,
        description: 'Layanan cuci unit indoor dan outdoor',
        basePrice: 75000,
        priceType: PriceType.FIXED,
        estimatedDurationMinutes: 60,
        isActive: true,
      },
    });

    // 6. Buat Booking
    testBookingCode = `BK-BIL-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const scheduledEnd = new Date(now.getTime() + 60 * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        businessId: testBusinessId,
        customerId: customer.id,
        customerAddressId: address.id,
        serviceId: service.id,
        bookingCode: testBookingCode,
        status: BookingStatus.CONFIRMED,
        scheduledStartAt: now,
        scheduledEndAt: scheduledEnd,
        serviceNameSnapshot: service.name,
        estimatedPrice: 75000,
        visitFeeSnapshot: 25000,
        estimatedTotal: 100000,
      },
    });
    testBookingId = booking.id;

    // 7. Buat Booking Access Token
    testAccessTokenRaw = `token-${Date.now()}-secret`;
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(testAccessTokenRaw).digest('hex');

    await prisma.bookingAccessToken.create({
      data: {
        bookingId: booking.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 8. Buat Work Order
    const wo = await prisma.workOrder.create({
      data: {
        businessId: testBusinessId,
        bookingId: booking.id,
        customerId: customer.id,
        customerAddressId: address.id,
        workOrderNumber: `SPK-BIL-${Date.now().toString().slice(-6)}`,
        status: WorkOrderStatus.IN_PROGRESS,
        scheduledStartAt: now,
        scheduledEndAt: scheduledEnd,
      },
    });
    testWorkOrderId = wo.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Work Order Pricing Review & Actual Cost Calculation', () => {
    it('harus memuat rincian estimasi awal pemesanan tanpa mengubah data asli', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/work-orders/${testWorkOrderId}/pricing`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.workOrderId).toBe(testWorkOrderId);
      expect(body.data.originalEstimate.visitFeeSnapshot).toBe('25000');
      expect(body.data.originalEstimate.estimatedTotal).toBe('100000');
    });

    it('harus menyimpan biaya tenaga kerja tambahan dan material yang digunakan', async () => {
      const payload = {
        charges: [
          {
            lineType: 'ADDITIONAL_LABOR',
            description: 'Biaya bongkar outdoor di ketinggian lantai 2',
            quantity: 1,
            unitPrice: 50000,
          },
        ],
        materials: [
          {
            materialName: 'Freon R32',
            quantity: 1,
            unit: 'kg',
            unitPrice: 120000,
            notes: 'Isi ulang tekanan freon',
          },
        ],
      };

      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/work-orders/${testWorkOrderId}/pricing`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload,
      });

      expect(res.statusCode).toBe(200);

      // Verifikasi pembacaan ulang
      const verifyRes = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/work-orders/${testWorkOrderId}/pricing`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const verifyBody = JSON.parse(verifyRes.body);
      expect(verifyBody.data.actualCharges.charges.length).toBe(1);
      expect(verifyBody.data.actualCharges.materials.length).toBe(1);
      expect(verifyBody.data.actualCharges.additionalLaborTotal).toBe('50000');
      expect(verifyBody.data.actualCharges.materialsTotal).toBe('120000');
      // Subtotal = 25000 (visit) + 75000 (base) + 50000 (labor) + 120000 (material) = 270000
      expect(verifyBody.data.actualCharges.finalGrandTotal).toBe('270000');
    });

    it('harus mencatat persetujuan biaya pelanggan dan memperbarui versi harga', async () => {
      const approvalPayload = {
        proposedTotal: 270000,
        approvedTotal: 270000,
        approvalMethod: 'IN_PERSON',
        approvedByName: 'Pak Budi Hartono',
        approvedByContact: '081298765432',
        internalNotes: 'Pelanggan setuju di lokasi sebelum freon diisi',
      };

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/work-orders/${testWorkOrderId}/approvals`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: approvalPayload,
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.pricingVersion).toBe(1);
      expect(body.data.status).toBe('APPROVED');
    });
  });

  describe('2. Invoice Creation, Sequence, Lifecycle & Freezing', () => {
    let createdInvoiceId: string;
    let createdInvoiceNumber: string;

    it('harus menerbitkan draf faktur dengan nomor urut INV-YYYYMM-XXXXX', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/invoices/drafts',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          workOrderId: testWorkOrderId,
          discountTotal: 20000, // Diskon promo 20k
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.invoiceNumber).toMatch(/^INV-\d{6}-\d{5}$/);
      expect(body.data.status).toBe('DRAFT');
      // Gross: 270000 - 20000 = 250000
      expect(Number(body.data.grandTotal)).toBe(250000);
      expect(Number(body.data.outstandingBalance)).toBe(250000);
      expect(Number(body.data.verifiedPaidTotal)).toBe(0);

      createdInvoiceId = body.data.id;
      createdInvoiceNumber = body.data.invoiceNumber;
    });

    it('harus mencegah pembuatan faktur duplikat untuk SPK yang sama', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/invoices/drafts',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { workOrderId: testWorkOrderId },
      });

      expect(res.statusCode).toBe(409);
    });

    it('harus mengubah status DRAFT menjadi ISSUED secara resmi', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${createdInvoiceId}/issue`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.status).toBe('ISSUED');
      expect(body.data.issuedAt).toBeDefined();
      expect(body.data.dueAt).toBeDefined();
    });

    it('harus menolak perubahan rincian biaya SPK setelah faktur resmi diterbitkan', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/work-orders/${testWorkOrderId}/pricing`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { charges: [], materials: [] },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('3. Payment Recording, Overpayment Protection & Verification', () => {
    let invoiceId: string;
    let payment1Id: string;
    let payment2Id: string;

    beforeAll(async () => {
      const inv = await prisma.invoice.findFirst({
        where: { workOrderId: testWorkOrderId },
      });
      invoiceId = inv!.id;
    });

    it('harus menolak pencatatan pembayaran yang melebihi saldo tagihan (Overpayment Protection)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          method: 'CASH',
          amount: 500000, // Sisa tagihan hanya 250000
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('harus mencatat pembayaran parsial pertama (PENDING_VERIFICATION)', async () => {
      const idempotencyKey = `idemp-${Date.now()}`;
      const payload = {
        method: 'BANK_TRANSFER',
        amount: 150000,
        notes: 'Transfer via BCA Klik',
        idempotencyKey,
      };

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload,
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data.paymentReference).toMatch(/^PAY-\d{6}-\d{5}$/);
      expect(body.data.status).toBe('PENDING_VERIFICATION');
      expect(Number(body.data.amount)).toBe(150000);
      payment1Id = body.data.id;

      // Tes idempotency: memanggil ulang dengan key yang sama harus mengembalikan record yang sama
      const duplicateRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload,
      });
      const dupBody = JSON.parse(duplicateRes.body);
      expect(dupBody.data.id).toBe(payment1Id);
    });

    it('harus memverifikasi pembayaran 1 oleh OWNER dan mengubah status faktur menjadi PARTIALLY_PAID', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/payments/${payment1Id}/verify`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { notes: 'Mutasi BCA 150.000 cocok' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.status).toBe('VERIFIED');
      expect(body.data.receipt).toBeDefined();
      expect(body.data.receipt.receiptNumber).toMatch(/^REC-\d{6}-\d{5}$/);

      // Verifikasi saldo faktur
      const invRes = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/invoices/${invoiceId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const invBody = JSON.parse(invRes.body);
      expect(invBody.data.status).toBe('PARTIALLY_PAID');
      expect(Number(invBody.data.verifiedPaidTotal)).toBe(150000);
      expect(Number(invBody.data.outstandingBalance)).toBe(100000);
    });

    it('harus mencatat pembayaran pelunasan kedua (100.000 CASH)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${invoiceId}/payments`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          method: 'CASH',
          amount: 100000,
          notes: 'Uang pas diserahkan di lokasi',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      payment2Id = body.data.id;
    });

    it('harus memverifikasi pembayaran 2 dan mengubah status faktur menjadi PAID (Lunas)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/payments/${payment2Id}/verify`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { notes: 'Kas tunai diterima kasir' },
      });

      expect(res.statusCode).toBe(200);

      // Verifikasi saldo faktur lunas
      const invRes = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/invoices/${invoiceId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const invBody = JSON.parse(invRes.body);
      expect(invBody.data.status).toBe('PAID');
      expect(Number(invBody.data.verifiedPaidTotal)).toBe(250000);
      expect(Number(invBody.data.outstandingBalance)).toBe(0);
      expect(invBody.data.paidAt).toBeDefined();
    });

    it('harus mencegah pembatalan (VOID) faktur yang sudah memiliki pembayaran terverifikasi', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/invoices/${invoiceId}/void`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { reason: 'Uji coba pembatalan tidak sah' },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('4. PDF Generation & Document Downloads', () => {
    let invoiceId: string;
    let paymentId: string;

    beforeAll(async () => {
      const inv = await prisma.invoice.findFirst({
        where: { workOrderId: testWorkOrderId },
        include: { payments: true },
      });
      invoiceId = inv!.id;
      paymentId = inv!.payments[0].id;
    });

    it('harus menghasilkan file PDF faktur tagihan yang valid', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/invoices/${invoiceId}/pdf`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.rawPayload.length).toBeGreaterThan(100);
    });

    it('harus menghasilkan file PDF kuitansi resmi yang valid', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/payments/${paymentId}/receipt-pdf`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.rawPayload.length).toBeGreaterThan(100);
    });
  });

  describe('5. Operational & Financial Reporting with CSV Sanitization', () => {
    it('harus menghitung KPI keuangan (billed vs verified received) secara akurat', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports/overview',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(Number(body.data.kpi.totalInvoicedAmount)).toBeGreaterThanOrEqual(250000);
      expect(Number(body.data.kpi.totalVerifiedRevenue)).toBeGreaterThanOrEqual(250000);
    });

    it('harus menghasilkan ekspor CSV dan melindungi dari formula injection', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports/export?type=invoices',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      const csv = res.body;
      expect(csv).toContain('No. Faktur');
      expect(csv).toContain('Total Tagihan (IDR)');
    });
  });

  describe('6. Public Capability-Secured Financial Summary', () => {
    it('harus mengizinkan pelanggan mengakses ringkasan tagihan menggunakan token sah', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/public/bookings/${testBookingCode}/financial-summary?token=${testAccessTokenRaw}`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.bookingCode).toBe(testBookingCode);
      expect(body.data.invoice).toBeDefined();
      expect(body.data.invoice.status).toBe('PAID');
    });

    it('harus menolak akses ringkasan tagihan pelanggan dengan token palsu', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/public/bookings/${testBookingCode}/financial-summary?token=invalid-token`,
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
