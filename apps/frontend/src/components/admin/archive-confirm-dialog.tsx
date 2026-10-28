'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
}: ArchiveConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengarsipkan...
              </>
            ) : (
              'Ya, Arsipkan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
