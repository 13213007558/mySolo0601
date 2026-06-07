import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Search, ClipboardList, Baby } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-medical-100 sticky top-0 z-40 shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-400 to-medical-600 flex items-center justify-center shadow-inset-medical">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold text-medical-800 leading-tight">
                婴幼儿晨检复核清洗链
              </h1>
              <p className="text-xs text-medical-600/70">儿保随访版 · 南门母婴店</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              to="/records"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname.startsWith('/records')
                  ? 'bg-medical-500 text-white shadow-inset-medical'
                  : 'text-medical-700 hover:bg-medical-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              晨检记录
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
