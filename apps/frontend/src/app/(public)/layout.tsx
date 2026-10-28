import { getPublicBusiness } from '@/lib/api/public';
import { Navbar } from '@/components/layouts/navbar';
import { Footer } from '@/components/layouts/footer';
import { PublicBusiness } from '@tampilkit-ac/api-contract';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let business: PublicBusiness | null = null;
  try {
    business = await getPublicBusiness();
  } catch {
    business = null;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <Navbar
        businessName={business?.name}
        phone={business?.phone}
        whatsappNumber={business?.whatsappNumber}
        logoUrl={business?.logoMediaUrl}
      />
      <main className="flex-1">{children}</main>
      <Footer business={business} />
    </div>
  );
}
