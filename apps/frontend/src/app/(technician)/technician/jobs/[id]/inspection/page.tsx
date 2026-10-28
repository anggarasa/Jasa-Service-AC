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
  saveUnitInspection,
} from '@/lib/api/technician';
import {
  ArrowLeft,
  ClipboardList,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { InspectionStatus } from '@tampilkit-ac/api-contract';

const inspectionStatusOptions: { value: InspectionStatus; label: string; color: string }[] = [
  { value: 'GOOD', label: 'Baik & Normal', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'NEEDS_SERVICE', label: 'Perlu Servis Ringan / Cuci', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'REPAIR_REQUIRED', label: 'Perlu Perbaikan / Ganti Sparepart', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'CRITICAL', label: 'Kritis / Rusak Berat', color: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export default function TechnicianInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);

  // Form state per unit
  const [forms, setForms] = useState<
    Record<
      string,
      {
        inspectionStatus: InspectionStatus;
        reportedComplaint: string;
        observedCondition: string;
        diagnosis: string;
        recommendedAction: string;
        requiresFollowUp: boolean;
      }
    >
  >({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchTechnicianWorkOrderDetail(id);
      setJob(res);

      const initialForms: any = {};
      res.items.forEach((item: any) => {
        const insp = item.inspection;
        initialForms[item.id] = {
          inspectionStatus: insp?.inspectionStatus || 'GOOD',
          reportedComplaint: insp?.reportedComplaint || '',
          observedCondition: insp?.observedCondition || '',
          diagnosis: insp?.diagnosis || '',
          recommendedAction: insp?.recommendedAction || '',
          requiresFollowUp: insp?.requiresFollowUp || false,
        };
      });
      setForms(initialForms);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat data inspeksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleFieldChange = (itemId: string, field: string, value: any) => {
    setForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (itemId: string) => {
    const formData = forms[itemId];
    if (!formData) return;

    try {
      setSavingItemId(itemId);
      setSuccessMsg(null);
      await saveUnitInspection(id, itemId, formData);
      setSuccessMsg('Data inspeksi unit AC berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data inspeksi');
    } finally {
      setSavingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-slate-500 font-medium">Memuat data inspeksi...</p>
      </div>
    );
  }

  if (!job) return null;

  const currentItem = job.items[selectedItemIdx];
  const currentForm = currentItem ? forms[currentItem.id] : null;

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
          <ClipboardList className="w-6 h-6 text-primary" />
          Inspeksi Teknis Unit AC
        </h1>
        <p className="text-xs text-muted-foreground">
          Catat diagnosa dan kondisi teknis setiap unit AC pelanggan sebelum dan saat pengerjaan.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Unit Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {job.items.map((item: any, idx: number) => {
          const isSelected = selectedItemIdx === idx;
          const isInspected =
            item.inspection && item.inspection.inspectionStatus !== 'NOT_INSPECTED';

          return (
            <button
              key={item.id}
              onClick={() => setSelectedItemIdx(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Unit #{idx + 1}</span>
              {isInspected && (
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-white' : 'text-emerald-600'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Unit Inspection Form */}
      {currentItem && currentForm && (
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs text-primary font-semibold">
                  Unit #{selectedItemIdx + 1}
                </span>
                <CardTitle className="text-base font-bold mt-0.5">
                  {currentItem.serviceNameSnapshot}
                </CardTitle>
                {currentItem.acUnit && (
                  <CardDescription className="text-xs mt-1">
                    {currentItem.acUnit.brand} {currentItem.acUnit.model || ''} •{' '}
                    {currentItem.acUnit.type} • {currentItem.acUnit.capacityPk} PK
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Status Kondisi Hasil Inspeksi <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspectionStatusOptions.map((opt) => {
                  const isChecked = currentForm.inspectionStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        handleFieldChange(currentItem.id, 'inspectionStatus', opt.value)
                      }
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                        isChecked
                          ? `${opt.color} ring-2 ring-primary/40`
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keluhan Pelanggan */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Keluhan Pelanggan yang Dilaporkan
              </label>
              <Input
                placeholder="Misal: AC tidak dingin, bocor air di indoor, timbul bau apek..."
                value={currentForm.reportedComplaint}
                onChange={(e) =>
                  handleFieldChange(currentItem.id, 'reportedComplaint', e.target.value)
                }
                className="text-xs"
              />
            </div>

            {/* Kondisi Fisik & Operasional yang Diamati */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Kondisi Fisik & Operasional yang Diamati
              </label>
              <Textarea
                placeholder="Misal: Filter tebal debu, blower kotor berlumut, talang air tersumbat lendir..."
                value={currentForm.observedCondition}
                onChange={(e) =>
                  handleFieldChange(currentItem.id, 'observedCondition', e.target.value)
                }
                className="text-xs min-h-[70px]"
              />
            </div>

            {/* Diagnosa Teknisi */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Diagnosa Lapangan
              </label>
              <Textarea
                placeholder="Misal: Penurunan sirkulasi udara sebesar 40% akibat kotoran, tekanan freon normal 140 PSI..."
                value={currentForm.diagnosis}
                onChange={(e) =>
                  handleFieldChange(currentItem.id, 'diagnosis', e.target.value)
                }
                className="text-xs min-h-[70px]"
              />
            </div>

            {/* Rekomendasi Tindakan */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Rekomendasi Tindakan yang Diambil
              </label>
              <Input
                placeholder="Misal: Cuci steam menyeluruh + penyemprotan pipa drainase"
                value={currentForm.recommendedAction}
                onChange={(e) =>
                  handleFieldChange(currentItem.id, 'recommendedAction', e.target.value)
                }
                className="text-xs"
              />
            </div>

            {/* Checkbox Butuh Tindak Lanjut */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id={`fu-${currentItem.id}`}
                checked={currentForm.requiresFollowUp}
                onChange={(e) =>
                  handleFieldChange(currentItem.id, 'requiresFollowUp', e.target.checked)
                }
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor={`fu-${currentItem.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                Unit ini memerlukan kunjungan lanjutan atau pengadaan suku cadang
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                onClick={() => handleSave(currentItem.id)}
                disabled={savingItemId === currentItem.id}
                className="text-xs font-semibold px-4"
              >
                {savingItemId === currentItem.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Simpan Inspeksi Unit #{selectedItemIdx + 1}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
