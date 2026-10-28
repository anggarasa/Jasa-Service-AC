'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { HealthData } from '@tampilkit-ac/api-contract';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ConnectionStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getHealth();
      setHealth(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi backend';
      setError(msg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs bg-slate-100/90 backdrop-blur-sm border border-slate-200/80 px-3 py-1.5 rounded-full text-slate-700 shadow-sm">
      <div className="flex items-center gap-1.5 font-medium">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="hidden sm:inline">Backend API:</span>
      </div>

      {loading ? (
        <span className="flex items-center gap-1 text-slate-500">
          <RefreshCw className="w-3 h-3 animate-spin" /> Memeriksa...
        </span>
      ) : error ? (
        <Badge variant="destructive" className="h-5 px-2 text-[10px] gap-1">
          <XCircle className="w-3 h-3" /> Terputus
        </Badge>
      ) : health ? (
        <div className="flex items-center gap-1.5">
          {health.status === 'operational' ? (
            <Badge variant="success" className="h-5 px-2 text-[10px] gap-1">
              <CheckCircle2 className="w-3 h-3" /> Operasional
            </Badge>
          ) : (
            <Badge variant="accent" className="h-5 px-2 text-[10px] gap-1">
              <AlertTriangle className="w-3 h-3" /> {health.status}
            </Badge>
          )}

          <span className="text-[11px] text-slate-500 hidden md:inline">
            DB: {health.dependencies.database} • Storage: {health.dependencies.storage}
          </span>
        </div>
      ) : null}

      <Button
        variant="ghost"
        size="icon"
        className="w-5 h-5 rounded-full text-slate-500 hover:text-slate-800"
        onClick={fetchHealth}
        title="Perbarui status koneksi"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
