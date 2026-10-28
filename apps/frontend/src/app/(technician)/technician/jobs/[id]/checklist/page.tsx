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
import {
  fetchTechnicianWorkOrderDetail,
  updateChecklistItem,
} from '@/lib/api/technician';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  MinusCircle,
} from 'lucide-react';
import { ChecklistItemStatus } from '@tampilkit-ac/api-contract';

export default function TechnicianChecklistPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchTechnicianWorkOrderDetail(id);
      setJob(res);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat checklist servis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleUpdateStatus = async (
    checklistItemId: string,
    newStatus: ChecklistItemStatus,
    notes?: string,
  ) => {
    try {
      setUpdatingItemId(checklistItemId);
      await updateChecklistItem(id, checklistItemId, {
        status: newStatus,
        notes: notes || undefined,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status checklist');
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-slate-500 font-medium">Memuat checklist servis...</p>
      </div>
    );
  }

  if (!job) return null;

  const currentUnit = job.items[selectedUnitIdx];
  const checklist = currentUnit?.checklistItems || [];

  const completedCount = checklist.filter(
    (c: any) => c.status === 'DONE' || c.status === 'NOT_APPLICABLE',
  ).length;

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
          <CheckCircle2 className="w-6 h-6 text-primary" />
          Checklist Standar Servis AC
        </h1>
        <p className="text-xs text-muted-foreground">
          Tandai setiap langkah pembersihan, pengujian, dan pengukuran teknis AC di lapangan.
        </p>
      </div>

      {/* Unit Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {job.items.map((item: any, idx: number) => {
          const isSelected = selectedUnitIdx === idx;
          const itemsDone = (item.checklistItems || []).filter(
            (c: any) => c.status === 'DONE' || c.status === 'NOT_APPLICABLE',
          ).length;
          const total = (item.checklistItems || []).length;

          return (
            <button
              key={item.id}
              onClick={() => setSelectedUnitIdx(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Unit #{idx + 1}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {itemsDone}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Checklist items list */}
      {currentUnit && (
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-primary font-semibold">
                  Unit #{selectedUnitIdx + 1}
                </span>
                <CardTitle className="text-base font-bold mt-0.5">
                  {currentUnit.serviceNameSnapshot}
                </CardTitle>
                {currentUnit.acUnit && (
                  <CardDescription className="text-xs mt-1">
                    {currentUnit.acUnit.brand} {currentUnit.acUnit.model || ''} •{' '}
                    {currentUnit.acUnit.capacityPk} PK
                  </CardDescription>
                )}
              </div>
              <Badge variant="outline" className="text-xs font-semibold self-start sm:self-auto">
                {completedCount} dari {checklist.length} Selesai
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 divide-y divide-slate-100">
            {checklist.map((ci: any) => {
              const isUpdating = updatingItemId === ci.id;
              const isDone = ci.status === 'DONE';
              const isNA = ci.status === 'NOT_APPLICABLE';
              const isAttention = ci.status === 'NEEDS_ATTENTION';

              return (
                <div key={ci.id} className="py-3 first:pt-0 last:pb-0 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {ci.labelSnapshot}
                        </span>
                        {ci.isRequiredSnapshot && (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                            Wajib
                          </Badge>
                        )}
                      </div>
                      {ci.descriptionSnapshot && (
                        <p className="text-slate-500 text-xs">{ci.descriptionSnapshot}</p>
                      )}
                      {ci.notes && (
                        <p className="text-slate-600 bg-slate-50 p-1.5 rounded text-[11px]">
                          Catatan: {ci.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(ci.id, 'DONE')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Selesai
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(ci.id, 'NEEDS_ATTENTION')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 ${
                        isAttention
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Perhatian
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(ci.id, 'NOT_APPLICABLE')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 ${
                        isNA
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <MinusCircle className="w-3.5 h-3.5" /> N/A
                    </button>

                    {isUpdating && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary ml-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
