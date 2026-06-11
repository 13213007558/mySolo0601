import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { StoneQueue } from '@/components/StoneQueue';
import { DiamondPlotBoard } from '@/components/DiamondPlotBoard';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { LegendPanel } from '@/components/LegendPanel';
import { ReportMappingPanel } from '@/components/ReportMappingPanel';
import { ExportTools } from '@/components/ExportTools';
import { ErratumModal } from '@/components/ErratumModal';
import { useStoneStore } from '@/store/useStoneStore';
import { STATUS_LABELS } from '@/config/inclusionTypes';
import { Send, FileCheck, Gem, CheckCircle2, AlertTriangle } from 'lucide-react';

type RightTab = 'progress' | 'legend' | 'mapping' | 'export';

export default function Workbench() {
  const { loadFromStorage, getCurrentStone, submitStone } = useStoneStore();
  const [erratumOpen, setErratumOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>('progress');
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [submitFlash, setSubmitFlash] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const stone = getCurrentStone();
  const isComplete = stone?.progress === 100;
  const isReadOnly = stone?.status === 'submitted';
  const allMappingsConfirmed = stone?.fieldMappings.every(f => f.confirmed) ?? false;
  const canSubmit = isComplete && allMappingsConfirmed && !isReadOnly;

  const handleSubmit = () => {
    if (!canSubmit || !stone) return;
    setSubmitFlash(true);
    setTimeout(() => {
      submitStone(stone.id);
      setSubmitFlash(false);
    }, 800);
  };

  const rightTabs: { key: RightTab; label: string; icon: React.ElementType }[] = [
    { key: 'progress', label: '完成度', icon: CheckCircle2 },
    { key: 'legend', label: '图例', icon: Gem },
    { key: 'mapping', label: '报告对照', icon: FileCheck },
    { key: 'export', label: '导出', icon: FileCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col diamond-texture">
      <TopBar onOpenErratum={() => setErratumOpen(true)} />

      <div className="flex-1 container-fluid py-4 px-3 lg:px-5" style={{ maxWidth: '2400px' }}>
        <div className="row g-3 gy-3">
          {/* 左侧：裸石队列 */}
          <div className="col-12 col-lg-3 col-xl-2 order-2 order-lg-1 animate-slide-in-left">
            <StoneQueue />
          </div>

          {/* 中间：绘图板主区域 */}
          <div className="col-12 col-lg-6 col-xl-7 order-1 order-lg-2 animate-fade-in">
            <div className="bs-card p-4 lg:p-6 h-full">
              {/* 中间顶部：裸石详情头部 */}
              {stone && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-diamond-gold/30 shadow-lg">
                      <img
                        src={stone.imageUrl}
                        alt={stone.certificateNo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-bold text-diamond-cream">
                          {stone.certificateNo}
                        </h2>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_LABELS[stone.status]?.class || ''}`}>
                          {STATUS_LABELS[stone.status]?.text}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 font-semibold text-diamond-gold">
                          {stone.carat} ct
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80">颜色 {stone.color}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80">净度 {stone.clarity}</span>
                        {stone.report && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            切工 {stone.report.cutGrade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReportPanel(!showReportPanel)}
                      className={`
                        btn btn-sm d-flex align-items-center gap-1.5
                        ${showReportPanel ? 'bg-diamond-gold text-diamond-navy' : ''}
                      `}
                      style={{
                        background: showReportPanel ? 'linear-gradient(135deg, #FFD700, #D4AF37)' : undefined,
                        color: showReportPanel ? '#0F172A' : undefined,
                        borderColor: '#D4AF37',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <FileCheck size={14} />
                      报告字段对照
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className={`
                        btn d-flex align-items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                        ${canSubmit
                          ? submitFlash
                            ? 'scale-105 animate-glow-gold'
                            : 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-diamond-gold/30'
                          : 'opacity-50 cursor-not-allowed grayscale'
                        }
                      `}
                      style={{
                        background: canSubmit
                          ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)'
                          : 'rgba(100,116,139,0.3)',
                        color: canSubmit ? '#0F172A' : '#64748B',
                        border: `2px solid ${canSubmit ? '#FFD700' : 'rgba(100,116,139,0.3)'}`,
                        boxShadow: canSubmit ? '0 4px 20px rgba(212,175,55,0.35)' : 'none',
                      }}
                    >
                      <Send size={15} className={submitFlash ? 'animate-pulse' : ''} />
                      {isReadOnly ? '已提交' : canSubmit ? '提交对标报告' : isComplete ? '请完成报告对照' : '完成度未满100%'}
                    </button>
                  </div>
                </div>
              )}

              {/* 双栏：主绘图板 + 报告对照（可折叠） */}
              <div className="d-flex gap-3" style={{ minHeight: '500px' }}>
                {/* 绘图板 */}
                <div
                  className={`transition-all duration-500 ${showReportPanel ? 'flex-grow-0 flex-shrink-0' : 'w-100'}`}
                  style={{
                    width: showReportPanel ? 'calc(50% - 12px)' : '100%',
                    minWidth: showReportPanel ? '400px' : undefined,
                  }}
                >
                  <div className="h-100 d-flex flex-column">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-diamond-gold animate-pulse" />
                        <h3 className="font-display text-base font-semibold text-diamond-cream">俯视绘图板</h3>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Top-View Plot Board · 圆形明亮式切工
                      </span>
                    </div>
                    <div
                      className="flex-1 rounded-xl p-3 d-flex align-items-center justify-center relative overflow-hidden"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.95) 70%)',
                        border: '1px solid rgba(148,163,184,0.15)',
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{
                          background: `
                            conic-gradient(from 0deg at 50% 50%,
                              rgba(212,175,55,0.03) 0deg, rgba(255,255,255,0.02) 45deg,
                              rgba(212,175,55,0.03) 90deg, rgba(255,255,255,0.02) 135deg,
                              rgba(212,175,55,0.03) 180deg, rgba(255,255,255,0.02) 225deg,
                              rgba(212,175,55,0.03) 270deg, rgba(255,255,255,0.02) 315deg,
                              rgba(212,175,55,0.03) 360deg
                            )
                          `,
                        }}
                      />
                      <DiamondPlotBoard className="relative z-10 w-100" />
                    </div>

                    {/* 提交提示条 */}
                    {stone && !isReadOnly && (
                      <div className={`
                        mt-3 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-3
                        transition-all duration-500
                        ${canSubmit
                          ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-300'
                          : !isComplete
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                            : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                        }
                      `}>
                        <div className="flex items-center gap-2">
                          {canSubmit ? (
                            <CheckCircle2 size={15} className="animate-pulse" />
                          ) : !isComplete ? (
                            <AlertTriangle size={15} />
                          ) : (
                            <FileCheck size={15} />
                          )}
                          <span>
                            {canSubmit
                              ? '所有要求达标，可提交对标报告'
                              : !isComplete
                                ? `完成度 ${stone.progress}% - 还需标记 ${Math.max(0, stone.requiredInclusionCount - stone.inclusions.length)} 个内含物`
                                : `绘图完成，报告字段对照进行中 (${stone.fieldMappings.filter(f => f.confirmed).length}/${stone.fieldMappings.length})`
                            }
                          </span>
                        </div>
                        {canSubmit && (
                          <span className="flex items-center gap-1 animate-pulse">
                            <span>点击右上角提交</span>
                            <Send size={12} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 可折叠的报告对照面板 */}
                {showReportPanel && (
                  <div
                    className="flex-grow-1 animate-slide-in-right"
                    style={{ minWidth: '380px' }}
                  >
                    <ReportMappingPanel onClose={() => setShowReportPanel(false)} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：功能面板（Tab切换） */}
          <div className="col-12 col-lg-3 col-xl-3 order-3 animate-slide-in-right">
            <div className="bs-card p-3 h-full d-flex flex-column" style={{ maxHeight: 'calc(100vh - 140px)' }}>
              {/* Tab 导航 */}
              <div className="d-flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-700/50 mb-4">
                {rightTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setRightTab(tab.key)}
                    className={`
                      flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all d-flex align-items-center justify-content-center gap-1.5
                      ${rightTab === tab.key
                        ? 'bg-gradient-to-br from-diamond-gold/25 to-yellow-700/15 text-diamond-gold shadow-sm border border-diamond-gold/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }
                    `}
                    style={{ border: rightTab !== tab.key ? '1px solid transparent' : undefined }}
                  >
                    <tab.icon size={13} />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab 内容 */}
              <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                {rightTab === 'progress' && (
                  <div className="h-full animate-fade-in">
                    <ProgressIndicator />
                  </div>
                )}
                {rightTab === 'legend' && (
                  <div className="h-full animate-fade-in">
                    <LegendPanel />
                  </div>
                )}
                {rightTab === 'mapping' && (
                  <div className="h-full animate-fade-in">
                    <ReportMappingPanel />
                  </div>
                )}
                {rightTab === 'export' && (
                  <div className="h-full animate-fade-in">
                    <ExportTools />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态条 */}
      <footer className="px-5 py-2.5 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500"
        style={{ background: 'rgba(15,23,42,0.6)' }}
      >
        <div className="flex items-center gap-4">
          <span>© 2024 裸石加工坊质检系统 · 钻石内含Plot台 v1.0</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">BUILD-2024.06</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            质检合规系统已接入
          </span>
          <span className="hidden md:inline">
            合规约束：提交后只读 · 修正须走勘误流程
          </span>
        </div>
      </footer>

      <ErratumModal isOpen={erratumOpen} onClose={() => setErratumOpen(false)} />
    </div>
  );
}
