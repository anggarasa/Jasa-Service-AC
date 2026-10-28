'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wind, Phone, Menu, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/components/common/connection-status';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-accent shadow-md group-hover:scale-105 transition-transform">
              <Wind className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-primary flex items-center gap-1.5">
                CoolCare <span className="text-accent font-semibold">AC</span>
              </span>
              <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Service & Maintenance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
            <Link href="#layanan" className="hover:text-accent transition-colors">
              Layanan Kami
            </Link>
            <Link href="#keunggulan" className="hover:text-accent transition-colors">
              Keunggulan
            </Link>
            <Link href="#cara-kerja" className="hover:text-accent transition-colors">
              Cara Pemesanan
            </Link>
            <Link href="#area-layanan" className="hover:text-accent transition-colors">
              Area Layanan
            </Link>
          </nav>

          {/* Right Header Section (Connection Status + CTA) */}
          <div className="hidden sm:flex items-center gap-3">
            <ConnectionStatus />
            <Button
              variant="accent"
              size="sm"
              className="gap-2 shadow-sm"
              onClick={() => {
                const el = document.getElementById('booking-cta');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Phone className="w-4 h-4" />
              <span>Booking Service</span>
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t py-4 px-2 space-y-3 bg-white">
            <div className="pb-2 flex justify-center">
              <ConnectionStatus />
            </div>
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-800">
              <Link
                href="#layanan"
                className="px-3 py-2 rounded-md hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Layanan Kami
              </Link>
              <Link
                href="#keunggulan"
                className="px-3 py-2 rounded-md hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Keunggulan
              </Link>
              <Link
                href="#cara-kerja"
                className="px-3 py-2 rounded-md hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cara Pemesanan
              </Link>
              <Link
                href="#area-layanan"
                className="px-3 py-2 rounded-md hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Area Layanan
              </Link>
            </nav>
            <div className="pt-2 border-t">
              <Button
                variant="accent"
                className="w-full gap-2 justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  const el = document.getElementById('booking-cta');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Phone className="w-4 h-4" /> Booking Service AC
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
