'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  saveServiceReport,
} from '@/lib/api/technician';
import {
  ArrowLeft,
  FileCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function TechnicianReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [summary, setSummary] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [issuesFound, setIssuesFound] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [customerSignedName, setCustomerSignedName] = useState('');
  const [technicianSignedName, setTechnicianSignedName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchTechnicianWorkOrderDetail(id);
      setJob(res);

      if (res.serviceReport) {
        setSummary(res.serviceReport.summary || '');
        setWorkPerformed(res.serviceReport.workPerformed || '');
        setIssuesFound(res.serviceReport.issuesFound || '');
        setRecommendations(res.serviceReport.recommendations || '');
        setCustomerSignedName(res.serviceReport.customerSignedName || '');
        setTechnicianSignedName(res.serviceReport.technicianSignedName || '');
      } else {
        // Sensible initial defaults
        setSummary(`Servis pengerjaan AC untuk pelanggan ${res.customer?.name || ''}`);
        setWorkPerformed(
          'Pembersihan evaporator blower indoor, cuci kondensor outdoor, cek tekanan freon dan uji hembusan dingin.',
        );
        setCustomerSignedName(res.customer?.name || '');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat laporan servis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !workPerformed.trim()) {
      alert('Ringkasan dan Tindakan yang dilakukan wajib diisi!');
      return;
    }

    try {
      setSaving(true);
      setSuccessMsg(null);
      await saveServiceReport(id, {
        summary: summary.trim(),
        workPerformed: workPerformed.trim(),
        issuesFound: issuesFound.trim() || null,
        recommendations: recommendations.trim() || null,
        customerSignedName: customerSignedName.trim() || null,
        technicianSignedName: technicianSignedName.trim() || null,
        isCompleted: true,
      });
      setSuccessMsg('Laporan servis berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan laporan servis');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-slate-500 font-medium">Memuat data laporan servis...</p>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-5 pb-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/technician/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke SPK
        </Link>
        <span className="text-xs font-mono text-slate-500">{job.workOrderNumber}</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-primary" />
          Laporan Servis & Berita Acara Pengerjaan
        </h1>
        <p className="text-xs text-muted-foreground">
          Dokumen ringkasan teknis yang akan tercatat pada riwayat pemesanan pelanggan.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Form Laporan Servis</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Lengkapi sebelum menyelesaikan status SPK.
                </CardDescription>
              </div>
              {job.serviceReport ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">
                  Tersimpan
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                  Belum Diisi
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Ringkasan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Ringkasan Servis <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Misal: Perawatan berkala dan cuci steam 2 unit AC indoor & outdoor..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                className="text-xs font-medium"
              />
            </div>

            {/* Tindakan Teknis */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Tindakan Teknis yang Dilaksanakan <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Rincian pembersihan, penyemprotan drainase, pengukuran ampere dan freon..."
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
                required
                className="text-xs min-h-[90px]"
              />
            </div>

            {/* Kendala / Temuan */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Kendala atau Temuan Tambahan (Opsional)
              </label>
              <Textarea
                placeholder="Misal: Baut cover outdoor berkarat, kisi pendingin sedikit tertekuk..."
                value={issuesFound}
                onChange={(e) => setIssuesFound(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>

            {/* Rekomendasi */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Rekomendasi untuk Pelanggan (Opsional)
              </label>
              <Textarea
                placeholder="Misal: Disarankan servis rutin 3 bulan sekali, atur suhu remote di 24°C..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>

            {/* Signatures / Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nama Pelanggan Penerima
                </label>
                <Input
                  placeholder="Nama pemilik rumah / penanggung jawab..."
                  value={customerSignedName}
                  onChange={(e) => setCustomerSignedName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nama Teknisi Pelaksana
                </label>
                <Input
                  placeholder="Nama teknisi CoolCare..."
                  value={technicianSignedName}
                  onChange={(e) => setTechnicianSignedName(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="text-xs font-semibold px-4"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Simpan Laporan Servis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
