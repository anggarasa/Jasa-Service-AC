'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  technicianFetchPricing,
  technicianRecordPayment,
} from '@/lib/api/billing';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Upload,
} from 'lucide-react';

export default function TechnicianFieldPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;

  const [pricing, setPricing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await technicianFetchPricing(workOrderId);
      setPricing(res);
      setAmount(Number(res.actualCharges.finalGrandTotal || 0));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat rincian tagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workOrderId) {
      loadData();
    }
  }, [workOrderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Nominal pembayaran harus lebih besar dari Rp 0');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await technicianRecordPayment(workOrderId, {
        method,
        amount: Number(amount),
        notes: notes || `Pembayaran diterima di lokasi oleh teknisi`,
        idempotencyKey: `tech-pay-${workOrderId}-${Date.now()}`,
      });
      setSuccessMsg('Penerimaan pembayaran berhasil dikirimkan ke kasir untuk verifikasi.');
      setTimeout(() => {
        router.push(`/technician/jobs/${workOrderId}`);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat pembayaran');
    } finally {
      setSubmitting(false);
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
        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-3" />
        <p>Memuat kalkulasi tagihan servis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/technician/jobs/${workOrderId}`}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Penerimaan Pembayaran di Lokasi
          </h1>
          <p className="text-xs text-slate-500">
            Catat penerimaan pembayaran tunai atau transfer dari pelanggan
          </p>
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

      {/* Bill Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" />
          Ringkasan Tagihan SPK #{pricing?.workOrderNumber}
        </h2>

        <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
          <div className="flex justify-between text-slate-600">
            <span>Estimasi Dasar & Transport:</span>
            <span>
              {formatCurrency(
                Number(pricing?.originalEstimate.baseServicesTotal || 0) +
                  Number(pricing?.originalEstimate.visitFeeSnapshot || 0),
              )}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Pekerjaan Tambahan:</span>
            <span>+{formatCurrency(pricing?.actualCharges.additionalLaborTotal || 0)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Material Digunakan:</span>
            <span>+{formatCurrency(pricing?.actualCharges.materialsTotal || 0)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
            <span>Total yang Harus Diterima:</span>
            <span className="text-emerald-600">
              {formatCurrency(pricing?.actualCharges.finalGrandTotal || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Entry Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('CASH')}
              className={`p-3 border rounded-xl text-left transition-all ${
                method === 'CASH'
                  ? 'border-primary bg-primary/5 text-primary font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm font-semibold">Tunai (Cash)</div>
              <div className="text-[11px] text-slate-500 font-normal">Diterima langsung dari pelanggan</div>
            </button>
            <button
              type="button"
              onClick={() => setMethod('BANK_TRANSFER')}
              className={`p-3 border rounded-xl text-left transition-all ${
                method === 'BANK_TRANSFER'
                  ? 'border-primary bg-primary/5 text-primary font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm font-semibold">Transfer Bank</div>
              <div className="text-[11px] text-slate-500 font-normal">Pelanggan transfer ke rekening resmi</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nominal yang Diterima (Rp)
          </label>
          <input
            type="number"
            required
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg p-3 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Teknisi (Opsional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Misal: Uang pas diterima di lokasi / Pelanggan transfer via m-BCA..."
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
        >
          {submitting ? 'Mengirim Data Pembayaran...' : 'Konfirmasi Penerimaan Pembayaran'}
        </button>
      </form>
    </div>
  );
}
