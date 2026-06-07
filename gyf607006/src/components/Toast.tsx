import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function Toast() {
  const { toast, clearToast } = useAuthStore();
  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 size={18} className="text-emerald-400" />,
    error: <XCircle size={18} className="text-rose-400" />,
    info: <Info size={18} className="text-sky-400" />,
  };

  const bgMap = {
    success: 'border-emerald-500/40 bg-emerald-500/10',
    error: 'border-rose-500/40 bg-rose-500/10',
    info: 'border-sky-500/40 bg-sky-500/10',
  };

  return (
    <div className="pointer-events-none fixed left-1/2 top-6 z-[60] -translate-x-1/2">
      <div
        className={`toast-enter pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-night-50 shadow-soft backdrop-blur ${bgMap[toast.type]}`}
        onClick={clearToast}
      >
        {iconMap[toast.type]}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
