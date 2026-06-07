import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-dissolve">
      <div className="absolute inset-0 bg-medical-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-card w-full ${width} max-h-[90vh] flex flex-col animate-fade-in-up`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-medical-100">
          <h3 className="font-serif text-lg font-semibold text-medical-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-medical-500 hover:bg-medical-50 hover:text-medical-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
