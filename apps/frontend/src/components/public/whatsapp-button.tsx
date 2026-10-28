import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function WhatsAppButton({
  phone = '6281234567890',
  message = 'Halo CoolCare AC, saya ingin berkonsultasi mengenai service AC.',
  label = 'Chat WhatsApp',
  className = '',
  size = 'default',
}: WhatsAppButtonProps) {
  const cleanNumber = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  return (
    <Button
      asChild
      size={size}
      className={`bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 shadow-sm ${className}`}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </a>
    </Button>
  );
}
