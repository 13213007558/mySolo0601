import React from 'react';
import { useStoneStore } from '@/store/useStoneStore';
import { STATUS_LABELS } from '@/config/inclusionTypes';
import { canRequestErratum, canApproveErratum, isStoneReadOnly } from '@/lib/utils';
import { Gem, User, FileWarning, Eye, EyeOff, Grid3X3, LayoutGrid, AlertTriangle } from 'lucide-react';
import { usePlotStore } from '@/store/useStoneStore';

interface TopBarProps {
  onOpenErratum: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenErratum }) => {
  const { getCurrentStone, approveErratum, errata } = useStoneStore();
  const { showSectorHints, showPhotoOverlay, toggleSectorHints, togglePhotoOverlay } = usePlotStore();
  const stone = getCurrentStone();

  const pendingErratum = stone ? errata.find(e => e.stoneId === stone.id && e.status === 'pending') : null;
  const showErratumBtn = canRequestErratum(stone);
  const showApproveBtn = canApproveErratum(stone) && !!pendingErratum;
  const readonly = isStoneReadOnly(stone);

  return (
    <header
      className="px-6 py-3 border-b border-slate-700/50 flex items-center justify-between backdrop-blur-md sticky top-0 z-50"
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 animate-slide-in-left">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-diamond-gold via-yellow-500 to-yellow-700 flex items-center justify-center shadow-lg shadow-diamond-gold/20">
              <Gem size={22} className="text-diamond-navy" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-diamond-navy animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-gold-gradient leading-none">
              钻石内含 Plot 台
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 tracking-wider uppercase">
              Diamond Inclusion Plotting Workstation
            </p>
          </div>
        </div>

        {stone && (
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-slate-700/50 animate-fade-in">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">当前裸石</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-diamond-cream">{stone.certificateNo}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {stone.carat}ct · {stone.color} · {stone.clarity}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_LABELS[stone.status]?.class || 'bg-slate-600'}`}>
                {STATUS_LABELS[stone.status]?.text || stone.status}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 animate-slide-in-right">
        <div className="hidden md:flex items-center gap-1 bg-slate-800/60 rounded-lg p-1 mr-2">
          <button
            onClick={toggleSectorHints}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${showSectorHints ? 'bg-diamond-gold/20 text-diamond-gold' : 'text-slate-400 hover:text-slate-200'}
            `}
            title="显示/隐藏扇区提示"
          >
            <Grid3X3 size={14} />
            <span className="hidden lg:inline">扇区网格</span>
          </button>
          <button
            onClick={togglePhotoOverlay}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${showPhotoOverlay ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}
            `}
            title="显示/隐藏照片叠加"
          >
            {showPhotoOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="hidden lg:inline">照片底图</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            title="切换布局视图"
          >
            <LayoutGrid size={14} />
            <span className="hidden lg:inline">布局</span>
          </button>
        </div>

        {showApproveBtn && pendingErratum && (
          <button
            onClick={() => approveErratum(pendingErratum.id)}
            className="btn btn-sm d-flex align-items-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
            }}
          >
            <AlertTriangle size={13} />
            审批勘误 · 解锁编辑
          </button>
        )}

        {showErratumBtn && (
          <button
            onClick={onOpenErratum}
            className="btn btn-sm d-flex align-items-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
            }}
          >
            <FileWarning size={13} />
            申请勘误
          </button>
        )}

        {readonly && !showApproveBtn && !showErratumBtn && (
          <span className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30">
            <FileWarning size={12} />
            {stone?.status === 'erratum_pending' ? '勘误审核中 · 保持锁定' : '已提交 · 合规锁定'}
          </span>
        )}

        <div className="w-px h-8 bg-slate-700 mx-1 hidden md:block" />

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-diamond-cream leading-none">值守员</div>
            <div className="text-[10px] text-slate-500 mt-0.5">#Q-2024-087</div>
          </div>
        </div>
      </div>
    </header>
  );
};
