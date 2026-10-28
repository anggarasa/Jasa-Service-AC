import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceCard } from '@/components/public/service-card';
import { ServiceCategoryFilter } from '@/components/public/service-category-filter';
import { EmptyState } from '@/components/public/empty-state';
import { Button } from '@/components/ui/button';
import { getPublicCategories, getPublicServices, getPublicBusiness } from '@/lib/api/public';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  let businessName = 'CoolCare AC Service';
  try {
    const business = await getPublicBusiness();
    businessName = business.name;
  } catch {
    // fallback
  }

  return {
    title: `Katalog Layanan Service AC | ${businessName}`,
    description: `Daftar lengkap layanan perawatan, cuci AC, isi freon, dan instalasi AC dengan harga transparan di ${businessName}.`,
    alternates: {
      canonical: '/services',
    },
  };
}

interface ServicesPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const currentCategory = params.category || '';
  const currentSearch = params.search || '';
  const currentPage = params.page ? parseInt(params.page, 10) : 1;

  const [categoriesRes, servicesRes] = await Promise.allSettled([
    getPublicCategories(),
    getPublicServices({
      category: currentCategory || undefined,
      search: currentSearch || undefined,
      page: currentPage,
      limit: 12,
    }),
  ]);

  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];
  const servicesData =
    servicesRes.status === 'fulfilled'
      ? servicesRes.value
      : { items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } };

  const { items: services, meta } = servicesData;

  return (
    <div className="py-12 lg:py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8 max-w-2xl">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-primary font-medium">Layanan</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Katalog Layanan Servis AC
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Pilih jenis perawatan atau perbaikan yang Anda butuhkan. Seluruh layanan dikerjakan oleh teknisi bersertifikasi dengan alat modern.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <ServiceCategoryFilter
          categories={categories}
          currentCategory={currentCategory}
          currentSearch={currentSearch}
        />

        {/* Service Grid or Empty State */}
        {services.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => {
                  const query = new URLSearchParams();
                  if (currentCategory) query.set('category', currentCategory);
                  if (currentSearch) query.set('search', currentSearch);
                  query.set('page', String(p));

                  const isCurrent = p === meta.page;

                  return (
                    <Button
                      key={p}
                      asChild
                      variant={isCurrent ? 'default' : 'outline'}
                      size="sm"
                      className="w-9 h-9 p-0"
                    >
                      <Link href={`/services?${query.toString()}`}>{p}</Link>
                    </Button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Layanan Tidak Ditemukan"
            description={
              currentSearch || currentCategory
                ? 'Tidak ada layanan yang cocok dengan kriteria pencarian atau kategori yang Anda pilih.'
                : 'Saat ini belum ada layanan aktif yang dipublikasikan.'
            }
            actionHref="/services"
            actionLabel="Reset Semua Filter"
          />
        )}
      </div>
    </div>
  );
}
