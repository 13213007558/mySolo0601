import React, { useEffect } from 'react';
import { XCircle, X } from 'lucide-react';
import { useAcceptanceStore } from '@/store/acceptanceStore';

export const ErrorToast: React.FC = () => {
  const errors = useAcceptanceStore((state) => state.errors);
  const clearErrors = useAcceptanceStore((state) => state.clearErrors);

  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        clearErrors();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errors, clearErrors]);

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.map((error, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-4 bg-red-500 text-white rounded-lg shadow-lg animate-slide-in"
        >
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => clearErrors()}
            className="p-1 hover:bg-red-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
