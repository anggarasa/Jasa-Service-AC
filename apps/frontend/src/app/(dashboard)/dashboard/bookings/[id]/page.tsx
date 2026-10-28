'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  UserCheck,
  CalendarClock,
  Ban,
  FileEdit,
  FileText,
  Wrench,
  AlertCircle,
  History,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchAdminBookingDetail,
  confirmAdminBooking,
  rejectAdminBooking,
  assignBookingTechnician,
  reassignBookingTechnician,
  rescheduleAdminBooking,
  cancelAdminBooking,
  updateAdminBookingInternalNotes,
  fetchTechniciansSchedule,
} from '@/lib/api/admin-bookings';
import { createWorkOrderFromBooking } from '@/lib/api/work-orders';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  const router = useRouter();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Action states
  const [activeModal, setActiveModal] = useState<
    'CONFIRM' | 'REJECT' | 'ASSIGN' | 'REASSIGN' | 'RESCHEDULE' | 'CANCEL' | 'NOTES' | 'CREATE_WO' | null
  >(null);
  const [actionReason, setActionReason] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [internalNotesText, setInternalNotesText] = useState('');
  const [adminInstructionsText, setAdminInstructionsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [techniciansList, setTechniciansList] = useState<any[]>([]);

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminBookingDetail(bookingId);
      setBooking(res);
      setInternalNotesText(res.internalNotes || '');
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat detail pemesanan.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const loadTechnicians = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const list = await fetchTechniciansSchedule({ date: today });
      setTechniciansList(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadBooking();
    loadTechnicians();
  }, [loadBooking]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (activeModal === 'CONFIRM') {
        await confirmAdminBooking(bookingId, {
          technicianId: selectedTechnicianId || undefined,
          internalNotes: internalNotesText || undefined,
        });
      } else if (activeModal === 'REJECT') {
        if (!actionReason.trim()) throw new Error('Alasan penolakan wajib diisi');
        await rejectAdminBooking(bookingId, { reason: actionReason });
      } else if (activeModal === 'ASSIGN') {
        if (!selectedTechnicianId) throw new Error('Pilih teknisi terlebih dahulu');
        await assignBookingTechnician(bookingId, {
          technicianId: selectedTechnicianId,
          notes: actionReason || undefined,
        });
      } else if (activeModal === 'REASSIGN') {
        if (!selectedTechnicianId) throw new Error('Pilih teknisi pengganti');
        if (!actionReason.trim()) throw new Error('Alasan pengalihan wajib diisi');
        await reassignBookingTechnician(bookingId, {
          technicianId: selectedTechnicianId,
          reason: actionReason,
        });
      } else if (activeModal === 'RESCHEDULE') {
        if (!rescheduleDate) throw new Error('Pilih tanggal dan waktu baru');
        if (!actionReason.trim()) throw new Error('Alasan penjadwalan ulang wajib diisi');
        const iso = new Date(rescheduleDate).toISOString();
        await rescheduleAdminBooking(bookingId, {
          newStartAt: iso,
          technicianId: selectedTechnicianId || undefined,
          reason: actionReason,
        });
      } else if (activeModal === 'CANCEL') {
        if (!actionReason.trim()) throw new Error('Alasan pembatalan wajib diisi');
        await cancelAdminBooking(bookingId, { reason: actionReason });
      } else if (activeModal === 'NOTES') {
        await updateAdminBookingInternalNotes(bookingId, {
          internalNotes: internalNotesText,
        });
      } else if (activeModal === 'CREATE_WO') {
        const wo = await createWorkOrderFromBooking({
          bookingId,
          technicianId: selectedTechnicianId || booking.technicianId || undefined,
          adminInstructions: adminInstructionsText || undefined,
        });
        setActiveModal(null);
        alert(`Surat Perintah Kerja (SPK) nomor ${wo.workOrderNumber} berhasil diterbitkan!`);
        router.push(`/dashboard/work-orders/${wo.id}`);
        return;
      }

      setActiveModal(null);
      setActionReason('');
      await loadBooking();
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses aksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Menunggu (Pending)</Badge>;
      case 'CONFIRMED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Dikonfirmasi (Confirmed)</Badge>;
      case 'ASSIGNED':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">Ditugaskan (Assigned)</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Dikerjakan (In Progress)</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">Selesai (Completed)</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300">Dibatalkan (Cancelled)</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Ditolak (Rejected)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatRupiah = (val?: number | string | null) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Memuat detail pemesanan...</div>;
  }

  if (error || !booking) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-destructive font-medium">{error || 'Pemesanan tidak ditemukan'}</p>
        <Link href="/dashboard/bookings">
          <Button variant="outline" size="sm">Kembali ke Daftar</Button>
        </Link>
      </div>
    );
  }

  const startDate = new Date(booking.scheduledStartAt);
  const endDate = new Date(booking.scheduledEndAt);
  const canModify = !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status);
  const activeWorkOrder = booking.workOrders?.find((w: any) => w.status !== 'CANCELLED');

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/bookings">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                {booking.bookingCode}
              </h1>
              {getStatusBadge(booking.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              Dibuat pada {new Date(booking.createdAt).toLocaleString('id-ID')} • Sumber: {booking.bookingSource}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        {canModify && (
          <div className="flex flex-wrap items-center gap-2">
            {booking.status === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setActiveModal('CONFIRM')}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Konfirmasi
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setActiveModal('REJECT')}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Tolak
                </Button>
              </>
            )}

            {!booking.technicianId && booking.status !== 'PENDING' && (
              <Button
                size="sm"
                variant="outline"
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => setActiveModal('ASSIGN')}
              >
                <UserCheck className="w-4 h-4 mr-1.5" /> Tugaskan Teknisi
              </Button>
            )}

            {booking.technicianId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveModal('REASSIGN')}
              >
                <UserCheck className="w-4 h-4 mr-1.5" /> Alihkan Teknisi
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveModal('RESCHEDULE')}
            >
              <CalendarClock className="w-4 h-4 mr-1.5" /> Jadwalkan Ulang
            </Button>

            {!activeWorkOrder && (booking.status === 'CONFIRMED' || booking.status === 'ASSIGNED') && (
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setActiveModal('CREATE_WO')}
              >
                <Wrench className="w-4 h-4 mr-1.5" /> Terbitkan SPK
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={() => setActiveModal('CANCEL')}
            >
              <Ban className="w-4 h-4 mr-1.5" /> Batalkan
            </Button>
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Service Details, Units & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Booking Summary Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
                <span>Rincian Layanan Servis</span>
                <span className="text-sm font-normal text-slate-500">
                  Reschedule: {booking.rescheduleCount} kali
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Jenis Layanan</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {booking.service?.name || booking.serviceNameSnapshot}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jadwal Janji Temu</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {startDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })},{' '}
                    {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Unit</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {booking.unitCount} Unit AC
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimasi Servis</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(booking.estimatedServicePrice || booking.estimatedPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Biaya Kunjungan Wilayah</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(booking.visitFeeSnapshot)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Estimasi Tagihan</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {formatRupiah(booking.estimatedTotal)}
                  </span>
                </div>
              </div>

              {booking.customerNotes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-amber-800 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Catatan / Keluhan Pelanggan:
                  </span>
                  <p className="text-amber-900">{booking.customerNotes}</p>
                </div>
              )}

              {booking.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-red-800">Alasan Penolakan:</span>
                  <p className="text-red-900">{booking.rejectionReason}</p>
                </div>
              )}

              {booking.cancellationReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-rose-800">Alasan Pembatalan:</span>
                  <p className="text-rose-900">{booking.cancellationReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unit AC List Snapshot Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">
                Daftar Unit AC yang Didaftarkan ({booking.bookingItems?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {booking.bookingItems?.map((item: any, idx: number) => (
                  <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 block text-sm">
                        Unit #{idx + 1}: {item.brandSnapshot || 'Merk AC'} {item.modelSnapshot || ''} ({item.typeSnapshot})
                      </span>
                      <p className="text-slate-500">
                        Kapasitas: {item.capacityPkSnapshot ? `${item.capacityPkSnapshot} PK` : 'Standar'} • Lokasi: {item.installationRoomSnapshot || 'Ruangan Pelanggan'}
                      </p>
                      {item.notes && <p className="text-slate-400 italic">Keluhan: {item.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-slate-700">{formatRupiah(item.unitPriceSnapshot)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Linked Work Orders */}
          {booking.workOrders?.length > 0 && (
            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  Surat Perintah Kerja (SPK) Terkait
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {booking.workOrders.map((wo: any) => (
                    <div key={wo.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-semibold text-slate-900 block text-sm">
                          {wo.workOrderNumber}
                        </span>
                        <p className="text-slate-500">
                          Teknisi: {wo.technician?.user?.name || 'Belum ditugaskan'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{wo.status}</Badge>
                        <Link href={`/dashboard/work-orders/${wo.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            Buka SPK
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Logs & Status History */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                Histori Perubahan & Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="divide-y divide-slate-100 text-xs">
                {booking.auditLogs?.map((log: any) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 block">
                        Aksi: {log.action}
                      </span>
                      {log.details && (
                        <p className="text-slate-500 font-mono text-[11px]">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-slate-400 shrink-0 text-[11px]">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Customer Info, Technician & Notes */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Nama Lengkap</span>
                <span className="font-semibold text-slate-800 text-sm">{booking.customer?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">WhatsApp / Telepon</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> {booking.customer?.phone}
                </span>
              </div>
              {booking.customer?.email && (
                <div>
                  <span className="text-slate-500 block">Email</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {booking.customer?.email}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block">Alamat Servis</span>
                <span className="font-medium text-slate-800 block mt-0.5">
                  {booking.customerAddress?.fullAddress}
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Kec. {booking.customerAddress?.district}, {booking.customerAddress?.city}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Technician Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Teknisi Lapangan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              {booking.technician ? (
                <div>
                  <span className="font-semibold text-slate-900 text-sm block">
                    {booking.technician.user?.name}
                  </span>
                  <p className="text-slate-500 mt-0.5">{booking.technician.user?.email}</p>
                </div>
              ) : (
                <div className="text-center py-2 text-muted-foreground">
                  <p>Belum ada teknisi yang dialokasikan.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-slate-600" />
                Catatan Internal Admin
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary"
                onClick={() => setActiveModal('NOTES')}
              >
                Ubah
              </Button>
            </CardHeader>
            <CardContent className="p-4 text-xs">
              {booking.internalNotes ? (
                <p className="text-slate-700 whitespace-pre-wrap">{booking.internalNotes}</p>
              ) : (
                <p className="text-slate-400 italic">Tidak ada catatan internal.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog / Modal Popups */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {activeModal === 'CONFIRM' && 'Konfirmasi Pemesanan'}
              {activeModal === 'REJECT' && 'Tolak Pemesanan'}
              {activeModal === 'ASSIGN' && 'Tugaskan Teknisi'}
              {activeModal === 'REASSIGN' && 'Alihkan Teknisi'}
              {activeModal === 'RESCHEDULE' && 'Jadwalkan Ulang Pemesanan'}
              {activeModal === 'CANCEL' && 'Batalkan Pemesanan'}
              {activeModal === 'NOTES' && 'Perbarui Catatan Internal'}
              {activeModal === 'CREATE_WO' && 'Terbitkan Surat Perintah Kerja (SPK)'}
            </h3>

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              {/* Select Technician Dropdown */}
              {(activeModal === 'CONFIRM' || activeModal === 'ASSIGN' || activeModal === 'REASSIGN' || activeModal === 'RESCHEDULE' || activeModal === 'CREATE_WO') && (
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Pilih Teknisi Lapangan</label>
                  <select
                    value={selectedTechnicianId}
                    onChange={(e) => setSelectedTechnicianId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
                  >
                    <option value="">-- {activeModal === 'CONFIRM' ? 'Tugaskan Nanti' : 'Pilih Teknisi'} --</option>
                    {techniciansList.map((t) => (
                      <option key={t.technicianId} value={t.technicianId}>
                        {t.name} ({t.totalOccupancies} tugas aktif hari ini)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reschedule DateTime */}
              {activeModal === 'RESCHEDULE' && (
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Jadwal Tanggal & Jam Baru</label>
                  <Input
                    type="datetime-local"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Reason / Notes */}
              {(activeModal === 'REJECT' || activeModal === 'CANCEL' || activeModal === 'REASSIGN' || activeModal === 'RESCHEDULE') && (
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Alasan Tindakan (Wajib)</label>
                  <textarea
                    rows={3}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Tuliskan alasan tindakan ini secara jelas..."
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                    required
                  />
                </div>
              )}

              {activeModal === 'NOTES' && (
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Catatan Internal</label>
                  <textarea
                    rows={4}
                    value={internalNotesText}
                    onChange={(e) => setInternalNotesText(e.target.value)}
                    placeholder="Tuliskan catatan internal untuk tim admin..."
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>
              )}

              {activeModal === 'CREATE_WO' && (
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Instruksi Khusus untuk Teknisi (Opsional)</label>
                  <textarea
                    rows={3}
                    value={adminInstructionsText}
                    onChange={(e) => setAdminInstructionsText(e.target.value)}
                    placeholder="Contoh: Harap cek kebocoran freon pada unit kamar utama..."
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/95 text-white"
                >
                  {submitting ? 'Memproses...' : 'Simpan & Terapkan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
