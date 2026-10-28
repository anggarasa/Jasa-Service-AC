'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Calendar,
  Clock,
  Wrench,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { fetchTechniciansSchedule } from '@/lib/api/admin-bookings';

export default function TechnicianScheduleOverviewPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTechniciansSchedule({ date: selectedDate });
      setTechnicians(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat jadwal teknisi.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Jadwal & Kapasitas Teknisi
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau alokasi penugasan lapangan, slot occupancies, dan beban kerja harian teknisi CoolCare AC.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto h-9 text-xs"
          />
          <Button variant="outline" size="sm" onClick={loadSchedule} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadSchedule}>Coba Lagi</Button>
        </div>
      )}

      {/* Technicians List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Memuat jadwal teknisi...
          </div>
        ) : technicians.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Belum ada teknisi aktif yang terdaftar.
          </div>
        ) : (
          technicians.map((tech) => (
            <Card key={tech.technicianId} className="border-slate-200/80 shadow-sm bg-white flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {tech.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {tech.email || 'Teknisi CoolCare'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={tech.totalOccupancies > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}>
                    {tech.totalOccupancies} Tugas Aktif
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Occupancies list */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                      Agenda & Tugas Tanggal Ini
                    </span>
                    {tech.occupancies.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">
                        Teknisi siap dan belum memiliki penugasan di tanggal ini.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {tech.occupancies.map((occ: any) => {
                          const s = new Date(occ.startsAt);
                          const e = new Date(occ.endsAt);
                          const timeStr = `${s.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

                          return (
                            <div key={occ.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-medium text-slate-900">
                                  {occ.booking?.bookingCode || 'Blok Waktu'}
                                </span>
                                <span className="font-medium text-primary text-[11px]">{timeStr}</span>
                              </div>
                              {occ.booking && (
                                <p className="text-slate-600 truncate">
                                  {occ.booking.customer?.name} • {occ.booking.customerAddress?.district}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SPK Lapangan */}
                  {tech.workOrders?.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-600 block">Surat Tugas (SPK):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tech.workOrders.map((wo: any) => (
                          <Link key={wo.id} href={`/dashboard/work-orders/${wo.id}`}>
                            <Badge variant="outline" className="font-mono text-[10px] hover:bg-slate-100 cursor-pointer">
                              {wo.workOrderNumber} ({wo.status})
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <Link href={`/dashboard/bookings?technicianId=${tech.technicianId}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Lihat Semua Tugas Teknisi Ini <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
