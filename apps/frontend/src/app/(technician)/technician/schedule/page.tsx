'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  fetchTechnicianWorkOrders,
  TechnicianJobsListResponse,
} from '@/lib/api/technician';
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  RefreshCw,
  Calendar as CalendarIcon,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  ASSIGNED: { label: 'Ditugaskan', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  ON_THE_WAY: { label: 'Menuju Lokasi', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ARRIVED: { label: 'Tiba di Lokasi', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  FOLLOW_UP_REQUIRED: { label: 'Perlu Tindak Lanjut', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export default function TechnicianSchedulePage() {
  const [data, setData] = useState<TechnicianJobsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetchTechnicianWorkOrders({
        page: 1,
        limit: 50,
        date: selectedDate,
      });
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat jadwal teknisi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  // Generate date shortcuts (yesterday, today, tomorrow, next 5 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const label =
      i === 0
        ? 'Hari Ini'
        : i === 1
        ? 'Besok'
        : d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    return { dateStr, label };
  });

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Jadwal Servis Teknisi
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agenda jadwal kunjungan servis AC berdasarkan alokasi waktu kerja.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSchedule} className="text-xs self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Segarkan
        </Button>
      </div>

      {/* Date Carousel Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {dateOptions.map((opt) => {
          const isSelected = selectedDate === opt.dateStr;
          return (
            <button
              key={opt.dateStr}
              onClick={() => setSelectedDate(opt.dateStr)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex flex-col items-center gap-0.5 ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{opt.label}</span>
              <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {opt.dateStr}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule Agenda Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-slate-500 font-medium">Memuat agenda jadwal...</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white">
          <CardContent className="py-12 text-center space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">Tidak ada jadwal pada tanggal ini</p>
            <p className="text-xs text-muted-foreground">
              Pilih tanggal lain di atas untuk melihat alokasi SPK Anda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((job) => {
            const statusInfo = statusConfig[job.status] || {
              label: job.status,
              color: 'bg-slate-100 text-slate-800',
            };

            const startTime = new Date(job.scheduledStartAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endTime = new Date(job.scheduledEndAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card
                key={job.id}
                className="border-slate-200/80 shadow-sm bg-white overflow-hidden hover:shadow transition-shadow"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[11px] bg-slate-50">
                        {startTime} - {endTime} WIB
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] font-bold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {job.workOrderNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">
                        {job.customer.name}
                      </h3>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {job.customerAddress.fullAddress}, {job.customerAddress.district}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <a
                      href={`tel:${job.customer.phone}`}
                      className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                    >
                      <Phone className="w-3.5 h-3.5" /> {job.customer.phone}
                    </a>
                    <Button asChild size="sm" className="text-xs h-8">
                      <Link href={`/technician/jobs/${job.id}`}>
                        Buka SPK <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
