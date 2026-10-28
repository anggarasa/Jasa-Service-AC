'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { CustomerForm } from '@/components/admin/customer-form';
import { ChevronLeft, Loader2 } from 'lucide-react';

export default function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/admin/customers/${resolvedParams.id}`);
        if (res.ok) {
          const json = await res.json();
          setCustomer(json.data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs">Memuat data pelanggan...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-20 text-center text-slate-600">
        <p className="font-semibold">Pelanggan tidak ditemukan.</p>
        <Link href="/dashboard/customers" className="text-xs text-primary underline mt-2 block">
          Kembali ke direktori
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/customers/${resolvedParams.id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Kembali ke Profil Pelanggan
        </Link>
      </div>

      <CustomerForm
        isEdit
        initialData={{
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
        }}
      />
    </div>
  );
}
