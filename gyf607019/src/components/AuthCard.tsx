import { useNavigate } from 'react-router-dom';
import { Baby, Phone, UserCircle, FileWarning, Pencil, CheckSquare, Square } from 'lucide-react';
import type { AuthorizationRecord } from '@/types';
import StatusBadge from './StatusBadge';
import { desensitizePhone } from '@/utils';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  record: AuthorizationRecord;
  index: number;
}

export default function AuthCard({ record, index }: Props) {
  const navigate = useNavigate();
  const selected = useAppStore((s) => s.selectedRecordIds.includes(record.id));
  const toggleSelect = useAppStore((s) => s.toggleSelectRecord);

  const hasException = !!record.phoneValidationIssues?.length || record.status === 'partial' || record.status === 'rejected';
  const staggerClass = `stagger-${index % 10}`;

  return (
    <div
      onClick={() => navigate(`/record/${record.id}`)}
      className={`group relative bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden opacity-0 animate-fade-in-up ${staggerClass} ${
        selected ? 'ring-2 ring-medical-500 ring-offset-2' : ''
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          record.status === 'approved'
            ? 'bg-safety-500'
            : record.status === 'pending'
            ? 'bg-warning-500'
            : record.status === 'rejected'
            ? 'bg-danger-500'
            : 'bg-medical-500'
        }`}
      />

      <div
        onClick={(e) => {
          e.stopPropagation();
          toggleSelect(record.id);
        }}
        className="absolute top-3 right-3 z-10 p-1 rounded hover:bg-slate-100 transition-colors"
      >
        {selected ? (
          <CheckSquare className="w-4 h-4 text-medical-600" />
        ) : (
          <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
        )}
      </div>

      <div className="p-4 pt-5">
        <div className="flex items-start justify-between mb-3 pr-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif-sc text-lg font-semibold text-slate-800">
                {record.nickname}
              </h3>
              {record.isSupplemented && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-50 text-violet-600 border border-violet-200">
                  补录
                </span>
              )}
              {hasException && (
                <FileWarning className="w-4 h-4 text-warning-500" />
              )}
            </div>
            <p className="text-xs text-slate-500">{record.babyName} · {record.babyBirthDate}</p>
          </div>
          <StatusBadge status={record.status} />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <UserCircle className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 w-16 shrink-0">授权人</span>
            <span className="font-medium text-slate-700">{record.authorizerName}</span>
            <span className="text-xs text-slate-400">（{record.relationship}）</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 w-16 shrink-0">手机号</span>
            <span className="font-mono text-sm">{desensitizePhone(record.authorizerPhone)}</span>
            {record.phoneValidationIssues?.length ? (
              <span className="text-[10px] text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded">格式已校正</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Baby className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 w-16 shrink-0">处理护士</span>
            <span className="text-slate-700">{record.handledByName}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">创建于 {record.createdAt.slice(0, 10)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/record/${record.id}/edit`);
            }}
            className="inline-flex items-center gap-1 text-xs text-medical-600 hover:text-medical-700 font-medium px-2 py-1 rounded hover:bg-medical-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            复核编辑
          </button>
        </div>
      </div>
    </div>
  );
}
