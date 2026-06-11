import React, { useState } from 'react';
import { useStoneStore } from '@/store/useStoneStore';
import { ReportFieldMapping } from '@/types';
import { isStoneReadOnly } from '@/lib/utils';
import { Check, FileCheck, AlertTriangle, Copy, ArrowLeftRight, X } from 'lucide-react';

interface ReportMappingPanelProps {
  className?: string;
  onClose?: () => void;
}

export const ReportMappingPanel: React.FC<ReportMappingPanelProps> = ({ className = '', onClose }) => {
  const { getCurrentStone, confirmField } = useStoneStore();
  const stone = getCurrentStone();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const isReadOnly = isStoneReadOnly(stone);

  if (!stone) return null;

  const confirmedCount = stone.fieldMappings.filter(f => f.confirmed).length;
  const total = stone.fieldMappings.length;
  const allConfirmed = confirmedCount === total;

  const handleSyncGia = (field: ReportFieldMapping) => {
    if (isReadOnly) return;
    confirmField(stone.id, field.id, field.giaValue);
  };

  const handleSyncAll = () => {
    if (isReadOnly) return;
    stone.fieldMappings.forEach(f => {
      if (!f.confirmed) confirmField(stone.id, f.id, f.giaValue);
    });
  };

  const copyValue = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const giaReport = stone.report;
  const clarityChars = giaReport?.clarityCharacteristics || [];

  return (
    <div className={`bs-card p-5 flex flex-col ${className}`} style={{ maxHeight: 'calc(100vh - 140px)' }}>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FileCheck size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-diamond-cream">国际报告字段对照</h3>
            <p className="text-xs text-slate-500">对标 GIA / IGI 报告字段逐项校验</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!allConfirmed && !isReadOnly && (
            <button
              onClick={handleSyncAll}
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              style={{
                borderColor: '#D4AF37',
                color: '#D4AF37',
                backgroundColor: 'transparent',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
              }}
            >
              <ArrowLeftRight size={12} />
              一键同步GIA值
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="btn p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              style={{ border: 'none', background: 'transparent' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-300">整体校验进度</span>
            {allConfirmed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                <Check size={10} /> 全部通过
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-white">
            <span className={allConfirmed ? 'text-emerald-400' : 'text-diamond-gold'}>{confirmedCount}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-slate-400">{total}</span>
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              allConfirmed
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}
            style={{ width: `${(confirmedCount / total) * 100}%` }}
          />
        </div>
      </div>

      {stone?.report && (
        <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-400" />
            GIA 报告净度特征 (需在绘图板对应标记)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {clarityChars.length === 0 ? (
              <span className="text-xs text-slate-500 italic">FL/IF 级 - 无可见内含物特征</span>
            ) : clarityChars.map((char, idx) => {
              const marked = stone.inclusions.some(inc =>
                inc.type.toLowerCase().replace('_', ' ') === char.toLowerCase().replace(' ', '_') ||
                inc.type.toLowerCase().replace('_', '') === char.toLowerCase().replace(' ', '')
              );
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    marked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {marked && <Check size={10} />}
                  {char}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1" style={{ minHeight: 0 }}>
        <div className="space-y-2">
          {stone.fieldMappings.map((field, idx) => (
            <MappingRow
              key={field.id}
              index={idx}
              field={field}
              isReadOnly={!!isReadOnly}
              onSync={() => handleSyncGia(field)}
              onConfirm={() => confirmField(stone.id, field.id, field.systemValue || field.giaValue)}
              onCopy={() => copyValue(field.giaValue, field.id)}
              isCopied={copyFeedback === field.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface MappingRowProps {
  index: number;
  field: ReportFieldMapping;
  isReadOnly: boolean;
  onSync: () => void;
  onConfirm: () => void;
  onCopy: () => void;
  isCopied: boolean;
}

const MappingRow: React.FC<MappingRowProps> = ({
  field, isReadOnly, onSync, onConfirm, onCopy, isCopied, index,
}) => {
  const [localValue, setLocalValue] = useState(field.systemValue);
  const isMatch = localValue.trim() === field.giaValue.trim();

  return (
    <div
      className={`
        p-3 rounded-xl border transition-all duration-300 animate-fade-in
        ${field.confirmed
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : isMatch && localValue
            ? 'bg-diamond-gold/5 border-diamond-gold/30'
            : 'bg-slate-800/40 border-slate-700/50'
        }
      `}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`
          w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
          ${field.confirmed
            ? 'bg-emerald-500 text-white'
            : isMatch && localValue
              ? 'bg-diamond-gold text-diamond-navy'
              : 'bg-slate-700 text-slate-400'
          }
        `}>
          {field.confirmed ? <Check size={12} /> : index + 1}
        </span>
        <span className="text-sm font-semibold text-diamond-cream">{field.fieldName}</span>
        <span className="ml-auto text-[10px] text-slate-500 uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-slate-800/80">
          {field.giaCode}
        </span>
      </div>

      <div className="grid grid-cols-11 gap-2 items-start">
        <div className="col-span-5">
          <div className="text-[10px] text-slate-500 mb-1 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            GIA 报告值
          </div>
          <div className="group relative">
            <div
              className="text-sm px-3 py-2 rounded-lg bg-slate-900/60 text-slate-200 border border-slate-700/70 font-medium cursor-default"
              title="点击复制"
            >
              {field.giaValue}
            </div>
            {!isReadOnly && (
              <button
                onClick={onCopy}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700/80 text-slate-300 hover:text-white"
                title="复制GIA值"
                style={{ border: 'none' }}
              >
                {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            )}
          </div>
        </div>

        <div className="col-span-1 flex items-center justify-center pt-5">
          <ArrowLeftRight
            size={16}
            className={isMatch ? 'text-emerald-400' : 'text-slate-600'}
          />
        </div>

        <div className="col-span-5">
          <div className="text-[10px] text-slate-500 mb-1 font-medium flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${localValue ? (isMatch ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-600'}`} />
            本系统录入
          </div>
          <div className="relative">
            <input
              type="text"
              value={localValue}
              disabled={isReadOnly || field.confirmed}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={() => {
                if (localValue !== field.systemValue && !field.confirmed && !isReadOnly) {
                  onConfirm();
                }
              }}
              placeholder="输入或点击同步GIA值"
              className={`
                w-full text-sm px-3 py-2 rounded-lg font-medium transition-all
                ${field.confirmed
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                  : isMatch && localValue
                    ? 'bg-diamond-gold/10 text-diamond-gold border-diamond-gold/40'
                    : 'bg-slate-900/60 text-diamond-cream border-slate-700/70 focus:border-diamond-gold/50 focus:ring-1 focus:ring-diamond-gold/30'
                }
                border outline-none
              `}
            />
            {!field.confirmed && !isReadOnly && (
              <button
                onClick={() => { setLocalValue(field.giaValue); setTimeout(onSync, 50); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-300 hover:bg-blue-600 hover:text-white transition-colors font-medium"
                style={{ border: 'none' }}
              >
                同步
              </button>
            )}
          </div>
        </div>
      </div>

      {!field.confirmed && isMatch && localValue && !isReadOnly && (
        <button
          onClick={onConfirm}
          className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all bg-diamond-gold/15 text-diamond-gold hover:bg-diamond-gold/25 border border-diamond-gold/30"
          style={{ border: `1px solid rgba(212,175,55,0.3)` }}
        >
          <Check size={12} /> 确认匹配
        </button>
      )}
    </div>
  );
};
