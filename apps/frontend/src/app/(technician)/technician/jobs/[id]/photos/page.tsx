'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  deleteWorkOrderPhoto,
  fetchTechnicianWorkOrderDetail,
  uploadWorkOrderPhoto,
} from '@/lib/api/technician';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Upload,
  RefreshCw,
  AlertCircle,
  Plus,
  ImageIcon,
} from 'lucide-react';
import { WorkOrderPhotoCategory } from '@tampilkit-ac/api-contract';

const categoryConfig: Record<string, { label: string; color: string }> = {
  BEFORE: { label: 'Sebelum Servis (Before)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  DURING: { label: 'Proses Pengerjaan (During)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  AFTER: { label: 'Sesudah Servis (After)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  ISSUE: { label: 'Temuan Kerusakan (Issue)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export default function TechnicianPhotosPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WorkOrderPhotoCategory>('BEFORE');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchTechnicianWorkOrderDetail(id);
      setJob(res);
      if (res.items?.length > 0 && !selectedUnitId) {
        setSelectedUnitId(res.items[0].id);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat galeri foto dokumentasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCategory);
      if (selectedUnitId) {
        formData.append('workOrderItemId', selectedUnitId);
      }
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      await uploadWorkOrderPhoto(id, formData);
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto dokumentasi');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;

    try {
      await deleteWorkOrderPhoto(id, photoId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus foto');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-slate-500 font-medium">Memuat dokumentasi foto...</p>
      </div>
    );
  }

  if (!job) return null;

  const photos = job.photos || [];
  const filteredPhotos =
    activeTab === 'ALL'
      ? photos
      : photos.filter((p: any) => p.category === activeTab);

  return (
    <div className="space-y-5 pb-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/technician/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke SPK
        </Link>
        <span className="text-xs font-mono text-slate-500">{job.workOrderNumber}</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Camera className="w-6 h-6 text-primary" />
          Dokumentasi Foto Pekerjaan
        </h1>
        <p className="text-xs text-muted-foreground">
          Unggah foto kondisi unit AC sebelum servis, proses cuci, kondisi sesudah servis, dan temuan kendala.
        </p>
      </div>

      {/* Upload Box */}
      {job.status !== 'COMPLETED' && (
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" /> Unggah Foto Dokumentasi Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Kategori Foto</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as WorkOrderPhotoCategory)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="BEFORE">Sebelum Servis (Before)</option>
                  <option value="DURING">Proses Pengerjaan (During)</option>
                  <option value="AFTER">Sesudah Servis (After)</option>
                  <option value="ISSUE">Temuan Kerusakan (Issue)</option>
                </select>
              </div>

              {/* Unit AC */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tautkan ke Unit AC</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {job.items.map((item: any, idx: number) => (
                    <option key={item.id} value={item.id}>
                      Unit #{idx + 1} — {item.serviceNameSnapshot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Keterangan / Catatan Foto (Opsional)</label>
              <Input
                placeholder="Misal: Kondisi evaporator sebelum dicuci steam..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* File input button */}
            <div className="pt-1 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload-input"
              />
              <Button
                type="button"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Mengunggah...
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 mr-1.5" /> Ambil / Pilih Foto
                  </>
                )}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Format: JPG, PNG, WebP (Maks 5 MB)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
            activeTab === 'ALL'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua ({photos.length})
        </button>
        {Object.keys(categoryConfig).map((cat) => {
          const count = photos.filter((p: any) => p.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                activeTab === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {categoryConfig[cat].label.split(' ')[0]} ({count})
            </button>
          );
        })}
      </div>

      {/* Gallery Grid */}
      {filteredPhotos.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white">
          <CardContent className="py-12 text-center space-y-2">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">Belum ada foto pada kategori ini</p>
            <p className="text-xs text-muted-foreground">
              Gunakan tombol di atas untuk mengambil foto langsung dari kamera atau galeri ponsel.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredPhotos.map((photo: any) => {
            const catInfo = categoryConfig[photo.category] || {
              label: photo.category,
              color: 'bg-slate-100 text-slate-800',
            };

            const imageUrl = `/api/v1/technician/work-orders/${job.id}/photos/${photo.id}/content`;

            return (
              <Card
                key={photo.id}
                className="border-slate-200/80 shadow-sm bg-white overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-video w-full bg-slate-100 relative overflow-hidden group">
                  <img
                    src={imageUrl}
                    alt={photo.caption || 'Foto pengerjaan'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className={`text-[10px] font-bold ${catInfo.color}`}>
                      {catInfo.label}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 space-y-2 text-xs">
                  {photo.caption ? (
                    <p className="font-medium text-slate-800">{photo.caption}</p>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">Tanpa keterangan</p>
                  )}

                  {photo.workOrderItem && (
                    <p className="text-[11px] text-slate-500">
                      Terkait: {photo.workOrderItem.serviceNameSnapshot}
                    </p>
                  )}

                  {job.status !== 'COMPLETED' && (
                    <div className="pt-1 flex justify-end border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
