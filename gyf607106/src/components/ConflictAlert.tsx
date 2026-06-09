import { useState } from 'react';
import { AlertTriangle, X, Check, ArrowRight, Merge } from 'lucide-react';
import type { ConflictRecord } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';
import { getConflictingFields } from '@/utils/conflict';
import { getStatusText } from '@/utils/mockData';

interface ConflictAlertProps {
  conflict: ConflictRecord;
}

export function ConflictAlert({ conflict }: ConflictAlertProps) {
  const { resolveConflictById } = useOilTempStore();
  const [isResolving, setIsResolving] = useState(false);

  if (conflict.resolved) return null;

  const conflictingFields = getConflictingFields(conflict);

  const handleResolve = (resolution: 'keep_old' | 'use_new' | 'merge') => {
    setIsResolving(true);
    setTimeout(() => {
      resolveConflictById(conflict.id, resolution);
      setIsResolving(false);
    }, 300);
  };

  const formatFieldValue = (field: string, value: unknown) => {
    if (field === 'status') return getStatusText(value as 'normal' | 'abnormal' | 'pending' | 'unmarked');
    if (field === 'temperature') return `${value}°C`;
    if (field === 'modifiedAt') return new Date(value as number).toLocaleString('zh-CN');
    return String(value ?? '-');
  };

  return (
    <div className="relative bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-3 animate-in slide-in-from-top duration-300">
      <div className="absolute -top-1 -left-1">
        <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="font-medium text-amber-300 mb-1">
              检测到编辑冲突：{conflict.oldValue.deviceName} - {conflict.oldValue.measurePoint}
            </h4>
            <p className="text-sm text-amber-200/70 mb-3">
              同一记录被 <span className="font-medium">{conflict.operator1}</span> 和{' '}
              <span className="font-medium">{conflict.operator2}</span> 同时修改
            </p>

            <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-slate-400">字段</div>
                <div className="text-blue-400">原值 ({conflict.operator1})</div>
                <div className="text-orange-400">新值 ({conflict.operator2})</div>
              </div>
              {conflictingFields.map(field => (
                <div key={field} className="grid grid-cols-3 gap-2 text-xs mt-2 py-1 border-t border-slate-700">
                  <div className="text-slate-300 font-medium">{field}</div>
                  <div className="text-blue-300 font-mono">
                    {formatFieldValue(field, conflict.oldValue[field as keyof typeof conflict.oldValue])}
                  </div>
                  <div className="text-orange-300 font-mono">
                    {formatFieldValue(field, conflict.newValue[field as keyof typeof conflict.newValue])}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleResolve('keep_old')}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                保留原值
              </button>
              <button
                onClick={() => handleResolve('use_new')}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                使用新值
              </button>
              <button
                onClick={() => handleResolve('merge')}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded transition-colors disabled:opacity-50"
              >
                <Merge className="w-4 h-4" />
                合并备注
              </button>
              <span className="text-xs text-slate-400 ml-2">
                无论选择哪个，页面数据都不会清空
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
