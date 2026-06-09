import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Link,
  Copy,
  Check,
} from 'lucide-react';
import type { BracketRecord } from '@/types';
import { STATUS_LABELS } from '@/types';
import { useBracketStore } from '@/store/useBracketStore';
import { generateTraceableURL, copyToClipboard } from '@/utils/export';

interface RecordRowProps {
  record: BracketRecord;
  index: number;
}

const statusStyles = {
  processed: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: CheckCircle2,
  },
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    icon: Clock,
  },
  problem: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: AlertCircle,
  },
  manual: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Edit3,
  },
};

export const RecordRow: React.FC<RecordRowProps> = ({ record, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const filterParams = useBracketStore((state) => state.filterParams);
  const highlightedRecordId = useBracketStore((state) => state.highlightedRecordId);
  const setHighlightedRecord = useBracketStore((state) => state.setHighlightedRecord);

  const style = statusStyles[record.status];
  const StatusIcon = style.icon;
  const isHighlighted = highlightedRecordId === record.id;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateTraceableURL(filterParams, record.id);
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setHighlightedRecord(record.id);
      setTimeout(() => {
        setCopied(false);
        setHighlightedRecord(null);
      }, 2000);
    }
  };

  const angleDiff = record.targetAngle - record.currentAngle;

  return (
    <>
      <tr
        className={`border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer ${
          isHighlighted ? 'bg-yellow-50 animate-pulse' : ''
        } ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
        onClick={() => setExpanded(!expanded)}
        style={{
          animationDelay: `${index * 50}ms`,
        }}
      >
        <td className="px-4 py-3 text-sm font-mono font-medium text-slate-800">
          {record.bracketNo}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">{record.installDate}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{record.location}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono ${angleDiff !== 0 ? 'text-orange-600' : 'text-slate-700'}`}>
              {record.currentAngle}°
            </span>
            {angleDiff !== 0 && (
              <span className="text-xs text-orange-500 font-mono">
                (目标: {record.targetAngle}°)
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">{record.handler || '-'}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{record.processDate || '-'}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-medium ${style.bg} ${style.text} border ${style.border}`}>
            <StatusIcon className="w-3 h-3" />
            {STATUS_LABELS[record.status]}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-mono text-slate-500">{record.version}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={handleCopyLink}
              className="p-1.5 hover:bg-slate-200 rounded transition-colors"
              title="复制追溯链接"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Link className="w-4 h-4 text-slate-400" />}
            </button>
            <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50 border-b border-slate-200">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">备注</p>
                <p className="text-slate-700 mt-1">{record.remark || '无'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">创建时间</p>
                <p className="text-slate-700 mt-1">{new Date(record.createdAt).toLocaleString('zh-CN')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">更新时间</p>
                <p className="text-slate-700 mt-1">{new Date(record.updatedAt).toLocaleString('zh-CN')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">记录 ID</p>
                <p className="text-slate-700 mt-1 font-mono text-xs">{record.id}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
