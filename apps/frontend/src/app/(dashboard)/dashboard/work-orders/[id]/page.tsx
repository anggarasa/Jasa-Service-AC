'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Clock,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  UserCheck,
  Ban,
  Wrench,
  AlertCircle,
  History,
  Activity,
  Layers,
  Camera,
  ClipboardCheck,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchWorkOrderDetail,
  updateWorkOrderStatus,
  assignWorkOrderTechnician,
  cancelWorkOrder,
} from '@/lib/api/work-orders';
import { fetchTechniciansSchedule } from '@/lib/api/admin-bookings';

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const workOrderId = resolvedParams.id;
  const router = useRouter();

  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<'STATUS' | 'ASSIGN' | 'CANCEL' | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('IN_PROGRESS');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [technicianNotesText, setTechnicianNotesText] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);

  const loadWorkOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkOrderDetail(workOrderId);
      setWorkOrder(res);
      setDiagnosisText(res.diagnosis || '');
      setTechnicianNotesText(res.technicianNotes || '');
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat detail SPK.');
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    loadWorkOrder();
    async function loadTechs() {
      try {
        const list = await fetchTechniciansSchedule({ date: new Date().toISOString().slice(0, 10) });
        setTechnicians(list);
      } catch {
        // ignore
      }
    }
    loadTechs();
  }, [loadWorkOrder]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (activeModal === 'STATUS') {
        await updateWorkOrderStatus(workOrderId, {
          status: targetStatus as any,
          reason: actionReason || undefined,
          diagnosis: diagnosisText || undefined,
          technicianNotes: technicianNotesText || undefined,
        });
      } else if (activeModal === 'ASSIGN') {
        if (!selectedTechnicianId) throw new Error('Pilih teknisi terlebih dahulu');
        await assignWorkOrderTechnician(workOrderId, {
          technicianId: selectedTechnicianId,
          reason: actionReason || undefined,
        });
      } else if (activeModal === 'CANCEL') {
        if (!actionReason.trim()) throw new Error('Alasan pembatalan wajib diisi');
        await cancelWorkOrder(workOrderId, { reason: actionReason });
      }

      setActiveModal(null);
      setActionReason('');
      await loadWorkOrder();
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses aksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (woStatus: string) => {
    switch (woStatus) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-slate-50 text-slate-700">Draf</Badge>;
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Terjadwal</Badge>;
      case 'ASSIGNED':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">Ditugaskan</Badge>;
      case 'ON_THE_WAY':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Menuju Lokasi</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Sedang Dikerjakan</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300">Dibatalkan</Badge>;
      case 'FOLLOW_UP_REQUIRED':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Perlu Tindak Lanjut</Badge>;
      default:
        return <Badge variant="outline">{woStatus}</Badge>;
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
    return <div className="p-8 text-center text-sm text-muted-foreground">Memuat Surat Perintah Kerja...</div>;
  }

  if (error || !workOrder) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-destructive font-medium">{error || 'SPK tidak ditemukan'}</p>
        <Link href="/dashboard/work-orders">
          <Button variant="outline" size="sm">Kembali ke Daftar SPK</Button>
        </Link>
      </div>
    );
  }

  const isFinal = workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/work-orders">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                {workOrder.workOrderNumber}
              </h1>
              {getStatusBadge(workOrder.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              Diterbitkan: {new Date(workOrder.createdAt).toLocaleString('id-ID')} • Terhubung ke:{' '}
              <Link href={`/dashboard/bookings/${workOrder.bookingId}`} className="text-primary font-mono hover:underline">
                {workOrder.booking?.bookingCode}
              </Link>
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        {!isFinal && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/95 text-white"
              onClick={() => setActiveModal('STATUS')}
            >
              <Activity className="w-4 h-4 mr-1.5" /> Perbarui Status & Progres
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveModal('ASSIGN')}
            >
              <UserCheck className="w-4 h-4 mr-1.5" /> Ganti Teknisi
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={() => setActiveModal('CANCEL')}
            >
              <Ban className="w-4 h-4 mr-1.5" /> Batalkan SPK
            </Button>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Task Items, Instructions & Status History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">
                Informasi Tugas Lapangan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-500 block">Jadwal Mulai</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {new Date(workOrder.scheduledStartAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimasi Selesai</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {new Date(workOrder.scheduledEndAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Pengerjaan</span>
                  <span className="font-semibold text-slate-800 text-sm block mt-0.5">
                    {workOrder.status}
                  </span>
                </div>
              </div>

              {workOrder.adminInstructions && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
                  <span className="font-semibold text-blue-900 block">Instruksi Khusus Admin:</span>
                  <p className="text-blue-950">{workOrder.adminInstructions}</p>
                </div>
              )}

              {workOrder.customerComplaintSnapshot && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
                  <span className="font-semibold text-amber-900 block">Keluhan Pelanggan:</span>
                  <p className="text-amber-950">{workOrder.customerComplaintSnapshot}</p>
                </div>
              )}

              {workOrder.diagnosis && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-1">
                  <span className="font-semibold text-purple-900 block">Diagnosa Lapangan Teknisi:</span>
                  <p className="text-purple-950">{workOrder.diagnosis}</p>
                </div>
              )}

              {workOrder.technicianNotes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-semibold text-slate-800 block">Catatan Pengerjaan Teknisi:</span>
                  <p className="text-slate-700">{workOrder.technicianNotes}</p>
                </div>
              )}

              {workOrder.cancellationReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                  <span className="font-semibold text-rose-800 block">Alasan Pembatalan:</span>
                  <p className="text-rose-900">{workOrder.cancellationReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Order Items Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Daftar Item Pekerjaan Servis ({workOrder.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {workOrder.items?.map((item: any, i: number) => (
                  <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 block text-sm">
                        #{i + 1} {item.serviceNameSnapshot}
                      </span>
                      {item.actionNotes && (
                        <p className="text-slate-500 italic mt-0.5">{item.actionNotes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-slate-800 block">
                        {formatRupiah(item.itemTotal)}
                      </span>
                      <span className="text-slate-400 text-[11px]">Qty: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Execution Monitoring: Inspections & Checklists */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Hasil Inspeksi & Checklist Lapangan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {workOrder.items?.map((item: any, i: number) => {
                const insp = item.inspection;
                const checklist = item.checklistItems || [];
                const doneCount = checklist.filter((c: any) => c.status === 'DONE' || c.status === 'NOT_APPLICABLE').length;

                return (
                  <div key={item.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        Unit #{i + 1} — {item.serviceNameSnapshot}
                      </span>
                      {insp ? (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-300">
                          Status: {insp.inspectionStatus}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                          Belum Diinspeksi
                        </Badge>
                      )}
                    </div>

                    {insp && (
                      <div className="space-y-1.5 pt-1 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                        {insp.reportedComplaint && (
                          <p><strong className="text-slate-900">Keluhan:</strong> {insp.reportedComplaint}</p>
                        )}
                        {insp.observedCondition && (
                          <p><strong className="text-slate-900">Kondisi Fisik:</strong> {insp.observedCondition}</p>
                        )}
                        {insp.diagnosis && (
                          <p><strong className="text-slate-900">Diagnosa:</strong> {insp.diagnosis}</p>
                        )}
                        {insp.recommendedAction && (
                          <p><strong className="text-slate-900">Tindakan:</strong> {insp.recommendedAction}</p>
                        )}
                      </div>
                    )}

                    {checklist.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                          <span>Checklist Servis ({doneCount}/{checklist.length} Selesai)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {checklist.map((ci: any) => (
                            <div key={ci.id} className="flex items-center gap-1.5 text-[11px] p-1.5 rounded bg-white border border-slate-100">
                              <CheckCircle2 className={`w-3.5 h-3.5 ${ci.status === 'DONE' ? 'text-emerald-600' : 'text-slate-300'}`} />
                              <span className={`line-clamp-1 ${ci.status === 'DONE' ? 'text-slate-800' : 'text-slate-400'}`}>
                                {ci.labelSnapshot}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Field Photos Gallery */}
          {workOrder.photos && workOrder.photos.length > 0 && (
            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  Dokumentasi Foto Pengerjaan ({workOrder.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {workOrder.photos.map((photo: any) => (
                    <div key={photo.id} className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex flex-col justify-between">
                      <div className="aspect-video bg-slate-100 relative">
                        <img
                          src={`/api/v1/technician/work-orders/${workOrder.id}/photos/${photo.id}/content`}
                          alt={photo.caption || 'Foto'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2 text-[11px] space-y-0.5">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold">
                          {photo.category}
                        </Badge>
                        {photo.caption && <p className="text-slate-700 line-clamp-1">{photo.caption}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Report Card */}
          {workOrder.serviceReport && (
            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-purple-600" />
                  Laporan Servis & Berita Acara
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Ringkasan Pekerjaan:</span>
                  <p className="text-slate-700 mt-0.5">{workOrder.serviceReport.summary}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">Tindakan yang Telah Dilakukan:</span>
                  <p className="text-slate-700 mt-0.5">{workOrder.serviceReport.workPerformed}</p>
                </div>
                {workOrder.serviceReport.issuesFound && (
                  <div>
                    <span className="font-semibold text-slate-800 block">Kendala / Temuan:</span>
                    <p className="text-slate-700 mt-0.5">{workOrder.serviceReport.issuesFound}</p>
                  </div>
                )}
                {workOrder.serviceReport.recommendations && (
                  <div>
                    <span className="font-semibold text-slate-800 block">Rekomendasi Perawatan:</span>
                    <p className="text-slate-700 mt-0.5">{workOrder.serviceReport.recommendations}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-500 block">Nama Pelanggan Penerima:</span>
                    <span className="font-bold text-slate-900">{workOrder.serviceReport.customerSignedName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nama Teknisi Pelaksana:</span>
                    <span className="font-bold text-slate-900">{workOrder.serviceReport.technicianSignedName || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status & Assignment History Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                Riwayat Progres & Penugasan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="divide-y divide-slate-100 text-xs">
                {workOrder.statusHistory?.map((h: any) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Status: {h.toStatus}
                      </span>
                      {h.reason && <p className="text-slate-500">{h.reason}</p>}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(h.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Customer & Technician */}
        <div className="space-y-6">
          {/* Customer */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Nama Pelanggan</span>
                <span className="font-semibold text-slate-800 text-sm">{workOrder.customer?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kontak WhatsApp</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> {workOrder.customer?.phone}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block">Lokasi Kunjungan</span>
                <span className="font-medium text-slate-800 block mt-0.5">
                  {workOrder.customerAddress?.fullAddress}
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Kec. {workOrder.customerAddress?.district}, {workOrder.customerAddress?.city}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Technician */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Teknisi Ditugaskan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2">
              {workOrder.technician ? (
                <div>
                  <span className="font-semibold text-slate-900 text-sm block">
                    {workOrder.technician.user?.name}
                  </span>
                  <p className="text-slate-500 mt-0.5">{workOrder.technician.user?.email}</p>
                </div>
              ) : (
                <p className="text-slate-400 italic">Belum ada teknisi yang dialokasikan.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {activeModal === 'STATUS' && 'Pembaruan Status & Progres SPK'}
              {activeModal === 'ASSIGN' && 'Alihkan Teknisi SPK'}
              {activeModal === 'CANCEL' && 'Batalkan SPK'}
            </h3>

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              {activeModal === 'STATUS' && (
                <>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Pilih Status Baru</label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
                    >
                      <option value="ASSIGNED">Ditugaskan (ASSIGNED)</option>
                      <option value="ON_THE_WAY">Menuju Lokasi (ON_THE_WAY)</option>
                      <option value="IN_PROGRESS">Sedang Dikerjakan (IN_PROGRESS)</option>
                      <option value="COMPLETED">Pekerjaan Selesai (COMPLETED)</option>
                      <option value="FOLLOW_UP_REQUIRED">Perlu Tindak Lanjut (FOLLOW_UP_REQUIRED)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Diagnosa Lapangan (Opsional)</label>
                    <textarea
                      rows={2}
                      value={diagnosisText}
                      onChange={(e) => setDiagnosisText(e.target.value)}
                      placeholder="Contoh: Tekanan freon rendah (50 psi), kapasitor blower melemah..."
                      className="w-full rounded-md border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Catatan Teknisi (Opsional)</label>
                    <textarea
                      rows={2}
                      value={technicianNotesText}
                      onChange={(e) => setTechnicianNotesText(e.target.value)}
                      placeholder="Contoh: Sudah dilakukan cuci steam dan penggantian kapasitor..."
                      className="w-full rounded-md border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </>
              )}

              {activeModal === 'ASSIGN' && (
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Pilih Teknisi Pengganti</label>
                  <select
                    value={selectedTechnicianId}
                    onChange={(e) => setSelectedTechnicianId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
                    required
                  >
                    <option value="">-- Pilih Teknisi --</option>
                    {technicians.map((t) => (
                      <option key={t.technicianId} value={t.technicianId}>
                        {t.name} ({t.totalOccupancies} tugas hari ini)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  {activeModal === 'CANCEL' ? 'Alasan Pembatalan (Wajib)' : 'Alasan / Keterangan'}
                </label>
                <textarea
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Keterangan..."
                  className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  required={activeModal === 'CANCEL'}
                />
              </div>

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
                  {submitting ? 'Memproses...' : 'Terapkan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
