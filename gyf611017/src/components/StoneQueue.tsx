import React, { useState } from 'react';
import { useStoneStore } from '@/store/useStoneStore';
import { STATUS_LABELS, SECTOR_NAMES } from '@/config/inclusionTypes';
import { Stone } from '@/types';
import { Gem, ChevronRight, Search, Filter, Clock, CheckCircle, AlertCircle, Sparkles, XCircle } from 'lucide-react';

interface StoneQueueProps {
  className?: string;
}

export const StoneQueue: React.FC<StoneQueueProps> = ({ className = '' }) => {
  const { stones, currentStoneId, selectStone } = useStoneStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = stones.filter(s => {
    const matchSearch = s.certificateNo.toLowerCase().includes(search.toLowerCase()) ||
      `${s.carat}`.includes(search);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: stones.length,
      pending: 0,
      in_progress: 0,
      submitted: 0,
      erratum_pending: 0,
    };
    stones.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const filters = [
    { key: 'all', label: '全部', count: statusCounts.all, icon: Filter },
    { key: 'pending', label: '待开始', count: statusCounts.pending || 0, icon: Clock },
    { key: 'in_progress', label: '进行中', count: statusCounts.in_progress || 0, icon: Sparkles },
    { key: 'submitted', label: '已提交', count: statusCounts.submitted || 0, icon: CheckCircle },
    { key: 'erratum_pending', label: '勘误', count: statusCounts.erratum_pending || 0, icon: AlertCircle },
  ];

  return (
    <div className={`bs-card p-4 flex flex-col h-full ${className}`} style={{ maxHeight: 'calc(100vh - 140px)' }}>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-diamond-gold to-yellow-600 flex items-center justify-center">
            <Gem size={16} className="text-diamond-navy" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-diamond-cream">裸石队列</h3>
            <p className="text-[10px] text-slate-500">{stones.length} 颗待处理</p>
          </div>
        </div>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索证书号 / 克拉..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bs-input pl-9 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${filterStatus === f.key
                  ? 'bg-diamond-gold text-diamond-navy'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-300 border border-slate-700/50'
                }
              `}
            >
              <f.icon size={10} />
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === f.key ? 'bg-diamond-navy/20' : 'bg-slate-700/50'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ minHeight: 0 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <XCircle size={32} className="opacity-40 mb-2" />
            <span className="text-sm">无匹配裸石</span>
          </div>
        ) : (
          filtered.map((stone, idx) => (
            <StoneCard
              key={stone.id}
              stone={stone}
              index={idx}
              isActive={stone.id === currentStoneId}
              onClick={() => selectStone(stone.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface StoneCardProps {
  stone: Stone;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const StoneCard: React.FC<StoneCardProps> = ({ stone, index, isActive, onClick }) => {
  const statusInfo = STATUS_LABELS[stone.status];

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-xl border-2 transition-all duration-300 group relative overflow-hidden
        ${isActive
          ? 'border-diamond-gold bg-gradient-to-br from-diamond-gold/10 to-transparent shadow-lg shadow-diamond-gold/10'
          : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
        }
        animate-slide-in-up
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${isActive ? 'border-diamond-gold' : 'border-slate-700'}`}
          >
            <img
              src={stone.imageUrl}
              alt={stone.certificateNo}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-[10px] font-bold text-diamond-gold">
            {index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <div className={`text-xs font-bold truncate ${isActive ? 'text-diamond-gold' : 'text-diamond-cream'}`}>
                {stone.certificateNo}
              </div>
              <div className="text-[10px] text-slate-500">
                {stone.carat}ct · {stone.color}色 · {stone.clarity}
              </div>
            </div>
            <ChevronRight
              size={14}
              className={`mt-1 flex-shrink-0 transition-transform ${isActive ? 'text-diamond-gold translate-x-0' : 'text-slate-600 -translate-x-1 group-hover:translate-x-0'}`}
            />
          </div>

          <div className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 ${statusInfo.class}`}>
            {statusInfo.text}
          </div>

          <div className="relative h-1.5 bg-slate-700/70 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                stone.progress >= 100
                  ? 'bg-gradient-to-r from-diamond-gold to-yellow-400'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${stone.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]">
            <span className="text-slate-500">
              <span className={stone.progress >= 100 ? 'text-diamond-gold font-semibold' : 'text-slate-400'}>
                {stone.progress}%
              </span>
              {' · '}
              {stone.inclusions.length}个内含物
            </span>
            {stone.requiredSectors.length > 0 && (
              <span className="text-slate-500">
                {Math.min(stone.inclusions.length, stone.requiredSectors.length)}/{stone.requiredSectors.length}扇区
              </span>
            )}
          </div>
        </div>
      </div>

      {isActive && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-diamond-gold/10 to-transparent rounded-bl-full pointer-events-none" />
      )}
    </button>
  );
};
