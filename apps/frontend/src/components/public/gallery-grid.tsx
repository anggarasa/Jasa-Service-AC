'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicGalleryItem } from '@tampilkit-ac/api-contract';

interface GalleryGridProps {
  items: PublicGalleryItem[];
}

export function GalleryGrid({ items }: GalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm text-slate-500">Belum ada foto dokumentasi pekerjaan yang dipublikasikan.</p>
      </div>
    );
  }

  const handleOpen = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + items.length) % items.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % items.length);
    }
  };

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => handleOpen(index)}
            className="group relative h-64 rounded-xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-200 shadow-sm hover:shadow-md transition-all"
          >
            <Image
              src={item.url}
              alt={item.altText || item.caption || 'Foto dokumentasi servis AC'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              {item.caption && <p className="text-xs text-white font-medium line-clamp-2">{item.caption}</p>}
              <span className="inline-flex items-center gap-1 text-[11px] text-accent mt-1">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Lihat Ukuran Penuh</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Accessible Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Tutup pratinjau"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Controls */}
          {items.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Foto berikutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main Modal Image */}
          <div
            className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[65vh] max-h-[600px]">
              <Image
                src={selectedItem.url}
                alt={selectedItem.altText || selectedItem.caption || 'Foto dokumentasi servis AC'}
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            </div>
            {selectedItem.caption && (
              <div className="mt-3 text-center max-w-xl px-4 py-2 bg-slate-900/60 rounded-lg">
                <p className="text-sm text-slate-200">{selectedItem.caption}</p>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Foto {(selectedIndex || 0) + 1} dari {items.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
