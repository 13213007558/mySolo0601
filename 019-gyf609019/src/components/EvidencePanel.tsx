import { useAppStore } from '@/store/useAppStore';
import { Camera, Clock, Tag } from 'lucide-react';

export default function EvidencePanel() {
  const { evidences } = useAppStore();

  return (
    <div className="bg-white rounded-xl border border-steel-200 shadow-sm">
      <div className="px-5 py-3 border-b border-steel-200">
        <h2 className="text-sm font-semibold text-navy-500 uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4" />
          雨后积水证据
        </h2>
      </div>

      <div className="p-5">
        {evidences.length === 0 ? (
          <div className="text-center text-steel-400 text-sm py-8">暂无雨后证据</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidences.map((ev) => (
              <div
                key={ev.id}
                className={`rounded-lg border overflow-hidden transition-shadow hover:shadow-md ${
                  ev.isSupplemented ? 'border-warning/40' : 'border-steel-200'
                }`}
              >
                <div className="relative h-36 bg-steel-100 overflow-hidden">
                  <img
                    src={ev.photoUrl}
                    alt={ev.description}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {ev.isSupplemented && (
                    <span className="absolute top-2 right-2 text-[10px] bg-warning text-white px-2 py-0.5 rounded font-semibold shadow">
                      补录
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm text-navy-700 leading-snug">{ev.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-steel-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ev.timestamp).toLocaleDateString('zh-CN')}
                    </span>
                    {ev.isSupplemented && (
                      <span className="flex items-center gap-1 text-warning">
                        <Tag className="w-3 h-3" />
                        补录材料
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
