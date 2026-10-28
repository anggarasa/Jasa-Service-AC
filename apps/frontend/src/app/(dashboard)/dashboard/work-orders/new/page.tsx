'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wrench, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import { fetchAdminBookings, fetchTechniciansSchedule } from '@/lib/api/admin-bookings';
import { createWorkOrderFromBooking } from '@/lib/api/work-orders';

export default function NewWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookingId = searchParams.get('bookingId');

  const [eligibleBookings, setEligibleBookings] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBookingId, setSelectedBookingId] = useState(preselectedBookingId || '');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [adminInstructions, setAdminInstructions] = useState('');

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [bookingsRes, techs] = await Promise.all([
          fetchAdminBookings({ page: 1, limit: 50 }),
          fetchTechniciansSchedule({ date: new Date().toISOString().slice(0, 10) }),
        ]);

        // Filter bookings that can have Work Orders (CONFIRMED or ASSIGNED without active WO)
        const eligible = bookingsRes.items.filter(
          (b) =>
            (b.status === 'CONFIRMED' || b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS') &&
            (!b.workOrders || b.workOrders.length === 0 || b.workOrders.every((w: any) => w.status === 'CANCELLED')),
        );

        setEligibleBookings(eligible);
        if (!selectedBookingId && eligible.length > 0) {
          setSelectedBookingId(eligible[0].id);
        }
        setTechnicians(techs);
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat pemesanan.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [selectedBookingId]);

  const activeBooking = eligibleBookings.find((b) => b.id === selectedBookingId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      alert('Pilih pemesanan terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const wo = await createWorkOrderFromBooking({
        bookingId: selectedBookingId,
        technicianId: selectedTechnicianId || activeBooking?.technicianId || undefined,
        adminInstructions: adminInstructions || undefined,
      });

      alert(`Surat Perintah Kerja (SPK) nomor ${wo.workOrderNumber} berhasil diterbitkan!`);
      router.push(`/dashboard/work-orders/${wo.id}`);
    } catch (err: any) {
      setError(err?.message || 'Gagal menerbitkan SPK.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Menyiapkan data penerbitan SPK...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/work-orders">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Terbitkan Surat Perintah Kerja (SPK)
          </h1>
          <p className="text-xs text-muted-foreground">
            Konversi pemesanan servis terkonfirmasi menjadi surat tugas lapangan untuk teknisi.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {eligibleBookings.length === 0 ? (
        <Card className="border-slate-200/80 shadow-sm bg-white p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Tidak ada pemesanan terkonfirmasi yang membutuhkan penerbitan SPK baru saat ini.
          </p>
          <Link href="/dashboard/bookings">
            <Button variant="outline" size="sm">Cek Pemesanan Masuk</Button>
          </Link>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">
                1. Pilih Pemesanan Servis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Daftar Reservasi Siap Dikerjakan</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => {
                    setSelectedBookingId(e.target.value);
                    const b = eligibleBookings.find((x) => x.id === e.target.value);
                    if (b?.technicianId) setSelectedTechnicianId(b.technicianId);
                  }}
                  className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
                  required
                >
                  {eligibleBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingCode} — {b.customer?.name} ({b.service?.name})
                    </option>
                  ))}
                </select>
              </div>

              {activeBooking && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{activeBooking.customer?.name}</span>
                    <Badge variant="outline">{activeBooking.status}</Badge>
                  </div>
                  <p className="text-slate-600">
                    Alamat: {activeBooking.customerAddress?.fullAddress}, Kec. {activeBooking.customerAddress?.district}
                  </p>
                  <p className="text-slate-600">
                    Layanan: {activeBooking.service?.name} • {activeBooking.unitCount} Unit AC
                  </p>
                  <p className="font-medium text-primary">
                    Jadwal: {new Date(activeBooking.scheduledStartAt).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">
                2. Alokasi Teknisi & Instruksi Khusus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Pilih Teknisi Lapangan</label>
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => setSelectedTechnicianId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
                >
                  <option value="">-- {activeBooking?.technicianId ? 'Tetap Menggunakan Teknisi Booking' : 'Pilih Teknisi'} --</option>
                  {technicians.map((t) => (
                    <option key={t.technicianId} value={t.technicianId}>
                      {t.name} ({t.totalOccupancies} tugas aktif hari ini)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Instruksi Khusus Admin untuk Teknisi</label>
                <textarea
                  rows={3}
                  value={adminInstructions}
                  onChange={(e) => setAdminInstructions(e.target.value)}
                  placeholder="Contoh: Harap hubungi pelanggan 30 menit sebelum tiba..."
                  className="w-full rounded-md border border-slate-300 p-2 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/work-orders">
              <Button type="button" variant="outline" size="sm">Batal</Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-primary hover:bg-primary/95 text-white px-6"
            >
              {submitting ? 'Menerbitkan...' : 'Terbitkan Surat Tugas (SPK)'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
