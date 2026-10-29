import { Metadata } from 'next';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Search,
  History,
  Shield,
  Receipt,
  FileDown,
  DollarSign,
  CalendarPlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GuestBookingDetails } from '@tampilkit-ac/api-contract';

export const metadata: Metadata = {
  title: 'Kelola Status Pemesanan Servis | CoolCare AC Service',
  description: 'Lacak progres dan riwayat reservasi jadwal servis AC Anda.',
};

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:3001';

async function fetchBooking(token: string): Promise<GuestBookingDetails | null> {
  try {
    const res = await fetch(`${BACKEND_INTERNAL_URL}/api/v1/public/bookings/manage?token=${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

async function fetchFinancialSummary(bookingCode: string, token: string) {
  try {
    const res = await fetch(
      `${BACKEND_INTERNAL_URL}/api/v1/public/bookings/${bookingCode}/financial-summary?token=${token}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

function buildGoogleCalendarUrl(booking: GuestBookingDetails, token: string): string {
  const startDate = new Date(booking.scheduledStartAt);
  const durationMinutes = booking.estimatedDurationMinutes || 60;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatUtc = (date: Date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const startUtc = formatUtc(startDate);
  const endUtc = formatUtc(endDate);

  const title = `Servis AC CoolCare - ${booking.serviceName} (${booking.bookingCode})`;

  const fullAddress = [
    booking.serviceAddress.fullAddress,
    booking.serviceAddress.subdistrict,
    booking.serviceAddress.district,
    booking.serviceAddress.city,
    booking.serviceAddress.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const manageUrl = `${siteUrl}/booking/manage?token=${token}`;

  const details = [
    `Pemesanan Servis AC CoolCare`,
    `--------------------------------------`,
    `Kode Pemesanan : ${booking.bookingCode}`,
    `Layanan        : ${booking.serviceName} (${booking.unitCount} Unit AC)`,
    `Alamat Servis  : ${fullAddress}`,
    `Estimasi Biaya : Rp ${Number(booking.estimatedTotal || 0).toLocaleString('id-ID')}`,
    `--------------------------------------`,
    `Lacak status pengerjaan & teknisi:`,
    `${manageUrl}`,
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details,
    location: fullAddress,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface ManagePageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function ManageBookingPage({ searchParams }: ManagePageProps) {
  const params = await searchParams;
  const token = params.token || '';

  const booking = token ? await fetchBooking(token) : null;
  const financial = booking ? await fetchFinancialSummary(booking.bookingCode, token) : null;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Lacak Status Pemesanan Servis
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Pantau status reservasi kedatangan teknisi dan riwayat pengerjaan servis Anda.
          </p>
        </div>

        {/* Input Token Form (jika belum ada token atau token salah) */}
        {!booking && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Masukkan Token Akses Pemesanan
              </CardTitle>
              <CardDescription>
                Token akses rahasia diberikan pada halaman konfirmasi saat Anda pertama kali mengajukan pemesanan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form method="GET" action="/booking/manage" className="flex flex-col sm:flex-row gap-2.5">
                <Input
                  name="token"
                  defaultValue={token}
                  placeholder="Tempel token akses di sini (64 karakter)..."
                  className="h-10 text-xs font-mono"
                  required
                />
                <Button type="submit" className="gap-2 font-medium shrink-0">
                  <Search className="w-4 h-4" /> Cari Pemesanan
                </Button>
              </form>

              {token && !booking && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Token akses tidak valid atau pemesanan tidak ditemukan. Periksa kembali token Anda.</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Booking Details View */}
        {booking && (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 font-medium">KODE PEMESANAN</span>
                  <p className="text-lg font-mono font-bold text-primary tracking-wide">
                    {booking.bookingCode}
                  </p>
                </div>
                <Badge
                  className={
                    booking.status === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : booking.status === 'PENDING'
                      ? 'bg-amber-500 text-white font-semibold'
                      : 'bg-slate-700 text-white font-semibold'
                  }
                >
                  {booking.status === 'CONFIRMED'
                    ? 'Dikonfirmasi'
                    : booking.status === 'PENDING'
                    ? 'Menunggu Konfirmasi'
                    : booking.status}
                </Badge>
              </div>

              <CardContent className="p-5 space-y-5">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Layanan & Jadwal
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{booking.serviceName}</p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {new Date(booking.scheduledStartAt).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {' — '}
                    {new Date(booking.scheduledStartAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </p>
                  <div className="pt-2">
                    <a
                      href={buildGoogleCalendarUrl(booking, token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors shadow-2xs"
                      title="Simpan jadwal servis ini ke Google Calendar Anda"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                      + Simpan ke Google Calendar
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Alamat Kunjungan
                  </span>
                  <p className="text-xs text-slate-700 font-medium mt-1 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {booking.serviceAddress.fullAddress}, {booking.serviceAddress.city}
                    </span>
                  </p>
                </div>

                {/* Timeline Riwayat Status */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-3">
                    <History className="w-3.5 h-3.5 text-primary" /> Riwayat Status Pemesanan
                  </span>

                  <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {booking.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 relative pl-6">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary absolute left-[3px] top-1.5" />
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">
                            Status: <span className="text-primary">{h.toStatus}</span>
                          </p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{h.reason}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {new Date(h.createdAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rincian Finansial & Faktur Tagihan */}
            {financial?.invoice && (
              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold tracking-wide">
                      FAKTUR RESMI #{financial.invoice.invoiceNumber}
                    </span>
                  </div>
                  <Badge
                    className={
                      financial.invoice.status === 'PAID'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : financial.invoice.status === 'PARTIALLY_PAID'
                        ? 'bg-amber-500 text-white font-semibold'
                        : 'bg-sky-600 text-white font-semibold'
                    }
                  >
                    {financial.invoice.status === 'PAID'
                      ? 'Lunas'
                      : financial.invoice.status === 'PARTIALLY_PAID'
                      ? 'Dibayar Sebagian'
                      : 'Menunggu Pembayaran'}
                  </Badge>
                </div>

                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2 text-xs">
                    {financial.invoice.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-700">
                          {item.descriptionSnapshot} ({item.quantity}x)
                        </span>
                        <span className="font-semibold text-slate-900">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(item.lineTotal))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 text-xs border border-slate-100">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Tagihan:</span>
                      <span className="font-bold text-slate-900">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(financial.invoice.grandTotal))}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Total Terbayar:</span>
                      <span>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(financial.invoice.verifiedPaidTotal))}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600 font-bold pt-1 border-t border-slate-200">
                      <span>Sisa yang Harus Dibayar:</span>
                      <span>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(financial.invoice.outstandingBalance))}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <a
                      href={`/api/v1/public/invoices/${financial.invoice.id}/pdf?token=${token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Unduh Dokumen Faktur (PDF)
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center">
              <Link href="/booking">
                <Button variant="outline" className="text-xs">
                  Buat Pemesanan Servis Baru
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
