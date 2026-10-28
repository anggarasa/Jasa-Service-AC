import { MetadataRoute } from 'next';
import { getPublicServices } from '@/lib/api/public';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/service-areas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/booking`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    const { items: services } = await getPublicServices({ limit: 100 });
    const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
      url: `${siteUrl}/services/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...serviceRoutes];
  } catch {
    return staticRoutes;
  }
}
