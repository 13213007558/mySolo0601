import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const Watermark: React.FC = () => {
  const { mode } = useAppStore();

  if (mode !== 'drill') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45"
        style={{ opacity: 0.03 }}
      >
        <span
          className="whitespace-nowrap text-9xl font-black text-white"
          style={{ userSelect: 'none' }}
        >
          演 练 模 式
        </span>
      </div>
      
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-500/20 border border-blue-500/40 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-blue-300">演练模式</span>
      </div>
    </div>
  );
};
