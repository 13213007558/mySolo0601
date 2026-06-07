import { FileImage, Calendar, User } from 'lucide-react';
import type { LeaveRecord } from '../../shared/types';

interface Props {
  records: LeaveRecord[];
}

export default function LeavePhotos({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="paper-card p-6 text-center">
        <FileImage className="w-8 h-8 text-ink-300 mx-auto mb-2" />
        <div className="text-sm text-ink-500">暂无请假条照片</div>
      </div>
    );
  }

  return (
    <div className="paper-card overflow-hidden">
      <div className="px-5 py-3 border-b border-ink-100 flex items-center gap-2">
        <FileImage className="w-4 h-4 text-clay-500" />
        <span className="font-medium text-ink-700">请假条照片</span>
        <span className="chip bg-clay-50 text-clay-600 border border-clay-200 ml-auto">
          {records.length} 张
        </span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        {records.map(r => (
          <div key={r.id} className="group relative rounded-xl overflow-hidden border border-ink-100 hover:shadow-paper-lg transition-all">
            <img
              src={r.photoUrl}
              alt={r.reason}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/75 to-transparent p-3 text-paper-50">
              <div className="text-sm font-medium mb-1">{r.reason}</div>
              <div className="text-xs text-paper-100/80 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {r.leaveDate}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {r.operator}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
