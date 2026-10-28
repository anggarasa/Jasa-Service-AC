'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  User,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { fetchAdminCalendarEvents, fetchTechniciansSchedule } from '@/lib/api/admin-bookings';

export default function BookingCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [technicianId, setTechnicianId] = useState('');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Technicians for filter
  useEffect(() => {
    async function loadTechs() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const list = await fetchTechniciansSchedule({ date: today });
        setTechnicians(list);
      } catch {
        // ignore
      }
    }
    loadTechs();
  }, []);

  // Compute startDate & endDate depending on view & currentDate
  const getDateRange = useCallback(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    if (view === 'month') {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      return {
        startDate: firstDay.toISOString().slice(0, 10),
        endDate: lastDay.toISOString().slice(0, 10),
      };
    } else if (view === 'week') {
      const day = currentDate.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        startDate: monday.toISOString().slice(0, 10),
        endDate: sunday.toISOString().slice(0, 10),
      };
    } else {
      // Day view
      const dateStr = currentDate.toISOString().slice(0, 10);
      return {
        startDate: dateStr,
        endDate: dateStr,
      };
    }
  }, [currentDate, view]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      const data = await fetchAdminCalendarEvents({
        view,
        startDate,
        endDate,
        technicianId: technicianId || undefined,
      });
      setEvents(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [getDateRange, view, technicianId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const navigateDate = (step: number) => {
    const next = new Date(currentDate);
    if (view === 'month') {
      next.setMonth(next.getMonth() + step);
    } else if (view === 'week') {
      next.setDate(next.getDate() + step * 7);
    } else {
      next.setDate(next.getDate() + step);
    }
    setCurrentDate(next);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] px-1 py-0">Menunggu</Badge>;
      case 'CONFIRMED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] px-1 py-0">Dikonfirmasi</Badge>;
      case 'ASSIGNED':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-[10px] px-1 py-0">Ditugaskan</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 text-[10px] px-1 py-0">Dikerjakan</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px] px-1 py-0">Selesai</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1 py-0">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Kalender Jadwal Servis AC
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualisasi agenda janji temu servis harian, mingguan, dan bulanan teknisi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/bookings/new">
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Pemesanan Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Bar: Date Nav, View Switch, Technician Filter */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setCurrentDate(new Date())}
            >
              Hari Ini
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigateDate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-slate-900 text-sm ml-2">
              {currentDate.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
                ...(view !== 'month' && { day: 'numeric' }),
              })}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Filter Technician */}
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="text-xs h-8 px-3 rounded-md border border-slate-300 bg-white"
            >
              <option value="">Semua Teknisi</option>
              {technicians.map((t) => (
                <option key={t.technicianId} value={t.technicianId}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* View Switch */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setView('month')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  view === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulan
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  view === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Minggu
              </button>
              <button
                type="button"
                onClick={() => setView('day')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  view === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hari
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Presentation List / Grid */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Agenda Terjadwal ({events.length} Servis)
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadEvents} disabled={loading} className="text-xs h-7">
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Segarkan
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Memuat kalender...</div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada agenda servis pada rentang tanggal ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {events.map((ev) => {
                const s = new Date(ev.start);
                const e = new Date(ev.end);
                const dateStr = s.toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
                const timeStr = `${s.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/bookings/${ev.id}`}
                    className="p-3 border border-slate-200/90 rounded-xl hover:border-primary/50 hover:shadow-sm transition-all bg-slate-50/40 hover:bg-white block space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{ev.bookingCode}</span>
                      {getStatusBadge(ev.status)}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 text-sm block truncate">
                        {ev.customerName}
                      </span>
                      <p className="text-slate-500 truncate">{ev.title}</p>
                    </div>
                    <div className="pt-1 border-t border-slate-200/60 text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1 font-medium text-primary">
                        <Clock className="w-3.5 h-3.5" /> {dateStr} • {timeStr}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <User className="w-3.5 h-3.5" /> Teknisi: {ev.technicianName}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
