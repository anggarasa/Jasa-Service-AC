import {
  ApiSuccessResponse,
  ApiErrorResponse,
  HealthData,
} from '@tampilkit-ac/api-contract';

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly correlationId?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    // In browser, default to '/api/v1' which is proxied by Next.js to backend port 3001
    // In server environment (SSR), use localhost:3001 if available
    if (baseUrl) {
      this.baseUrl = baseUrl.replace(/\/$/, '');
    } else if (typeof window !== 'undefined') {
      this.baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1').replace(/\/$/, '');
    } else {
      const port = process.env.BACKEND_PORT || '3001';
      this.baseUrl = `http://127.0.0.1:${port}/api/v1`;
    }
  }

  async request<T>(
    endpoint: string,
    options: ApiClientOptions = {},
  ): Promise<T> {
    const { timeoutMs = 8000, headers = {}, ...customConfig } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // If baseUrl already includes /api/v1 and endpoint starts with /api/v1, prevent duplication
    let url = `${this.baseUrl}${cleanEndpoint}`;
    if (this.baseUrl.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1/')) {
      url = `${this.baseUrl}${cleanEndpoint.replace('/api/v1', '')}`;
    }

    try {
      const response = await fetch(url, {
        ...customConfig,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(id);

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!isJson) {
        if (!response.ok) {
          throw new ApiError(
            'HTTP_ERROR',
            `Server merespons status ${response.status}`,
            undefined,
            undefined,
            response.status,
          );
        }
        return (await response.text()) as unknown as T;
      }

      const parsed = await response.json();

      if (!response.ok || (parsed && parsed.success === false)) {
        const errorData = (parsed as ApiErrorResponse).error;
        throw new ApiError(
          errorData?.code || 'UNKNOWN_ERROR',
          errorData?.message || `Terjadi kesalahan (HTTP ${response.status})`,
          errorData?.details,
          (parsed as ApiErrorResponse).correlationId,
          response.status,
        );
      }

      // Handle standard ApiSuccessResponse wrapper
      if (parsed && typeof parsed === 'object' && 'success' in parsed && parsed.success === true) {
        return (parsed as ApiSuccessResponse<T>).data;
      }

      return parsed as T;
    } catch (err: unknown) {
      clearTimeout(id);
      if (err instanceof ApiError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(
          'TIMEOUT',
          'Permintaan ke server melebihi batas waktu (timeout).',
        );
      }

      const message = err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
      throw new ApiError('NETWORK_ERROR', message);
    }
  }

  async getHealth(): Promise<HealthData> {
    return this.request<HealthData>('/health');
  }
}

export const apiClient = new ApiClient();
