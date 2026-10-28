import {
  ApiSuccessResponse,
  ApiErrorResponse,
  HealthData,
  AuthUser,
  LoginRequest,
  LoginResponseData,
  UpdateProfileRequest,
  ChangePasswordRequest,
  SessionItem,
} from '@tampilkit-ac/api-contract';

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
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
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl.replace(/\/$/, '');
    } else if (typeof window !== 'undefined') {
      this.baseUrl = (
        process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      ).replace(/\/$/, '');
    } else {
      const port = process.env.BACKEND_PORT || '3001';
      this.baseUrl = `http://127.0.0.1:${port}/api/v1`;
    }
  }

  async request<T>(
    endpoint: string,
    options: ApiClientOptions = {},
  ): Promise<T> {
    const {
      timeoutMs = 8000,
      headers = {},
      skipAuthRefresh = false,
      ...customConfig
    } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Routing: Auth endpoints use Next.js BFF proxy /api/auth in browser to preserve Same-Origin cookies
    let url: string;
    if (typeof window !== 'undefined' && cleanEndpoint.startsWith('/auth/')) {
      url = `/api${cleanEndpoint}`;
    } else {
      url = `${this.baseUrl}${cleanEndpoint}`;
      if (
        this.baseUrl.endsWith('/api/v1') &&
        cleanEndpoint.startsWith('/api/v1/')
      ) {
        url = `${this.baseUrl}${cleanEndpoint.replace('/api/v1', '')}`;
      }
    }

    try {
      const isFormData = typeof FormData !== 'undefined' && customConfig.body instanceof FormData;
      const defaultHeaders: Record<string, string> = isFormData
        ? { Accept: 'application/json' }
        : { 'Content-Type': 'application/json', Accept: 'application/json' };

      const response = await fetch(url, {
        ...customConfig,
        credentials: 'include',
        headers: {
          ...defaultHeaders,
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(id);

      // Handle 401 Unauthorized with single-flight automatic refresh
      if (
        response.status === 401 &&
        !skipAuthRefresh &&
        !cleanEndpoint.includes('/auth/login') &&
        !cleanEndpoint.includes('/auth/refresh') &&
        typeof window !== 'undefined'
      ) {
        const refreshSuccess = await this.executeSingleFlightRefresh();
        if (refreshSuccess) {
          // Retry original request once
          return this.request<T>(endpoint, {
            ...options,
            skipAuthRefresh: true,
          });
        }
      }

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
      if (
        parsed &&
        typeof parsed === 'object' &&
        'success' in parsed &&
        parsed.success === true
      ) {
        // If response has top-level pagination alongside an array in data, normalize to { items, pagination }
        if (
          'pagination' in parsed &&
          parsed.pagination &&
          Array.isArray((parsed as any).data)
        ) {
          return {
            items: (parsed as any).data,
            pagination: (parsed as any).pagination,
          } as unknown as T;
        }

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

      const message =
        err instanceof Error ? err.message : 'Koneksi ke backend gagal.';
      throw new ApiError('NETWORK_ERROR', message);
    }
  }

  private async executeSingleFlightRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async getHealth(): Promise<HealthData> {
    return this.request<HealthData>('/health');
  }

  // --- Phase 02 Auth Methods ---
  async login(credentials: LoginRequest): Promise<LoginResponseData> {
    return this.request<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuthRefresh: true,
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  }

  async logoutAll(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout-all', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  }

  async getMe(): Promise<AuthUser> {
    return this.request<AuthUser>('/auth/me');
  }

  async getSessions(): Promise<{ sessions: SessionItem[] }> {
    return this.request<{ sessions: SessionItem[] }>('/auth/sessions');
  }

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async updateProfile(data: UpdateProfileRequest): Promise<AuthUser> {
    return this.request<AuthUser>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuthRefresh: true,
    });
  }
}

export const apiClient = new ApiClient();
