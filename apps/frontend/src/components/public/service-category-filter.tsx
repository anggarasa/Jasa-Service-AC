'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublicCategory } from '@tampilkit-ac/api-contract';

interface ServiceCategoryFilterProps {
  categories: PublicCategory[];
  currentCategory?: string;
  currentSearch?: string;
}

export function ServiceCategoryFilter({
  categories,
  currentCategory = '',
  currentSearch = '',
}: ServiceCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    params.delete('page');
    router.push(`/services?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search')?.toString() || '';
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set('search', search.trim());
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`/services?${params.toString()}`);
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={currentSearch}
            placeholder="Cari nama atau jenis servis AC..."
            className="pl-9 bg-white"
          />
        </div>
        <Button type="submit" variant="secondary" className="gap-1.5 shrink-0">
          <Filter className="w-4 h-4" />
          <span>Cari</span>
        </Button>
      </form>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={!currentCategory ? 'default' : 'outline'}
          onClick={() => handleCategoryChange('')}
          className="rounded-full text-xs font-medium"
        >
          Semua Layanan
        </Button>
        {categories.map((cat) => {
          const isSelected = currentCategory === cat.slug || currentCategory === cat.id;
          return (
            <Button
              key={cat.id}
              type="button"
              size="sm"
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => handleCategoryChange(cat.slug)}
              className="rounded-full text-xs font-medium"
            >
              {cat.name}
              {cat.serviceCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {cat.serviceCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
