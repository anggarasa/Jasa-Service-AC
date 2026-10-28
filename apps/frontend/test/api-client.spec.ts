import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, ApiError } from '../src/lib/api/client';
import { HealthDataSchema, ApiSuccessResponse } from '@tampilkit-ac/api-contract';

describe('Frontend API Client Test Suite', () => {
  it('should successfully parse valid ApiSuccessResponse and unwrap data', async () => {
    const mockHealthData = {
      application: 'tampilkit-ac-booking',
      status: 'operational',
      timestamp: '2026-10-28T08:00:00.000Z',
      uptimeSeconds: 120,
      version: '0.1.0',
      dependencies: {
        database: 'connected',
        storage: 'connected',
      },
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: mockHealthData,
          correlationId: 'test-req-123',
        }),
      } as unknown as Response;
    };

    try {
      const client = new ApiClient('http://localhost:3001/api/v1');
      const health = await client.getHealth();

      assert.strictEqual(health.application, 'tampilkit-ac-booking');
      assert.strictEqual(health.status, 'operational');
      assert.strictEqual(health.dependencies.database, 'connected');
      assert.strictEqual(health.dependencies.storage, 'connected');

      // Validate against Zod contract schema
      const validation = HealthDataSchema.safeParse(health);
      assert.strictEqual(validation.success, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should handle API errors and throw normalized ApiError with error details', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input parameter tidak valid.',
          },
          correlationId: 'req-err-456',
        }),
      } as unknown as Response;
    };

    try {
      const client = new ApiClient('http://localhost:3001/api/v1');
      await assert.rejects(
        async () => {
          await client.request('/invalid-path');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.code, 'VALIDATION_ERROR');
          assert.strictEqual(err.message, 'Input parameter tidak valid.');
          assert.strictEqual(err.correlationId, 'req-err-456');
          assert.strictEqual(err.status, 400);
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should throw normalized network error when fetch fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('Connection refused by server');
    };

    try {
      const client = new ApiClient('http://localhost:3001/api/v1');
      await assert.rejects(
        async () => {
          await client.request('/health');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.code, 'NETWORK_ERROR');
          assert.ok(err.message.includes('Connection refused'));
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
