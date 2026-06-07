import { Camera, Menu } from 'lucide-react';

interface Props {
  title?: string;
}

export default function Navbar({ title = '婴幼儿照片授权交接本' }: Props) {
  return (
    <header className="bg-white/80 backdrop-blur border-b border-cream-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif text-lg font-bold text-gray-800 leading-tight">{title}</div>
            <div className="text-[11px] text-gray-500 leading-tight">试听顾问版 · 历史版本不可覆盖</div>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-cream-100 text-gray-500">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
