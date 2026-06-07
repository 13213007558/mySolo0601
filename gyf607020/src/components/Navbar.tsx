import { Baby, LogOut } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-brand-100 sticky top-0 z-40 shadow-soft">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center shadow-md">
            <Baby className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-gray-800 leading-tight">
              婴幼儿奶量交接授权库
            </h1>
            <p className="text-xs text-gray-500">门店售后版 · 南门母婴店</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">店长王姐</p>
            <p className="text-xs text-gray-400">在线</p>
          </div>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-cream-100 hover:text-brand-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
