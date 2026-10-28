import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { GoogleTokenService } from '../src/modules/google-calendar/services/google-token.service';
import { GoogleFreeBusyService } from '../src/modules/google-calendar/services/google-freebusy.service';

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

describe('Phase 10 — Google Calendar Integration E2E Test Suite', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let tokenService: GoogleTokenService;
  let freeBusyService: GoogleFreeBusyService;
  let ownerToken: string;
  let businessId: string;
  let testConnectionId: string;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    const fastifyCookie = require('@fastify/cookie');
    await app.register(fastifyCookie);
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    tokenService = app.get(GoogleTokenService);
    freeBusyService = app.get(GoogleFreeBusyService);

    // Login as Owner to get JWT
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@coolcare.id',
        password: 'OwnerSecurePass123!',
      },
    });

    expect(loginRes.statusCode).toBe(200);
    const ownerSetCookie = loginRes.headers['set-cookie'] as string[];
    const cookieArray = Array.isArray(ownerSetCookie) ? ownerSetCookie : [ownerSetCookie];
    const match = cookieArray.find((c) => c.includes('tk_ac_access='))?.match(/tk_ac_access=([^;]+)/);
    ownerToken = match ? decodeURIComponent(match[1]) : '';

    const business = await prisma.business.findFirst({ where: { isActive: true } });
    expect(business).toBeDefined();
    businessId = business!.id;

    // Create shared connection record
    const enc = tokenService.encrypt('mock-refresh-token');
    const conn = await prisma.calendarConnection.create({
      data: {
        businessId,
        status: 'CONNECTED',
        calendarId: 'mock-calendar-id@group.calendar.google.com',
        calendarName: 'CoolCare Operasional AC',
        googleAccountEmail: 'coolcare.ops@gmail.com',
        encryptedAccessToken: enc,
        encryptedRefreshToken: enc,
        accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        grantedScopes: ['https://www.googleapis.com/auth/calendar.events'],
      },
    });
    testConnectionId = conn.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testConnectionId) {
      await prisma.calendarSyncJob.deleteMany({ where: { connectionId: testConnectionId } });
      await prisma.calendarSyncConflict.deleteMany({ where: { connectionId: testConnectionId } });
      await prisma.externalCalendarEvent.deleteMany({ where: { connectionId: testConnectionId } });
      await prisma.calendarWebhookChannel.deleteMany({ where: { connectionId: testConnectionId } });
      await prisma.calendarConnection.deleteMany({ where: { id: testConnectionId } });
    }
    if (app) {
      await app.close();
    }
  });

  const getAuthHeaders = () => ({
    authorization: `Bearer ${ownerToken}`,
    cookie: `tk_ac_access=${ownerToken}`,
  });

  describe('1. AES-256-GCM Token Encryption Security', () => {
    it('should securely encrypt and decrypt refresh tokens at rest with unique IVs', () => {
      const plaintextToken = '1//0gV-mock-google-refresh-token-xyz123456789';
      const encrypted = tokenService.encrypt(plaintextToken);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(plaintextToken);
      expect(encrypted.split(':').length).toBe(3);

      // Decrypt
      const decrypted = tokenService.decrypt(encrypted);
      expect(decrypted).toEqual(plaintextToken);

      // Verify unique IV on subsequent encryption of same plaintext
      const encrypted2 = tokenService.encrypt(plaintextToken);
      expect(encrypted2).not.toEqual(encrypted);
    });

    it('should reject tampered ciphertext during decryption', () => {
      const encrypted = tokenService.encrypt('secret-token');
      const parts = encrypted.split(':');
      // Tamper ciphertext
      const tamperedCiphertext = Buffer.from(parts[2], 'hex');
      tamperedCiphertext[0] ^= 1; // flip 1 bit
      const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedCiphertext.toString('hex')}`;

      expect(() => {
        tokenService.decrypt(tamperedPayload);
      }).toThrow();
    });
  });

  describe('2. OAuth 2.0 Connection Management Endpoints', () => {
    it('should reject unauthenticated request to connection status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/integrations/google',
      });
      expect(res.statusCode).toBe(401);
    });

    it('should return connection status for authenticated owner', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/integrations/google',
        headers: getAuthHeaders(),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('CONNECTED');
    });

    it('should generate Google OAuth connect URL with cryptographically secure state', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/integrations/google/connect',
        headers: getAuthHeaders(),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data).toHaveProperty('authorizationUrl');
      expect(data.authorizationUrl).toContain('accounts.google.com');
      expect(data.authorizationUrl).toContain('state=');
      expect(data.authorizationUrl).toContain('access_type=offline');
    });

    it('should reject callback with invalid state parameter', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/integrations/google/callback?code=mock_code&state=invalid_tampered_state',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('3. Multi-Technician Google FreeBusy Projection & Fail-Closed Policy', () => {
    it('should return external busy intervals from ExternalCalendarEvent table', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() + 24 * 3600 * 1000);
      const endAt = new Date(startAt.getTime() + 2 * 3600 * 1000);

      await prisma.externalCalendarEvent.create({
        data: {
          connectionId: testConnectionId,
          eventId: 'gcal_event_busy_001',
          summary: 'Workshop Deep Clean & Maintenance',
          startAt,
          endAt,
          isBusy: true,
          sourceType: 'EXTERNAL_BUSY',
        },
      });

      const res = await freeBusyService.getExternalBusyIntervals(
        businessId,
        new Date(startAt.getTime() - 3600 * 1000),
        new Date(endAt.getTime() + 3600 * 1000),
      );

      expect(res.isFailClosed).toBe(false);
      expect(res.busyIntervals.length).toBeGreaterThanOrEqual(1);
      expect(res.busyIntervals[0].source).toBe('EXTERNAL_BUSY');
    });

    it('should fail-closed if connection status is REAUTH_REQUIRED', async () => {
      await prisma.calendarConnection.update({
        where: { id: testConnectionId },
        data: { status: 'REAUTH_REQUIRED' },
      });

      const res = await freeBusyService.getExternalBusyIntervals(
        businessId,
        new Date(),
        new Date(Date.now() + 7 * 24 * 3600 * 1000),
      );

      expect(res.isFailClosed).toBe(true);

      // Restore status
      await prisma.calendarConnection.update({
        where: { id: testConnectionId },
        data: { status: 'CONNECTED' },
      });
    });
  });

  describe('4. Transactional Outbox Job Queue & Retry API', () => {
    let testJobId: string;

    it('should list outbox jobs via GET /admin/integrations/google/jobs', async () => {
      const job = await prisma.calendarSyncJob.create({
        data: {
          connectionId: testConnectionId,
          aggregateType: 'BOOKING',
          aggregateId: 'test-booking-uuid',
          operation: 'CREATE_EVENT',
          status: 'FAILED_RETRY',
          attemptCount: 1,
          lastError: 'Mock Google API rate limit error',
        },
      });
      testJobId = job.id;

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/integrations/google/jobs',
        headers: getAuthHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data).toHaveProperty('items');
      expect(data.items.some((j: any) => j.id === testJobId)).toBe(true);
    });

    it('should reset failed job for immediate retry via POST /admin/integrations/google/jobs/:id/retry', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/integrations/google/jobs/${testJobId}/retry`,
        headers: getAuthHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data.status).toBe('PENDING');

      const updated = await prisma.calendarSyncJob.findUnique({ where: { id: testJobId } });
      expect(updated?.status).toBe('PENDING');
      expect(updated?.lockedUntil).toBeNull();
    });
  });

  describe('5. Conflict Resolution Workflow', () => {
    let testConflictId: string;

    beforeAll(async () => {
      const conflict = await prisma.calendarSyncConflict.create({
        data: {
          connectionId: testConnectionId,
          conflictType: 'REMOTE_EVENT_CHANGED',
          externalEventId: 'gcal_conflict_event_123',
          localSnapshot: { scheduledStartAt: '2026-11-01T09:00:00Z', status: 'CONFIRMED' },
          remoteSnapshot: { start: { dateTime: '2026-11-01T14:00:00Z' }, status: 'confirmed' },
          status: 'OPEN',
        },
      });
      testConflictId = conflict.id;
    });

    it('should list conflicts via GET /admin/integrations/google/conflicts', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/integrations/google/conflicts?status=OPEN',
        headers: getAuthHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data.items.some((c: any) => c.id === testConflictId)).toBe(true);
    });

    it('should retrieve conflict details by ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/integrations/google/conflicts/${testConflictId}`,
        headers: getAuthHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data.id).toBe(testConflictId);
      expect(data.conflictType).toBe('REMOTE_EVENT_CHANGED');
    });

    it('should resolve conflict via POST /admin/integrations/google/conflicts/:id/resolve', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/integrations/google/conflicts/${testConflictId}/resolve`,
        headers: getAuthHeaders(),
        payload: {
          action: 'RESTORE_LOCAL',
          resolutionNotes: 'Menyelaraskan kembali jadwal dengan data resmi CoolCare',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data.status).toBe('RESOLVED');
      expect(data.resolutionNotes).toContain('Menyelaraskan kembali');
    });
  });

  describe('6. Google Calendar Webhook Push Notification Handshake', () => {
    it('should respond 200 OK to Google Webhook initial sync handshake', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/google-calendar',
        headers: {
          'x-goog-channel-id': 'mock-channel-id-sync',
          'x-goog-channel-token': 'mock-token',
          'x-goog-resource-id': 'mock-resource',
          'x-goog-resource-state': 'sync',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data.status).toBe('acknowledged');
    });

    it('should reject webhook without channel headers with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/google-calendar',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('7. Disconnect Google Calendar Integration', () => {
    it('should disconnect Google Calendar and reset connection status', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/admin/integrations/google',
        headers: getAuthHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const data = body.data || body;
      expect(data.success).toBe(true);

      const conn = await prisma.calendarConnection.findUnique({
        where: { id: testConnectionId },
      });
      expect(conn?.status).toBe('DISCONNECTED');
      expect(conn?.encryptedRefreshToken).toBeNull();
    });
  });
});
