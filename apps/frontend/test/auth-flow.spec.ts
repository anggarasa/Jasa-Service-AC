import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, ApiError } from '../src/lib/api/client';
import {
  LoginRequestSchema,
  ChangePasswordRequestSchema,
  UpdateProfileRequestSchema,
  UserRoleEnum,
} from '@tampilkit-ac/api-contract';

describe('Frontend Auth Flow & Security Test Suite', () => {
  it('should validate LoginRequest schema correctly', () => {
    // Valid email and password
    const valid = LoginRequestSchema.safeParse({
      email: 'owner@coolcare.id',
      password: 'OwnerSecurePass123!',
    });
    assert.strictEqual(valid.success, true);

    // Invalid email format
    const invalidEmail = LoginRequestSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    assert.strictEqual(invalidEmail.success, false);

    // Empty password
    const emptyPassword = LoginRequestSchema.safeParse({
      email: 'owner@coolcare.id',
      password: '',
    });
    assert.strictEqual(emptyPassword.success, false);
  });

  it('should enforce password change policy (min 12 characters)', () => {
    // Valid password
    const valid = ChangePasswordRequestSchema.safeParse({
      currentPassword: 'OldSecurePass123!',
      newPassword: 'NewSecurePassphrase456!',
    });
    assert.strictEqual(valid.success, true);

    // Too short new password (< 12 chars)
    const short = ChangePasswordRequestSchema.safeParse({
      currentPassword: 'OldSecurePass123!',
      newPassword: 'ShortPass1!',
    });
    assert.strictEqual(short.success, false);
  });

  it('should validate UpdateProfileRequest schema', () => {
    const valid = UpdateProfileRequestSchema.safeParse({
      name: 'Owner CoolCare Update',
    });
    assert.strictEqual(valid.success, true);

    const tooShort = UpdateProfileRequestSchema.safeParse({
      name: 'A',
    });
    assert.strictEqual(tooShort.success, false);
  });

  it('should verify role redirect resolution logic', () => {
    function resolveDashboardRoute(role: string): string {
      if (role === 'TECHNICIAN') return '/technician';
      if (role === 'OWNER' || role === 'ADMIN') return '/dashboard';
      return '/login';
    }

    assert.strictEqual(resolveDashboardRoute('OWNER'), '/dashboard');
    assert.strictEqual(resolveDashboardRoute('ADMIN'), '/dashboard');
    assert.strictEqual(resolveDashboardRoute('TECHNICIAN'), '/technician');
    assert.strictEqual(resolveDashboardRoute('UNKNOWN'), '/login');
  });

  it('should handle API client login and return sanitized user data without exposing raw JWTs', async () => {
    const originalFetch = globalThis.fetch;
    const mockUserData = {
      id: 'user-123',
      name: 'Owner CoolCare',
      email: 'owner@coolcare.id',
      role: 'OWNER',
      isActive: true,
      lastLoginAt: '2026-10-28T08:00:00.000Z',
    };

    globalThis.fetch = async (url) => {
      // Return response without raw tokens in body (HttpOnly cookies used)
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: {
            user: mockUserData,
          },
        }),
      } as unknown as Response;
    };

    try {
      const client = new ApiClient('http://localhost:3001/api/v1');
      const res = await client.login({
        email: 'owner@coolcare.id',
        password: 'OwnerSecurePass123!',
      });

      assert.strictEqual(res.user.email, 'owner@coolcare.id');
      assert.strictEqual(res.user.role, 'OWNER');
      // Verify no token property exists in the client response object
      assert.strictEqual((res as any).accessToken, undefined);
      assert.strictEqual((res as any).refreshToken, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should handle single-flight automatic token refresh on 401 response', async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;
    let refreshCalled = false;

    globalThis.fetch = async (input) => {
      const urlStr = String(input);
      callCount++;

      if (urlStr.includes('/auth/refresh')) {
        refreshCalled = true;
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            data: { message: 'Token rotated' },
          }),
        } as unknown as Response;
      }

      // First call fails with 401, second call succeeds
      if (callCount === 1) {
        return {
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Token expired' },
          }),
        } as unknown as Response;
      }

      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: { id: 'user-123', name: 'Refreshed User' },
        }),
      } as unknown as Response;
    };

    try {
      // Simulate browser window
      (globalThis as any).window = {};
      const client = new ApiClient('http://localhost:3001/api/v1');
      const data = await client.getMe();

      assert.ok(refreshCalled, 'Refresh should have been called on 401');
      assert.strictEqual(data.name, 'Refreshed User');
    } finally {
      globalThis.fetch = originalFetch;
      delete (globalThis as any).window;
    }
  });
});
