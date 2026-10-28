'use client';

import { useState } from 'react';
import { Phone, Calendar, Clock, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function CtaSection() {
  const [selectedService, setSelectedService] = useState('cuci-ac-standar');
  const [unitCount, setUnitCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="booking-cta" className="py-16 lg:py-24 bg-gradient-to-b from-white to-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary-100 shadow-xl overflow-hidden">
            <div className="bg-primary text-white p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <Badge variant="accent" className="text-xs font-semibold uppercase">
                  Konsultasi & Reservasi
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Jadwalkan Servis AC Hari Ini
                </h3>
                <p className="text-sm text-slate-300 max-w-xl">
                  Pilih layanan yang Anda butuhkan atau langsung hubungi tim customer care kami melalui WhatsApp untuk respon cepat.
                </p>
              </div>

              <div className="shrink-0">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20CoolCare%20AC,%20saya%20ingin%20jadwalkan%20servis%20AC"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl shadow-md transition-all hover:scale-105 text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat WhatsApp</span>
                </a>
              </div>
            </div>

            <CardContent className="p-6 sm:p-8 bg-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" placeholder="Contoh: Budi Santoso" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor WhatsApp / HP</Label>
                    <Input id="phone" placeholder="Contoh: 0812-xxxx-xxxx" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="service">Jenis Layanan</Label>
                    <select
                      id="service"
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="cuci-ac-standar">Cuci AC Split Standar (Mulai Rp75.000)</option>
                      <option value="isi-freon">Isi / Tambah Freon (Mulai Rp150.000)</option>
                      <option value="perbaikan-ac">Inspeksi & Perbaikan AC (Sesuai Diagnosa)</option>
                      <option value="bongkar-pasang">Bongkar Pasang AC (Mulai Rp350.000)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="units">Jumlah Unit AC</Label>
                    <Input
                      id="units"
                      type="number"
                      min={1}
                      max={20}
                      value={unitCount}
                      onChange={(e) => setUnitCount(parseInt(e.target.value, 10) || 1)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Kunjungan & Catatan Kendala AC</Label>
                  <Input
                    id="address"
                    placeholder="Alamat lengkap (Kecamatan, Kota, patokan lokasi) dan keluhan AC..."
                    required
                  />
                </div>

                <Alert variant="info" className="text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle className="text-xs font-semibold">Mode Demonstrasi Template (Phase 01)</AlertTitle>
                  <AlertDescription>
                    Formulir ini memvalidasi data sisi klien. Engine pemrosesan booking otomatis terintegrasi penuh dengan kalender dan PostgreSQL di fase selanjutnya.
                  </AlertDescription>
                </Alert>

                {submitted ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-sm">Permintaan Demonstrasi Diterima</p>
                      <p>
                        Terima kasih! Pada sistem produksi, teknisi terdekat akan menerima notifikasi otomatis. Anda juga dapat langsung mengonfirmasi via tombol WhatsApp di atas.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button type="submit" variant="accent" size="lg" className="w-full font-bold">
                    Kirim Permintaan Booking
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
