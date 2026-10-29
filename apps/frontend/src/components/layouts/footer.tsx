import Link from 'next/link';
import { Wind, Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { PublicBusiness } from '@tampilkit-ac/api-contract';
import { ConnectionStatus } from '@/components/common/connection-status';

interface FooterProps {
  business?: PublicBusiness | null;
}

export function Footer({ business }: FooterProps) {
  const name = business?.name || 'CoolCare AC Service';
  const phone = business?.phone || '+62 812-3456-7890';
  const whatsapp = business?.whatsappNumber || '6281234567890';
  const email = business?.email || 'halo@coolcare.id';
  const address = business?.address || 'Jl. Merdeka No. 45';
  const city = business?.city || 'Jakarta Selatan';
  const province = business?.province || 'DKI Jakarta';

  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Halo, saya ingin bertanya mengenai layanan service AC.')}`;

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
                {name}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {business?.description ||
                'Solusi terpercaya untuk servis, perawatan berkala, perbaikan, dan instalasi AC rumah maupun kantor di area Jabodetabek.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-accent">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garansi Pengerjaan Berkualitas</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Menu Navigasi
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Katalog Layanan
                </Link>
              </li>
              <li>
                <Link href="/service-areas" className="hover:text-white transition-colors">
                  Cakupan Wilayah
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-white transition-colors">
                  Galeri Pengerjaan
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Operational Hours */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Jam Operasional
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <span className="block font-medium text-slate-300">Senin – Jumat</span>
                  <span className="text-xs text-slate-400">09:00 – 17:00 WIB</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <span className="block font-medium text-slate-300">Sabtu</span>
                  <span className="text-xs text-slate-400">09:00 – 15:00 WIB</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <span className="block font-medium text-slate-300">Minggu & Hari Libur</span>
                  <span className="text-xs text-rose-400">Tutup (Khusus Darurat via WA)</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Kontak Kantor
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span>
                  {address}, {city}, {province}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                  {email}
                </a>
              </li>
              <li className="pt-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Chat WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} {name}. Seluruh Hak Cipta Dilindungi.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <ConnectionStatus />
            <Link href="/services" className="hover:text-white transition-colors">
              Layanan
            </Link>
            <Link href="/service-areas" className="hover:text-white transition-colors">
              Area
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Kontak
            </Link>
            <Link href="/login" className="hover:text-white transition-colors text-accent">
              Portal Staf
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
