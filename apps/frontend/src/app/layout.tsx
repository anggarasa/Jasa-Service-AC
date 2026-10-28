import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layouts/navbar';
import { Footer } from '@/components/layouts/footer';

export const metadata: Metadata = {
  title: 'CoolCare AC Service | Sistem Booking Service AC & Perawatan Lapangan',
  description:
    'Layanan servis cuci, perawatan berkala, perbaikan freon, dan instalasi AC rumah maupun kantor di Jabodetabek dengan teknisi profesional, harga transparan, dan garansi 30 hari.',
  keywords: [
    'Service AC',
    'Cuci AC',
    'Perbaikan AC',
    'Isi Freon',
    'CoolCare AC',
    'TampilKit',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="min-h-screen flex flex-col font-sans bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
