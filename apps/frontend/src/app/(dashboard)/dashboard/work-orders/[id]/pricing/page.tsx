'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchWorkOrderPricing,
  saveWorkOrderPricing,
  createWorkOrderChargeApproval,
  createDraftInvoice,
  WorkOrderPricingSummary,
} from '@/lib/api/billing';
import {
  ArrowLeft,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Save,
  UserCheck,
  Receipt,
  Layers,
} from 'lucide-react';

export default function WorkOrderPricingPage() {
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;

  const [data, setData] = useState<WorkOrderPricingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable lists
  const [charges, setCharges] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalMethod, setApprovalMethod] = useState('IN_PERSON');
  const [approvedByName, setApprovedByName] = useState('');
  const [approvedByContact, setApprovedByContact] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const loadPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkOrderPricing(workOrderId);
      setData(res);
      setCharges(res.actualCharges.charges || []);
      setMaterials(res.actualCharges.materials || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat rincian kalkulasi biaya SPK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workOrderId) {
      loadPricing();
    }
  }, [workOrderId]);

  const handleAddCharge = () => {
    setCharges([
      ...charges,
      {
        lineType: 'ADDITIONAL_LABOR',
        description: '',
        quantity: 1,
        unitPrice: 0,
        lineAmount: '0',
        status: 'DRAFT',
      },
    ]);
  };

  const handleUpdateCharge = (index: number, field: string, val: any) => {
    const updated = [...charges];
    updated[index][field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(updated[index].quantity || 0);
      const p = Number(updated[index].unitPrice || 0);
      updated[index].lineAmount = String(q * p);
    }
    setCharges(updated);
  };

  const handleRemoveCharge = (index: number) => {
    setCharges(charges.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    setMaterials([
      ...materials,
      {
        materialName: '',
        quantity: 1,
        unit: 'pcs',
        unitPrice: 0,
        totalAmount: '0',
        notes: '',
      },
    ]);
  };

  const handleUpdateMaterial = (index: number, field: string, val: any) => {
    const updated = [...materials];
    updated[index][field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(updated[index].quantity || 0);
      const p = Number(updated[index].unitPrice || 0);
      updated[index].totalAmount = String(q * p);
    }
    setMaterials(updated);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleSavePricing = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await saveWorkOrderPricing(workOrderId, {
        charges: charges.map((c) => ({
          ...c,
          quantity: Number(c.quantity),
          unitPrice: Number(c.unitPrice),
        })),
        materials: materials.map((m) => ({
          ...m,
          quantity: Number(m.quantity),
          unitPrice: Number(m.unitPrice),
        })),
      });
      setSuccessMsg('Rincian biaya aktual berhasil diperbarui.');
      await loadPricing();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan rincian biaya');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    try {
      setSaving(true);
      setError(null);
      const proposed = Number(data.actualCharges.finalGrandTotal);
      await createWorkOrderChargeApproval(workOrderId, {
        proposedTotal: proposed,
        approvedTotal: proposed,
        approvalMethod,
        approvedByName,
        approvedByContact,
        internalNotes: approvalNotes,
      });
      setShowApprovalModal(false);
      setSuccessMsg('Persetujuan biaya pelanggan berhasil dicatat!');
      await loadPricing();
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat persetujuan biaya');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!confirm('Terbitkan draf faktur tagihan untuk SPK ini?')) return;
    try {
      setSaving(true);
      setError(null);
      const inv = await createDraftInvoice({ workOrderId });
      router.push(`/dashboard/invoices/${inv.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal menerbitkan faktur');
      setSaving(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
        <p>Memuat rincian kalkulasi biaya SPK...</p>
      </div>
    );
  }

  const isLocked = Boolean(data?.invoice && ['ISSUED', 'PARTIALLY_PAID', 'PAID'].includes(data.invoice.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/work-orders"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Kalkulasi Biaya SPK #{data?.workOrderNumber}
            </h1>
            <p className="text-sm text-slate-500">
              Perbandingan Estimasi Awal vs Biaya Aktual Lapangan & Persetujuan Pelanggan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLocked && (
            <button
              onClick={handleSavePricing}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          )}

          {data?.invoice ? (
            <Link
              href={`/dashboard/invoices/${data.invoice.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors shadow-sm"
            >
              <Receipt className="w-4 h-4" />
              Lihat Faktur #{data.invoice.invoiceNumber}
            </Link>
          ) : (
            <button
              onClick={handleGenerateInvoice}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <Receipt className="w-4 h-4" />
              Terbitkan Faktur
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLocked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>
            Faktur <strong>{data?.invoice?.invoiceNumber}</strong> telah diterbitkan secara resmi. Rincian biaya aktual terkunci untuk menjaga integritas pembukuan dan kuitansi.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estimasi Awal Pemesanan */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <h2 className="font-semibold text-slate-800">1. Estimasi Awal Pemesanan</h2>
            </div>
            <span className="text-xs bg-sky-50 text-sky-700 font-medium px-2.5 py-1 rounded-full">
              Pemesanan #{data?.bookingCode}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm py-1 border-b border-slate-50">
              <span className="text-slate-600">Biaya Kunjungan / Transport:</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(data?.originalEstimate.visitFeeSnapshot || 0)}
              </span>
            </div>

            <div className="text-sm font-medium text-slate-700 pt-2">Layanan yang Dipesan:</div>
            {data?.originalEstimate.items.map((it, idx) => (
              <div key={idx} className="flex justify-between text-sm bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-700">
                  {it.serviceName} ({it.quantity} unit)
                </span>
                <span className="font-semibold text-slate-900">{formatCurrency(it.totalPrice)}</span>
              </div>
            ))}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-base">
              <span className="font-bold text-slate-800">Total Estimasi Awal:</span>
              <span className="font-bold text-sky-600">
                {formatCurrency(data?.originalEstimate.estimatedTotal || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Ringkasan Biaya Akhir Aktual */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-800">2. Kalkulasi Biaya Akhir Lapangan</h2>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full">
              Versi #{data?.pricingVersion}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Layanan Dasar & Kunjungan:</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(
                  Number(data?.originalEstimate.baseServicesTotal || 0) +
                    Number(data?.originalEstimate.visitFeeSnapshot || 0),
                )}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Pekerjaan / Tenaga Tambahan:</span>
              <span className="font-medium text-slate-900">
                +{formatCurrency(data?.actualCharges.additionalLaborTotal || 0)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Material / Suku Cadang:</span>
              <span className="font-medium text-slate-900">
                +{formatCurrency(data?.actualCharges.materialsTotal || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-lg">
              <span className="font-bold text-slate-900">Total Akhir yang Ditagihkan:</span>
              <span className="font-extrabold text-emerald-600">
                {formatCurrency(data?.actualCharges.finalGrandTotal || 0)}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowApprovalModal(true)}
                disabled={isLocked}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                Catat Persetujuan Pelanggan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Tenaga Kerja Tambahan */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Tenaga Kerja & Pekerjaan Tambahan</h3>
            <p className="text-xs text-slate-500">
              Misal: Biaya bongkar pasang pipa tinggi, pengelasan kebocoran evaporator, dll.
            </p>
          </div>
          {!isLocked && (
            <button
              onClick={handleAddCharge}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Biaya
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="p-3">Tipe</th>
                <th className="p-3">Deskripsi Pekerjaan</th>
                <th className="p-3 w-24">Kuantitas</th>
                <th className="p-3 w-36">Tarif Satuan (Rp)</th>
                <th className="p-3 w-36">Total (Rp)</th>
                <th className="p-3 w-28">Status</th>
                {!isLocked && <th className="p-3 w-16">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {charges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400 text-xs">
                    Belum ada tambahan biaya tenaga kerja.
                  </td>
                </tr>
              ) : (
                charges.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <select
                        disabled={isLocked}
                        value={ch.lineType}
                        onChange={(e) => handleUpdateCharge(idx, 'lineType', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      >
                        <option value="ADDITIONAL_LABOR">Tenaga Tambahan</option>
                        <option value="CUSTOM_CHARGE">Biaya Khusus</option>
                        <option value="EMERGENCY_FEE">Biaya Darurat</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={ch.description}
                        placeholder="Deskripsi pekerjaan..."
                        onChange={(e) => handleUpdateCharge(idx, 'description', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={ch.quantity}
                        min={1}
                        onChange={(e) => handleUpdateCharge(idx, 'quantity', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={ch.unitPrice}
                        min={0}
                        onChange={(e) => handleUpdateCharge(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-3 font-medium text-slate-900">
                      {formatCurrency(ch.lineAmount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ch.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </td>
                    {!isLocked && (
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveCharge(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Material & Suku Cadang */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Material & Suku Cadang yang Digunakan</h3>
            <p className="text-xs text-slate-500">
              Misal: Freon R32 (kg), Kapasitor 35uF (pcs), Pipa Tembaga (meter), dll.
            </p>
          </div>
          {!isLocked && (
            <button
              onClick={handleAddMaterial}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Material
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="p-3">Nama Material</th>
                <th className="p-3 w-24">Jumlah</th>
                <th className="p-3 w-24">Satuan</th>
                <th className="p-3 w-36">Harga Satuan (Rp)</th>
                <th className="p-3 w-36">Total (Rp)</th>
                <th className="p-3">Keterangan</th>
                {!isLocked && <th className="p-3 w-16">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400 text-xs">
                    Belum ada material yang dicatat.
                  </td>
                </tr>
              ) : (
                materials.map((mat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={mat.materialName}
                        placeholder="Nama material..."
                        onChange={(e) => handleUpdateMaterial(idx, 'materialName', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={mat.quantity}
                        min={0.1}
                        step="0.1"
                        onChange={(e) => handleUpdateMaterial(idx, 'quantity', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={mat.unit}
                        placeholder="kg / pcs"
                        onChange={(e) => handleUpdateMaterial(idx, 'unit', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={mat.unitPrice}
                        min={0}
                        onChange={(e) => handleUpdateMaterial(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-3 font-medium text-slate-900">
                      {formatCurrency(mat.totalAmount)}
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={mat.notes || ''}
                        placeholder="Catatan..."
                        onChange={(e) => handleUpdateMaterial(idx, 'notes', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    {!isLocked && (
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveMaterial(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Riwayat Persetujuan Pelanggan */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Riwayat Persetujuan Biaya (Audit Trail)</h3>
        </div>

        {data?.approvals.length === 0 ? (
          <p className="text-slate-400 text-xs">Belum ada riwayat persetujuan biaya yang tercatat.</p>
        ) : (
          <div className="space-y-3">
            {data?.approvals.map((app) => (
              <div key={app.id} className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-sm flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Versi {app.pricingVersion}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                      Disetujui: {formatCurrency(app.approvedTotal || app.proposedTotal)}
                    </span>
                    <span className="text-xs text-slate-500">Metode: {app.approvalMethod}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Nama Penyetuju: <strong>{app.approvedByName}</strong> {app.approvedByContact && `(${app.approvedByContact})`}
                  </p>
                  {app.internalNotes && <p className="text-xs text-slate-500 mt-0.5">Catatan: {app.internalNotes}</p>}
                </div>
                <div className="text-xs text-slate-400 text-right">
                  {app.approvedAt ? new Date(app.approvedAt).toLocaleString('id-ID') : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Persetujuan Pelanggan */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Rekam Persetujuan Pelanggan</h3>
            <p className="text-xs text-slate-500">
              Pastikan pelanggan telah memahami dan menyetujui total biaya akhir sebesar{' '}
              <strong className="text-emerald-600">
                {formatCurrency(data?.actualCharges.finalGrandTotal || 0)}
              </strong>
            </p>

            <form onSubmit={handleRecordApproval} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Metode Persetujuan</label>
                <select
                  value={approvalMethod}
                  onChange={(e) => setApprovalMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                >
                  <option value="IN_PERSON">Konfirmasi Langsung di Lokasi</option>
                  <option value="VERBAL_PHONE">Telepon / Lisan</option>
                  <option value="WHATSAPP_CHAT">Pesan WhatsApp / Chat</option>
                  <option value="SIGNATURE_WRITTEN">Tanda Tangan Fisik / Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama yang Menyetujui</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pemilik rumah / PIC..."
                  value={approvedByName}
                  onChange={(e) => setApprovedByName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">No. Kontak / WhatsApp Penyetuju</label>
                <input
                  type="text"
                  placeholder="08123456789..."
                  value={approvedByContact}
                  onChange={(e) => setApprovedByContact(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Catatan konfirmasi..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Persetujuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
