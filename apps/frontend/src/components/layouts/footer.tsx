import Link from 'next/link';
import { Wind, Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-slate-300 border-t border-primary-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                <Wind className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                CoolCare <span className="text-accent">AC</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Solusi terpercaya untuk servis, perawatan berkala, perbaikan, dan instalasi AC rumah maupun kantor di area Jabodetabek.
            </p>
            <div className="flex items-center gap-2 text-xs text-accent">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garansi Pengerjaan Hingga 30 Hari</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Layanan Utama
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#layanan" className="hover:text-white transition-colors">
                  Cuci AC Split & Inverter
                </Link>
              </li>
              <li>
                <Link href="#layanan" className="hover:text-white transition-colors">
                  Isi & Tambah Freon (R32 / R410A)
                </Link>
              </li>
              <li>
                <Link href="#layanan" className="hover:text-white transition-colors">
                  Inspeksi & Diagnosa Kerusakan
                </Link>
              </li>
              <li>
                <Link href="#layanan" className="hover:text-white transition-colors">
                  Bongkar Pasang AC Baru / Lama
                </Link>
              </li>
            </ul>
          </div>

          {/* Operational Hours */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Jam Operasional
            </h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">Senin - Minggu:</p>
                  <p>08.00 - 18.00 WIB</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Layanan darurat perbaikan AC tersedia dengan perjanjian terlebih dahulu.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Kontak Kami
            </h4>
            <div className="space-y-2.5 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <a href="tel:081234567890" className="hover:text-white transition-colors">
                  +62 812-3456-7890
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <a href="mailto:halo@coolcare.id" className="hover:text-white transition-colors">
                  halo@coolcare.id
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Kebayoran Baru, Jakarta Selatan, DKI Jakarta</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CoolCare AC Service. Template by TampilKit Studio.</p>
          <div className="flex items-center gap-4">
            <span>Privasi & Kebijakan</span>
            <span>•</span>
            <span>Syarat Layanan</span>
            <span>•</span>
            <span>Transparansi Harga</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
