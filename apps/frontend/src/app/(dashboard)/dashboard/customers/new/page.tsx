import Link from 'next/link';
import { CustomerForm } from '@/components/admin/customer-form';
import { ChevronLeft } from 'lucide-react';

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Kembali ke Direktori Pelanggan
        </Link>
      </div>

      <CustomerForm />
    </div>
  );
}
