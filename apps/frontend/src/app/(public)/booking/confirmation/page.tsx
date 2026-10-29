import { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Calendar,
  CalendarPlus,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPublicBusiness } from '@/lib/api/public';
import { GuestBookingDetails } from '@tampilkit-ac/api-contract';

export const metadata: Metadata = {
  title: 'Konfirmasi Pemesanan Servis AC | CoolCare AC Service',
  description: 'Tiket konfirmasi dan status reservasi pemesanan servis AC Anda di CoolCare.',
};

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:3001';

async function fetchBookingDetails(token: string): Promise<GuestBookingDetails | null> {
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

function buildGoogleCalendarUrl(booking: GuestBookingDetails, token: string): string {
  const startDate = new Date(booking.scheduledStartAt);
  const durationMinutes = booking.estimatedDurationMinutes || 60;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const startUtc = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endUtc = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const title = `Servis AC CoolCare - ${booking.serviceName} (${booking.bookingCode})`;

  const fullAddress = [
    booking.serviceAddress.fullAddress,
    booking.serviceAddress.district,
    booking.serviceAddress.city,
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

interface ConfirmationPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const token = params.token || '';

  const [booking, business] = await Promise.all([
    token ? fetchBookingDetails(token) : Promise.resolve(null),
    getPublicBusiness().catch(() => null),
  ]);

  if (!booking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50">
        <Card className="max-w-md w-full text-center p-6 border-slate-200">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Tiket Pemesanan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-600 mb-6">
            Tautan konfirmasi tidak valid atau telah kedaluwarsa. Silakan periksa kembali tautan yang Anda terima.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/booking">
              <Button className="w-full">Buat Pemesanan Baru</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">Kembali ke Beranda</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';
  const gcalUrl = buildGoogleCalendarUrl(booking, token);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Banner Status */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-2 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isConfirmed ? 'Pemesanan Berhasil Dikonfirmasi!' : 'Pemesanan Berhasil Diajukan!'}
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            {isConfirmed
              ? 'Jadwal kunjungan teknisi telah dikonfirmasi secara otomatis. Teknisi kami akan datang sesuai jadwal.'
              : 'Pemesanan Anda telah kami terima dan kapasitas teknisi telah diamankan. Admin CoolCare akan segera memverifikasi pesanan Anda.'}
          </p>
        </div>

        {/* Card Tiket Detail */}
        <Card className="border-slate-200 shadow-md overflow-hidden">
          <div className="bg-primary/5 p-4 border-b border-primary/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 font-medium">KODE PEMESANAN</span>
              <p className="text-lg font-mono font-bold text-primary tracking-wide">
                {booking.bookingCode}
              </p>
            </div>
            <Badge
              className={
                isConfirmed
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-amber-500 text-white font-semibold'
              }
            >
              {isConfirmed ? 'Dikonfirmasi' : 'Menunggu Konfirmasi Admin'}
            </Badge>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Layanan & Unit */}
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Layanan Servis
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">{booking.serviceName}</p>
              <div className="mt-2 space-y-1.5">
                {booking.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <span className="font-medium text-slate-800">
                      Unit #{idx + 1}: {item.brandSnapshot || 'Standar'} ({item.capacityPkSnapshot || '1.0'} PK)
                    </span>
                    <span className="text-slate-500">{item.installationRoomSnapshot || 'Ruangan'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Jadwal & Lokasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Jadwal Kunjungan
                </span>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {new Date(booking.scheduledStartAt).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  {new Date(booking.scheduledStartAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  WIB (~{booking.estimatedDurationMinutes} menit)
                </p>
                <div className="pt-2">
                  <a
                    href={gcalUrl}
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

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Alamat Servis
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    {booking.serviceAddress.fullAddress}, {booking.serviceAddress.city}
                  </span>
                </p>
              </div>
            </div>

            {/* Estimasi Biaya */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Rincian Estimasi Biaya
              </span>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Biaya Servis ({booking.unitCount} unit)</span>
                <span className="font-medium text-slate-800">
                  {booking.estimatedServicePrice
                    ? `Rp ${Number(booking.estimatedServicePrice).toLocaleString('id-ID')}`
                    : 'Pengecekan Fisik'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Ongkos Kunjungan</span>
                <span className="font-medium text-slate-800">
                  Rp {Number(booking.visitFee).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Estimasi Total Pembayaran</span>
                <span className="text-primary text-base">
                  {booking.estimatedTotal
                    ? `Rp ${Number(booking.estimatedTotal).toLocaleString('id-ID')}`
                    : `Rp ${Number(booking.visitFee).toLocaleString('id-ID')} + Perbaikan`}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                <CreditCard className="w-3.5 h-3.5" /> Pembayaran dilakukan di tempat setelah pekerjaan selesai.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Link href={`/booking/manage?token=${token}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-2 text-xs">
                Lihat Riwayat & Status Tiket <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors shadow-2xs"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
              Simpan ke Google Calendar
            </a>
          </div>

          {business?.whatsappNumber && (
            <a
              href={`https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(
                `Halo CoolCare, saya ingin konfirmasi pesanan dengan kode ${booking.bookingCode}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> Hubungi CS WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
