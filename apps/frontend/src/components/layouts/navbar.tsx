'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wind, Phone, Menu, X, Key, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/components/common/connection-status';

interface NavbarProps {
  businessName?: string;
  phone?: string;
  whatsappNumber?: string;
  logoUrl?: string | null;
}

export function Navbar({
  businessName = 'CoolCare AC Service',
  whatsappNumber = '6281234567890',
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Layanan', href: '/services' },
    { label: 'Area Layanan', href: '/service-areas' },
    { label: 'Galeri', href: '/gallery' },
    { label: 'Tentang Kami', href: '/about' },
    { label: 'Kontak', href: '/contact' },
  ];

  // In-page section anchors: #layanan, #keunggulan, #cara-kerja, #area-layanan

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

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
                {businessName.includes(' ') ? (
                  <>
                    {businessName.split(' ')[0]}{' '}
                    <span className="text-accent font-semibold">
                      {businessName.split(' ').slice(1).join(' ')}
                    </span>
                  </>
                ) : (
                  businessName
                )}
              </span>
              <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Service & Maintenance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors py-1 ${
                  isActive(link.href)
                    ? 'text-accent font-semibold border-b-2 border-accent'
                    : 'text-slate-700 hover:text-accent'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Header Section */}
          <div className="hidden sm:flex items-center gap-3">
            <ConnectionStatus />
            <Link
              href="/login"
              className="text-xs font-medium text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-100/60"
            >
              <Key className="w-3.5 h-3.5 text-accent" />
              <span>Portal Staf</span>
            </Link>
            <Button
              asChild
              variant="accent"
              size="sm"
              className="gap-2 shadow-sm font-semibold"
            >
              <Link href="/booking">
                <Calendar className="w-4 h-4" />
                <span>Booking Service</span>
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <Button
              asChild
              variant="accent"
              size="sm"
              className="text-xs px-2.5 py-1 h-8"
            >
              <Link href="/booking">Booking</Link>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Key className="w-4 h-4 text-accent" />
              <span>Portal Staf</span>
            </Link>
            <Button
              asChild
              variant="accent"
              className="w-full justify-center gap-2"
            >
              <Link href="/booking" onClick={() => setMobileMenuOpen(false)}>
                <Calendar className="w-4 h-4" />
                <span>Booking Service AC</span>
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
