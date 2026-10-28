'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchTechnicianWorkOrderDetail,
  startJourney,
  arriveWorkOrder,
  startWork,
  completeWorkOrder,
  followUpWorkOrder,
} from '@/lib/api/technician';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  Wrench,
  CheckCircle2,
  Camera,
  ClipboardList,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Play,
  Check,
  HelpCircle,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; desc: string }> = {
  ASSIGNED: {
    label: 'Ditugaskan',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'SPK telah diterima dan siap untuk perjalanan menuju lokasi pelanggan.',
  },
  ON_THE_WAY: {
    label: 'Dalam Perjalanan',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Teknisi sedang menuju lokasi. Segera lakukan check-in saat tiba.',
  },
  ARRIVED: {
    label: 'Tiba di Lokasi',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    desc: 'Teknisi telah tiba. Lakukan koordinasi dengan pelanggan dan mulai servis.',
  },
  IN_PROGRESS: {
    label: 'Sedang Dikerjakan',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Servis AC berlangsung. Isi inspeksi, checklist, foto, dan laporan.',
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Seluruh pekerjaan dan inspeksi telah dituntaskan.',
  },
  FOLLOW_UP_REQUIRED: {
    label: 'Perlu Tindak Lanjut',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    desc: 'Membutuhkan kunjungan lanjutan atau suku cadang tambahan.',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'SPK telah dibatalkan.',
  },
};

export default function TechnicianJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals / dialog states
  const [arriveModalOpen, setArriveModalOpen] = useState(false);
  const [arriveNotes, setArriveNotes] = useState('');

  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [customerSignName, setCustomerSignName] = useState('');
  const [technicianSignName, setTechnicianSignName] = useState('');

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTechnicianWorkOrderDetail(id);
      setJob(res);
      if (res.serviceReport?.customerSignedName) {
        setCustomerSignName(res.serviceReport.customerSignedName);
      }
      if (res.serviceReport?.technicianSignedName) {
        setTechnicianSignName(res.serviceReport.technicianSignedName);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail pekerjaan SPK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  const handleStartJourney = async () => {
    try {
      setActionLoading(true);
      await startJourney(id);
      await loadJob();
    } catch (err: any) {
      alert(err.message || 'Gagal memulai perjalanan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrive = async () => {
    try {
      setActionLoading(true);
      await arriveWorkOrder(id, { notes: arriveNotes });
      setArriveModalOpen(false);
      await loadJob();
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan check-in kedatangan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setActionLoading(true);
      await startWork(id, {});
      await loadJob();
    } catch (err: any) {
      alert(err.message || 'Gagal memulai pekerjaan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpReason.trim()) {
      alert('Alasan tindak lanjut wajib diisi');
      return;
    }
    try {
      setActionLoading(true);
      await followUpWorkOrder(id, {
        reason: followUpReason,
        notes: followUpNotes,
      });
      setFollowUpModalOpen(false);
      await loadJob();
    } catch (err: any) {
      alert(err.message || 'Gagal mengajukan status tindak lanjut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      await completeWorkOrder(id, {
        technicianNotes: completeNotes,
        customerSignedName: customerSignName,
        technicianSignedName: technicianSignName,
      });
      setCompleteModalOpen(false);
      await loadJob();
    } catch (err: any) {
      alert(err.message || 'Gagal menyelesaikan SPK. Periksa kelengkapan checklist & laporan servis.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-slate-500 font-medium">Memuat detail SPK...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>Gagal Memuat Detail SPK</span>
        </div>
        <p className="text-xs text-red-600">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs">
            Kembali
          </Button>
          <Button size="sm" onClick={loadJob} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[job.status] || {
    label: job.status,
    color: 'bg-slate-100 text-slate-800',
    desc: '',
  };

  const scheduledDate = new Date(job.scheduledStartAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const scheduledTime = new Date(job.scheduledStartAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const cleanPhone =
    job.customer.normalizedPhone?.replace('+', '') ||
    job.customer.phone?.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Halo Bapak/Ibu ${job.customer.name}, saya teknisi CoolCare AC Service untuk SPK ${job.workOrderNumber}.`,
  )}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${job.customerAddress.fullAddress}, ${job.customerAddress.district}`,
  )}`;

  // Checklist counts
  let totalChecklist = 0;
  let doneChecklist = 0;
  job.items.forEach((item: any) => {
    if (item.checklistItems) {
      totalChecklist += item.checklistItems.length;
      doneChecklist += item.checklistItems.filter(
        (c: any) => c.status === 'DONE' || c.status === 'NOT_APPLICABLE',
      ).length;
    }
  });

  // Inspections count
  const inspectedUnits = job.items.filter(
    (item: any) => item.inspection && item.inspection.inspectionStatus !== 'NOT_INSPECTED',
  ).length;

  return (
    <div className="space-y-5 pb-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/technician/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar SPK
        </Link>
        <Button variant="ghost" size="sm" onClick={loadJob} className="text-xs text-slate-600">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Segarkan
        </Button>
      </div>

      {/* Main Status Header Card */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs font-semibold text-primary">
                {job.workOrderNumber}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {job.customer.name}
              </h1>
            </div>
            <div className="self-start sm:self-auto">
              <Badge variant="outline" className={`text-xs px-3 py-1 font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-slate-500">{statusInfo.desc}</p>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 font-medium text-slate-800">
              <Clock className="w-4 h-4 text-primary" />
              <span>
                {scheduledDate} • {scheduledTime} WIB
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-slate-400" />
              <span>{job.items.length} Unit AC Layanan</span>
            </div>
          </div>
        </div>

        {/* Primary Action Workflow Bar */}
        <div className="bg-slate-50 border-t border-slate-200/80 p-3 sm:p-4">
          {job.status === 'ASSIGNED' && (
            <Button
              className="w-full text-xs font-semibold h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              disabled={actionLoading}
              onClick={handleStartJourney}
            >
              <Navigation className="w-4 h-4 mr-1.5" /> Mulai Perjalanan Menuju Lokasi Pelanggan
            </Button>
          )}

          {job.status === 'ON_THE_WAY' && (
            <Button
              className="w-full text-xs font-semibold h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              disabled={actionLoading}
              onClick={() => setArriveModalOpen(true)}
            >
              <MapPin className="w-4 h-4 mr-1.5" /> Check-in: Tiba di Lokasi Pelanggan
            </Button>
          )}

          {job.status === 'ARRIVED' && (
            <Button
              className="w-full text-xs font-semibold h-11 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              disabled={actionLoading}
              onClick={handleStartWork}
            >
              <Play className="w-4 h-4 mr-1.5" /> Mulai Pengerjaan Servis AC di Lokasi
            </Button>
          )}

          {job.status === 'IN_PROGRESS' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                className="flex-1 text-xs font-semibold h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                disabled={actionLoading}
                onClick={() => setCompleteModalOpen(true)}
              >
                <Check className="w-4 h-4 mr-1.5" /> Selesaikan Pekerjaan SPK
              </Button>
              <Button
                variant="outline"
                className="text-xs font-semibold h-11 text-rose-700 border-rose-300 hover:bg-rose-50"
                disabled={actionLoading}
                onClick={() => setFollowUpModalOpen(true)}
              >
                <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600" /> Butuh Tindak Lanjut
              </Button>
            </div>
          )}

          {job.status === 'COMPLETED' && (
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2.5 rounded-lg text-xs font-medium border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Pekerjaan SPK telah diselesaikan pada{' '}
                {job.completedAt ? new Date(job.completedAt).toLocaleString('id-ID') : '-'}
              </span>
            </div>
          )}

          {job.status === 'FOLLOW_UP_REQUIRED' && (
            <div className="space-y-1.5 text-xs text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-200">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>SPK Memerlukan Tindak Lanjut</span>
              </div>
              <p className="text-slate-700 font-medium">{job.followUpReason}</p>
              {job.followUpNotes && (
                <p className="text-slate-500 text-[11px]">{job.followUpNotes}</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Field Execution Action Hub */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Pelaksanaan Pekerjaan Lapangan
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Inspeksi */}
          <Link
            href={`/technician/jobs/${job.id}/inspection`}
            className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px]">
                {inspectedUnits}/{job.items.length} Unit
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Inspeksi Teknis</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Kondisi & diagnosa AC</p>
            </div>
          </Link>

          {/* 2. Checklist */}
          <Link
            href={`/technician/jobs/${job.id}/checklist`}
            className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px]">
                {doneChecklist}/{totalChecklist} Item
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Checklist Servis</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Standar pengerjaan</p>
            </div>
          </Link>

          {/* 3. Photos */}
          <Link
            href={`/technician/jobs/${job.id}/photos`}
            className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px]">
                {job.photos?.length || 0} Foto
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Dokumentasi Foto</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Before & After</p>
            </div>
          </Link>

          {/* 4. Report */}
          <Link
            href={`/technician/jobs/${job.id}/report`}
            className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px]">
                {job.serviceReport ? 'Tersimpan' : 'Draft'}
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Laporan Servis</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Ringkasan & TTD</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Customer Contact & Address Card */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Informasi Pelanggan & Lokasi Servis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Nama Pelanggan:</span>
            <p className="font-bold text-slate-900 text-sm">{job.customer.name}</p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Alamat Lengkap:</span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {job.customerAddress.fullAddress}
            </p>
            <p className="text-slate-500 mt-0.5">
              {job.customerAddress.district}, {job.customerAddress.city}
            </p>
            {job.customerAddress.landmark && (
              <p className="text-amber-700 bg-amber-50 p-2 rounded mt-1">
                Patokan/Catatan: {job.customerAddress.landmark}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <a
              href={`tel:${job.customer.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-lg transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Telepon ({job.customer.phone})
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200 py-2 px-3 rounded-lg transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" /> Chat WhatsApp
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-800 bg-blue-100/70 hover:bg-blue-200 py-2 px-3 rounded-lg transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-700" /> Buka Navigasi Rute (Google Maps)
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Unit AC List */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            Daftar Unit AC pada SPK Ini ({job.items.length} Unit)
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {job.items.map((item: any, idx: number) => {
            const hasInspection =
              item.inspection && item.inspection.inspectionStatus !== 'NOT_INSPECTED';

            return (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">
                      Unit #{idx + 1} — {item.serviceNameSnapshot}
                    </span>
                    {item.acUnit && (
                      <p className="text-slate-600 font-mono text-[11px]">
                        {item.acUnit.brand} {item.acUnit.model || ''} • {item.acUnit.type} •{' '}
                        {item.acUnit.capacityPk} PK
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={hasInspection ? 'default' : 'outline'}
                    className={`text-[10px] ${
                      hasInspection
                        ? 'bg-emerald-600 text-white'
                        : 'text-amber-700 border-amber-300'
                    }`}
                  >
                    {hasInspection ? 'Terinspeksi' : 'Belum Diinspeksi'}
                  </Badge>
                </div>

                {item.actionNotes && (
                  <p className="text-slate-500 italic">Catatan: {item.actionNotes}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Modal Check-in Kedatangan */}
      {arriveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">Check-in Tiba di Lokasi</CardTitle>
              <CardDescription className="text-xs">
                Konfirmasikan bahwa Anda telah sampai di tempat pelanggan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Catatan Kedatangan (Opsional)
                </label>
                <Textarea
                  placeholder="Misal: Sudah bertemu dengan pemilik rumah di ruang depan..."
                  value={arriveNotes}
                  onChange={(e) => setArriveNotes(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArriveModalOpen(false)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleArrive}
                  disabled={actionLoading}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700"
                >
                  Konfirmasi Tiba
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Follow-up Required */}
      {followUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Ajukan Tindak Lanjut / Sparepart
              </CardTitle>
              <CardDescription className="text-xs">
                Pekerjaan tidak dapat diselesaikan saat ini karena memerlukan penggantian suku cadang atau perbaikan lanjutan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Alasan Tindak Lanjut <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Misal: Kapasitor kompresor rusak, perlu pengadaan sparepart..."
                  value={followUpReason}
                  onChange={(e) => setFollowUpReason(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Catatan & Spesifikasi Suku Cadang (Opsional)
                </label>
                <Textarea
                  placeholder="Kapasitas PK, nomor seri komponen, rekomendasi tanggal servis kembali..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFollowUpModalOpen(false)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleFollowUp}
                  disabled={actionLoading}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Kirim Status Tindak Lanjut
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Selesaikan Pekerjaan */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" /> Konfirmasi Penyelesaian SPK
              </CardTitle>
              <CardDescription className="text-xs">
                Pastikan Anda telah mengisi Inspeksi, Checklist, dan Laporan Servis sebelum menyelesaikan pekerjaan ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Catatan Teknisi Akhir (Opsional)
                </label>
                <Textarea
                  placeholder="Kondisi AC setelah pengerjaan dingin normal, tidak ada kebocoran..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Nama Pelanggan Penerima
                </label>
                <Input
                  placeholder="Nama pemilik rumah / penerima hasil servis..."
                  value={customerSignName}
                  onChange={(e) => setCustomerSignName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Nama Teknisi Pelaksana
                </label>
                <Input
                  placeholder="Nama teknisi penanggung jawab..."
                  value={technicianSignName}
                  onChange={(e) => setTechnicianSignName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompleteModalOpen(false)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Selesaikan SPK
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
