'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Camera, Image as ImageIcon, Loader2, Trash2, X } from 'lucide-react';

interface PhotoItem {
  id: string;
  acUnitId: string;
  url: string;
  caption?: string | null;
  createdAt: string;
}

interface AcUnitPhotoGalleryProps {
  unitId: string;
  initialPhotos: PhotoItem[];
}

export function AcUnitPhotoGallery({ unitId, initialPhotos }: AcUnitPhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [selectedImage, setSelectedImage] = useState<PhotoItem | null>(null);

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);

    if (!file) {
      setUploadError('Pilih berkas foto terlebih dahulu.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const res = await fetch(`/api/admin/ac-units/${unitId}/photos`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Gagal mengunggah foto');
      }

      setPhotos((prev) => [json.data, ...prev]);
      setFile(null);
      setCaption('');
      // Reset input element
      const inputEl = document.getElementById('photo-input') as HTMLInputElement;
      if (inputEl) inputEl.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus foto dokumentasi ini?')) {
      return;
    }

    setDeletingId(photoId);

    try {
      const res = await fetch(`/api/admin/ac-units/${unitId}/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (selectedImage?.id === photoId) {
          setSelectedImage(null);
        }
      }
    } catch {
      alert('Gagal menghapus foto.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <form onSubmit={handleUpload} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Camera className="w-4 h-4 text-accent" />
          Unggah Dokumentasi Foto Unit
        </h4>

        {uploadError && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 py-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-xs">{uploadError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="photo-input" className="text-xs font-medium">Pilih Berkas (JPEG, PNG, WebP max 5MB)</Label>
            <input
              id="photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isUploading}
              className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-white hover:file:bg-slate-100"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="photo-caption" className="text-xs font-medium">Keterangan / Caption (Opsional)</Label>
            <Input
              id="photo-caption"
              placeholder="Contoh: Kondisi outdoor sebelum diservis"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isUploading}
              className="h-8 text-xs bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isUploading || !file}
            className="bg-accent hover:bg-accent/90 text-white text-xs h-8"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Mengunggah ke MinIO...
              </>
            ) : (
              'Unggah Foto'
            )}
          </Button>
        </div>
      </form>

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">Belum ada foto dokumentasi untuk unit ini.</p>
          <p className="text-xs text-slate-400 mt-0.5">Unggah foto unit indoor/outdoor atau label spesifikasi pabrik.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow transition-shadow"
            >
              <div
                className="aspect-video bg-slate-100 cursor-pointer overflow-hidden relative"
                onClick={() => setSelectedImage(p)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption || 'Foto unit AC'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </div>

              <div className="p-2 flex items-center justify-between gap-1 text-xs">
                <span className="truncate text-slate-700 font-medium" title={p.caption || ''}>
                  {p.caption || 'Tanpa keterangan'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  title="Hapus foto"
                >
                  {deletingId === p.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors z-10"
              aria-label="Tutup pratinjau"
            >
              <X className="w-5 h-5" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.url}
              alt={selectedImage.caption || 'Foto unit AC'}
              className="max-h-[75vh] w-auto mx-auto object-contain"
            />

            {selectedImage.caption && (
              <div className="p-3 bg-slate-950/90 text-white text-xs border-t border-slate-800 text-center">
                {selectedImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
