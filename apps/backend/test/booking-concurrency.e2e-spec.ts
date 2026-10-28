import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

describe('Booking Engine & Concurrency E2E Test Suite (Phase 07)', () => {
  let app!: NestFastifyApplication;
  let prisma!: PrismaService;
  let businessId!: string;
  let serviceId!: string;
  let serviceAreaId!: string;
  let technician1Id!: string;
  let createdBookingAccessToken!: string;
  let createdBookingCode!: string;

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

    prisma = app.get(PrismaService);

    // Clean up any stray test technicians or test data in beforeAll
    await prisma.paymentReceipt.deleteMany({});
    await prisma.invoiceItem.deleteMany({ where: { invoice: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.payment.deleteMany({ where: { invoice: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.invoice.deleteMany({ where: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } });
    await prisma.serviceChargeApproval.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderCharge.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderMaterial.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderPhoto.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderChecklistItem.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderUnitInspection.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderServiceReport.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderStatusHistory.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderAssignmentHistory.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrderItem.deleteMany({ where: { workOrder: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } } });
    await prisma.workOrder.deleteMany({ where: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } } });
    await prisma.calendarSyncJob.deleteMany({ where: { aggregateType: 'BOOKING' } });
    await prisma.technician.deleteMany({
      where: { user: { email: { startsWith: 'tech2_' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'tech2_' } },
    });
    await prisma.resourceOccupancy.deleteMany({
      where: { startsAt: { gte: new Date('2026-11-01') } },
    });
    await prisma.bookingAccessToken.deleteMany({
      where: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } },
    });
    await prisma.bookingItem.deleteMany({
      where: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } },
    });
    await prisma.bookingStatusHistory.deleteMany({
      where: { booking: { scheduledStartAt: { gte: new Date('2026-11-01') } } },
    });
    await prisma.bookingIdempotency.deleteMany({});
    await prisma.booking.deleteMany({
      where: { scheduledStartAt: { gte: new Date('2026-11-01') } },
    });

    // Resolve test fixtures from seed data
    const business = await prisma.business.findFirst({
      where: { slug: 'coolcare-ac' },
    });
    businessId = business!.id;

    const service = await prisma.service.findFirst({
      where: { businessId, slug: 'cuci-ac-standar' },
    });
    serviceId = service!.id;

    const area = await prisma.serviceArea.findFirst({
      where: { businessId, isActive: true },
    });
    serviceAreaId = area!.id;

    const tech = await prisma.technician.findFirst({
      where: { businessId, isActive: true },
    });
    technician1Id = tech!.id;
  });

  afterAll(async () => {
    // Clean up test bookings and occupancies
    await prisma.paymentReceipt.deleteMany({});
    await prisma.invoiceItem.deleteMany({ where: { invoice: { businessId } } });
    await prisma.payment.deleteMany({ where: { businessId } });
    await prisma.invoice.deleteMany({ where: { businessId } });
    await prisma.serviceChargeApproval.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderCharge.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderMaterial.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderPhoto.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderChecklistItem.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderUnitInspection.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderServiceReport.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderStatusHistory.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderAssignmentHistory.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrderItem.deleteMany({ where: { workOrder: { businessId } } });
    await prisma.workOrder.deleteMany({ where: { businessId } });
    await prisma.calendarSyncJob.deleteMany({ where: { aggregateType: 'BOOKING' } });
    await prisma.resourceOccupancy.deleteMany({
      where: { businessId },
    });
    await prisma.bookingAccessToken.deleteMany({
      where: { booking: { businessId } },
    });
    await prisma.bookingItem.deleteMany({
      where: { booking: { businessId } },
    });
    await prisma.bookingStatusHistory.deleteMany({
      where: { booking: { businessId } },
    });
    await prisma.bookingIdempotency.deleteMany({
      where: { businessId },
    });
    await prisma.booking.deleteMany({
      where: { businessId },
    });
    await app.close();
  });

  it('1. GET /api/v1/public/availability should return available slots on an operating day', async () => {
    // Tomorrow or next Monday to ensure operating day
    const targetDate = '2026-11-02'; // Monday

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/public/availability?serviceId=${serviceId}&unitCount=2&serviceAreaId=${serviceAreaId}&date=${targetDate}`,
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.date).toBe(targetDate);
    expect(json.data.timezone).toBe('Asia/Jakarta');
    expect(json.data.estimatedDurationMinutes).toBe(120); // 60 min * 2 units
    expect(Array.isArray(json.data.slots)).toBe(true);
    expect(json.data.slots.length).toBeGreaterThan(0);
    expect(json.data.slots[0].start).toBeDefined();
    expect(json.data.slots[0].startIso).toBeDefined();
    expect(json.data.slots[0].available).toBe(true);
  });

  it('2. POST /api/v1/public/bookings should create a multi-unit guest booking with PENDING status and return secure token', async () => {
    const idempotencyKey = `idem-test-${Date.now()}-abc123456789`;
    const selectedStartAt = '2026-11-02T02:00:00.000Z'; // 09:00 WIB

    const payload = {
      serviceId,
      units: [
        {
          brand: 'Daikin',
          model: 'Inverter FTKC',
          type: 'SPLIT',
          capacityPk: '1.00',
          installationRoom: 'Kamar Utama',
          notes: 'Kurang dingin dan filter kotor',
        },
        {
          brand: 'Panasonic',
          model: 'Standard CS-YN',
          type: 'SPLIT',
          capacityPk: '0.50',
          installationRoom: 'Kamar Tamu',
          notes: 'Cuci berkala 3 bulanan',
        },
      ],
      serviceAreaId,
      serviceAddress: {
        recipientName: 'Bapak Ahmad',
        recipientPhone: '081298765432',
        fullAddress: 'Jl. Kemang Raya No. 12B, RT 03/RW 02',
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
        postalCode: '12160',
        landmark: 'Seberang Toko Roti Enak',
      },
      selectedStartAt,
      customerName: 'Ahmad Subagyo',
      customerPhone: '081298765432',
      customerEmail: 'ahmad@example.com',
      customerNotes: 'Mohon teknisi membawa tangga lipat',
      idempotencyKey,
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/bookings',
      payload,
    });

    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.bookingId).toBeDefined();
    expect(json.data.bookingCode).toMatch(/^ACB-20\d{6}-[A-Z0-9]+$/);
    expect(json.data.status).toBe('PENDING');
    expect(json.data.accessToken).toBeDefined();
    expect(json.data.unitCount).toBe(2);
    expect(json.data.customerName).toBe('Ahmad Subagyo');
    expect(json.data.estimatedTotal).toBeDefined();

    createdBookingAccessToken = json.data.accessToken;
    createdBookingCode = json.data.bookingCode;

    // Verify in database: Booking, BookingItems, and ResourceOccupancy
    const savedBooking = await prisma.booking.findUnique({
      where: { id: json.data.bookingId },
      include: {
        bookingItems: true,
        occupancies: true,
        accessTokens: true,
      },
    });

    expect(savedBooking).toBeDefined();
    expect(savedBooking!.status).toBe('PENDING');
    expect(savedBooking!.bookingItems.length).toBe(2);
    expect(savedBooking!.occupancies.length).toBe(1);
    expect(savedBooking!.occupancies[0].status).toBe('ACTIVE');
    expect(savedBooking!.accessTokens.length).toBe(1);
  });

  it('3. POST /api/v1/public/bookings idempotency: same key & payload returns exact cached booking', async () => {
    const idempotencyKey = `idem-cached-${Date.now()}-123456789`;
    const selectedStartAt = '2026-11-02T05:00:00.000Z'; // 12:00 WIB (or afternoon slot)

    const payload = {
      serviceId,
      units: [{ brand: 'LG', type: 'SPLIT', capacityPk: '1.00' }],
      serviceAreaId,
      serviceAddress: {
        fullAddress: 'Jl. Fatmawati No. 88',
        city: 'Jakarta Selatan',
        district: 'Cilandak',
      },
      selectedStartAt,
      customerName: 'Ibu Siti',
      customerPhone: '081311223344',
      idempotencyKey,
    };

    // First call
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/public/bookings',
      payload,
    });
    expect(res1.statusCode).toBe(201);
    const json1 = JSON.parse(res1.payload);

    // Second call with same idempotencyKey & payload
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/public/bookings',
      payload,
    });
    expect(res2.statusCode).toBe(201);
    const json2 = JSON.parse(res2.payload);

    expect(json2.data.bookingCode).toBe(json1.data.bookingCode);
    expect(json2.data.bookingId).toBe(json1.data.bookingId);
  });

  it('4. POST /api/v1/public/bookings: duplicate booking on the SAME technician slot must be rejected with 409 SLOT_UNAVAILABLE', async () => {
    // Attempt to book the EXACT same time interval as test #2 when only 1 technician is available
    const selectedStartAt = '2026-11-02T02:00:00.000Z'; // same as booking #2

    const payload = {
      serviceId,
      units: [{ brand: 'Sharp', type: 'SPLIT', capacityPk: '1.00' }],
      serviceAreaId,
      serviceAddress: {
        fullAddress: 'Jl. Senopati No. 10',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
      },
      selectedStartAt,
      customerName: 'Budi Santoso',
      customerPhone: '081987654321',
      idempotencyKey: `idem-conflict-${Date.now()}-abc12345`,
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/bookings',
      payload,
    });

    expect(res.statusCode).toBe(409);
    const json = JSON.parse(res.payload);
    const errorMsg = json.error?.message || json.message;
    expect(errorMsg).toMatch(/sudah terisi|tidak tersedia|penuh/i);
  });

  it('5. GET /api/v1/public/bookings/manage should return full guest booking details using valid accessToken', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/public/bookings/manage?token=${createdBookingAccessToken}`,
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.bookingCode).toBe(createdBookingCode);
    expect(json.data.status).toBe('PENDING');
    expect(json.data.customerName).toBe('Ahmad Subagyo');
    expect(json.data.items.length).toBe(2);
    expect(json.data.serviceAddress.district).toBe('Kebayoran Baru');
    expect(json.data.statusHistory.length).toBeGreaterThan(0);
  });

  it('6. GET /api/v1/public/bookings/manage with invalid or tampered token must return 401 Unauthorized', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/bookings/manage?token=tampered_invalid_token_1234567890',
    });

    expect(res.statusCode).toBe(401);
  });

  it('7. Expiration Service: expired hold should release occupancy', async () => {
    // Manually set one pending booking to expired in DB
    const testExpiredBooking = await prisma.booking.create({
      data: {
        businessId,
        customerId: (await prisma.customer.findFirst({ where: { businessId } }))!.id,
        customerAddressId: (await prisma.customerAddress.findFirst())!.id,
        serviceId,
        technicianId: technician1Id,
        bookingCode: `ACB-EXPIRE-${Date.now().toString().slice(-4)}`,
        status: 'PENDING',
        scheduledStartAt: new Date(),
        scheduledEndAt: new Date(Date.now() + 60 * 60 * 1000),
        estimatedPrice: 100000,
        expiresAt: new Date(Date.now() - 10000), // in the past!
      },
    });

    const occ = await prisma.resourceOccupancy.create({
      data: {
        businessId,
        technicianId: technician1Id,
        bookingId: testExpiredBooking.id,
        startsAt: testExpiredBooking.scheduledStartAt,
        endsAt: testExpiredBooking.scheduledEndAt,
        status: 'ACTIVE',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/bookings/process-expirations',
    });

    expect(res.statusCode).toBe(200);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: testExpiredBooking.id },
    });
    expect(updatedBooking!.status).toBe('EXPIRED');

    const updatedOcc = await prisma.resourceOccupancy.findUnique({
      where: { id: occ.id },
    });
    expect(updatedOcc!.status).toBe('RELEASED');
  });

  it('8. Concurrency with 2 Technicians: Two simultaneous bookings for the same slot succeed on separate technicians', async () => {
    let tech2: any = null;
    let testUser2: any = null;
    try {
      // Create a second test technician
      testUser2 = await prisma.user.create({
        data: {
          name: 'Teknisi Uji Kedua',
          email: `tech2_${Date.now()}@coolcare.id`,
          passwordHash: 'dummyhash123',
          role: 'TECHNICIAN',
        },
      });

      tech2 = await prisma.technician.create({
        data: {
          businessId,
          userId: testUser2.id,
          isActive: true,
        },
      });

      const targetSlot = '2026-11-02T07:00:00.000Z'; // 14:00 WIB (after test 3 occupancy ends at 06:45)

      const bookingPromise1 = app.inject({
        method: 'POST',
        url: '/api/v1/public/bookings',
        payload: {
          serviceId,
          units: [{ brand: 'Daikin', type: 'SPLIT', capacityPk: '1.00' }],
          serviceAreaId,
          serviceAddress: {
            fullAddress: 'Jl. Melawai No. 1',
            city: 'Jakarta Selatan',
            district: 'Kebayoran Baru',
          },
          selectedStartAt: targetSlot,
          customerName: 'Pelanggan Konkuren 1',
          customerPhone: '081211112222',
          idempotencyKey: `idem-conc1-${Date.now()}-12345`,
        },
      });

      const bookingPromise2 = app.inject({
        method: 'POST',
        url: '/api/v1/public/bookings',
        payload: {
          serviceId,
          units: [{ brand: 'Panasonic', type: 'SPLIT', capacityPk: '1.00' }],
          serviceAreaId,
          serviceAddress: {
            fullAddress: 'Jl. Melawai No. 2',
            city: 'Jakarta Selatan',
            district: 'Kebayoran Baru',
          },
          selectedStartAt: targetSlot,
          customerName: 'Pelanggan Konkuren 2',
          customerPhone: '081233334444',
          idempotencyKey: `idem-conc2-${Date.now()}-67890`,
        },
      });

      const [res1, res2] = await Promise.all([bookingPromise1, bookingPromise2]);

      if (res1.statusCode !== 201 || res2.statusCode !== 201) {
        console.log('RES 1 payload:', res1.payload);
        console.log('RES 2 payload:', res2.payload);
      }

      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);

      const json1 = JSON.parse(res1.payload);
      const json2 = JSON.parse(res2.payload);

      expect(json1.data.bookingId).not.toBe(json2.data.bookingId);

      // Verify both occupancies exist and are assigned to DIFFERENT technicians
      const occ1 = await prisma.resourceOccupancy.findFirst({
        where: { bookingId: json1.data.bookingId },
      });
      const occ2 = await prisma.resourceOccupancy.findFirst({
        where: { bookingId: json2.data.bookingId },
      });

      expect(occ1).toBeDefined();
      expect(occ2).toBeDefined();
      expect(occ1!.technicianId).not.toBe(occ2!.technicianId);
    } finally {
      if (tech2) {
        await prisma.technician.delete({ where: { id: tech2.id } }).catch(() => {});
      }
      if (testUser2) {
        await prisma.user.delete({ where: { id: testUser2.id } }).catch(() => {});
      }
    }
  });
});

