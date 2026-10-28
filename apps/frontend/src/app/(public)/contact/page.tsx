import { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/public/whatsapp-button';
import { getPublicBusiness, getPublicOperatingHours } from '@/lib/api/public';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  let businessName = 'CoolCare AC Service';
  try {
    const b = await getPublicBusiness();
    businessName = b.name;
  } catch {
    // fallback
  }

  return {
    title: `Kontak & Jam Operasional | ${businessName}`,
    description: `Hubungi layanan pelanggan ${businessName} via telepon, WhatsApp, atau email. Cek jadwal jam kerja operasional kantor dan teknisi kami.`,
    alternates: {
      canonical: '/contact',
    },
  };
}

const DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export default async function ContactPage() {
  const [businessRes, hoursRes] = await Promise.allSettled([
    getPublicBusiness(),
    getPublicOperatingHours(),
  ]);

  const business = businessRes.status === 'fulfilled' ? businessRes.value : null;
  const hoursData = hoursRes.status === 'fulfilled' ? hoursRes.value : null;

  const businessName = business?.name || 'CoolCare AC Service';
  const phone = business?.phone || '+62 812-3456-7890';
  const whatsappNumber = business?.whatsappNumber || '6281234567890';
  const email = business?.email || 'halo@coolcare.id';
  const address = business?.address || 'Jl. Merdeka No. 45';
  const city = business?.city || 'Jakarta Selatan';
  const province = business?.province || 'DKI Jakarta';
  const postalCode = business?.postalCode || '12160';
  const googleMapsUrl = business?.googleMapsUrl;

  const schedule = hoursData?.schedule || [];
  const closures = hoursData?.upcomingClosures || [];

  return (
    <div className="py-12 lg:py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
        {/* Header Breadcrumb & Title */}
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-primary font-medium">Kontak</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Hubungi Layanan Pelanggan
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Punya pertanyaan mengenai kondisi AC Anda, estimasi biaya servis, atau ingin menjadwalkan inspeksi teknisi? Tim kami siap melayani Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Contact Cards */}
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-primary pb-3 border-b border-slate-100">
                Informasi Kantor & Kontak
              </h2>

              <div className="space-y-5 text-sm text-slate-700">
                {/* Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold text-primary">Alamat Operasional</span>
                    <p className="text-muted-foreground leading-relaxed">
                      {address}, {city}, {province} {postalCode && `(${postalCode})`}
                    </p>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline pt-1"
                      >
                        <span>Buka di Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold text-primary">Chat WhatsApp (Respons Cepat)</span>
                    <p className="text-muted-foreground">+{whatsappNumber.replace(/\D/g, '')}</p>
                    <WhatsAppButton
                      phone={whatsappNumber}
                      size="sm"
                      label="Kirim Pesan WhatsApp"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-semibold text-primary">Telepon Kantor</span>
                    <a
                      href={`tel:${phone.replace(/\s+/g, '')}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-semibold text-primary">Email Resmi</span>
                    <a
                      href={`mailto:${email}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Operating Hours Schedule */}
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold text-primary">Jadwal Jam Operasional</h2>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {hoursData?.timezone || 'Asia/Jakarta'} (WIB)
                </span>
              </div>

              {schedule.length > 0 ? (
                <div className="divide-y divide-slate-100 text-sm">
                  {schedule.map((item) => {
                    const dayLabel = DAY_NAMES[item.dayOfWeek] || `Hari ${item.dayOfWeek}`;

                    return (
                      <div key={item.dayOfWeek} className="py-3 flex items-start justify-between gap-4">
                        <span className="font-semibold text-slate-800 w-28">{dayLabel}</span>
                        <div className="text-right">
                          {item.isOpen ? (
                            <div>
                              <span className="font-medium text-primary">
                                {item.openTime} – {item.closeTime} WIB
                              </span>
                              {item.breaks && item.breaks.length > 0 && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Istirahat:{' '}
                                  {item.breaks
                                    .map((b) => `${b.startTime}–${b.endTime}`)
                                    .join(', ')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                              Tutup Operasional
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Jadwal operasional belum dikonfigurasi.</p>
              )}

              {/* Upcoming Closures Notice */}
              {closures.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Jadwal Libur & Penutupan Mendatang</span>
                  </div>
                  <div className="space-y-1.5">
                    {closures.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900"
                      >
                        <p className="font-semibold">{c.reason}</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          {new Date(c.startDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}{' '}
                          s/d{' '}
                          {new Date(c.endDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
