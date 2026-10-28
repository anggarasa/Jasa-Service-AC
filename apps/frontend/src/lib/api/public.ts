import {
  PublicBusiness,
  PublicOperatingHours,
  PublicCategory,
  PublicServiceItem,
  PublicServiceDetail,
  PublicServiceArea,
  PublicGalleryItem,
  PaginationMeta,
} from '@tampilkit-ac/api-contract';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  const backendPort = process.env.BACKEND_PORT || '3001';
  return `http://127.0.0.1:${backendPort}/api/v1`;
};

interface FetchOptions extends RequestInit {
  revalidate?: number;
}

async function fetchPublic<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate = 60, ...customConfig } = options;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...customConfig,
      headers: {
        Accept: 'application/json',
        ...(customConfig.headers || {}),
      },
      next: { revalidate },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('NOT_FOUND');
      }
      throw new Error(`HTTP error ${res.status}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      throw err;
    }
    // Fallback/log
    throw err;
  }
}

export async function getPublicBusiness(): Promise<PublicBusiness> {
  return fetchPublic<PublicBusiness>('/public/business');
}

export async function getPublicOperatingHours(): Promise<PublicOperatingHours> {
  return fetchPublic<PublicOperatingHours>('/public/operating-hours');
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  return fetchPublic<PublicCategory[]>('/public/service-categories');
}

export async function getPublicServices(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: PublicServiceItem[]; meta: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return fetchPublic<{ items: PublicServiceItem[]; meta: PaginationMeta }>(
    `/public/services${qs ? `?${qs}` : ''}`,
  );
}

export async function getPublicServiceBySlug(slug: string): Promise<PublicServiceDetail> {
  return fetchPublic<PublicServiceDetail>(`/public/services/${encodeURIComponent(slug)}`);
}

export async function getPublicServiceAreas(): Promise<PublicServiceArea[]> {
  return fetchPublic<PublicServiceArea[]>('/public/service-areas');
}

export async function getPublicGallery(): Promise<PublicGalleryItem[]> {
  return fetchPublic<PublicGalleryItem[]>('/public/gallery');
}
