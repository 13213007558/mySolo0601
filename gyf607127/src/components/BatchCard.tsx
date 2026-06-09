import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  User,
  Phone
} from 'lucide-react';
import type { BatchData } from '@/types';
import { formatCurrency, formatCount, hidePhone, getStatusLabel, getBatchAbnormalTypes } from '@/utils/compare';

interface BatchCardProps {
  batch: BatchData;
  index: number;
  isSelected: boolean;
  onSelect: (batchId: string) => void;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  processing: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export const BatchCard = forwardRef<HTMLDivElement, BatchCardProps>(
  ({ batch, index, isSelected, onSelect }, ref) => {
  const abnormalTypes = getBatchAbnormalTypes(batch);
  const hasAbnormal = abnormalTypes.length > 0;
  const status = statusConfig[batch.status];
  const StatusIcon = status.icon;

  const getBorderStyle = () => {
    if (batch.hasMismatch) return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
    if (batch.hasDuplicateStation) return 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]';
    if (!batch.hiddenPhone) return 'border-orange-500/70';
    if (isSelected) return 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
    return 'border-slate-700 hover:border-slate-600';
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={() => onSelect(batch.id)}
      className={`relative bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border-2 cursor-pointer transition-all duration-300 ${getBorderStyle()} ${
        batch.hasMismatch ? 'animate-pulse' : ''
      }`}
    >
      {hasAbnormal && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          {batch.hasMismatch && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
              title="导出数据不一致"
            >
              <AlertCircle className="w-4 h-4 text-white" />
            </motion.div>
          )}
          {batch.hasDuplicateStation && (
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg"
              title="站点同名串站"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
            </motion.div>
          )}
          {!batch.hiddenPhone && (
            <div
              className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"
              title="手机号泄露"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">{batch.stationName}</h3>
            {batch.hasDuplicateStation && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                ⚠ 同名 {batch.duplicateStations?.length || 2} 站
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{batch.projectName}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color} border ${status.border} flex items-center gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {getStatusLabel(batch.status)}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">批次号</p>
            <p className="text-sm font-mono text-slate-300">{batch.batchNo}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">提交时间</p>
            <p className="text-sm text-slate-300">{batch.submitTime.slice(5, 16)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400 flex items-center gap-1">
            <FileText className="w-4 h-4" />
            证书数量
          </span>
          <div className="flex items-center gap-2">
            {batch.hasMismatch ? (
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono text-lg font-bold">
                  导出: {formatCount(batch.exportCount)}
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-white font-mono text-lg font-bold">
                  卡片: {formatCount(batch.cardCount)}
                </span>
                <span className="text-red-400 text-sm font-bold">
                  ↓{batch.cardCount - batch.exportCount}
                </span>
              </div>
            ) : (
              <span className="text-emerald-400 font-mono text-lg font-bold">
                {formatCount(batch.cardCount)} 张
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">结算金额</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {formatCurrency(batch.amount)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <User className="w-4 h-4" />
          <span>{batch.operator}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className={`w-4 h-4 ${!batch.hiddenPhone ? 'text-orange-400' : 'text-slate-500'}`} />
          <span className={!batch.hiddenPhone ? 'text-orange-400 font-mono' : 'text-slate-500 font-mono'}>
            {batch.hiddenPhone ? hidePhone(batch.phone || '') : batch.phone}
          </span>
          {!batch.hiddenPhone && (
            <span className="text-xs text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded">
              泄露
            </span>
          )}
        </div>
      </div>

      {batch.consultantNote && (
        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <p className="text-xs text-emerald-400">
            📝 {batch.consultantNote}
          </p>
        </div>
      )}
    </motion.div>
  );
});

BatchCard.displayName = 'BatchCard';
