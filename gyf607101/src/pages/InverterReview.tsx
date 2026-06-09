import { useEffect } from 'react';
import { useInverterStore } from '@/store/inverterStore';
import { ExpandableCard } from '@/components/ExpandableCard';
import { getStatusText, getStatusColor, formatDate } from '@/utils';
import { LAOZHOU_TEST_INVERTER_ID } from '@/data/mockData';
import { Thermometer, User, Clock, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InverterReview() {
  const { inverters, initData, createSnapshot } = useInverterStore();

  useEffect(() => {
    initData();
  }, [initData]);

  const handleExpand = (inverterId: string) => {
    createSnapshot(inverterId);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                能源光伏逆变器复核台
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                月底核对专用 · 组串温度备注折叠展示 · 老周补录测试数据已内置
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">总计复核</div>
            <div className="text-3xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {inverters.length}
              <span className="text-sm text-slate-500 ml-1">台</span>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">异常数量</div>
            <div className="text-3xl font-bold text-amber-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {inverters.filter((i) => i.status !== 'normal').length}
              <span className="text-sm text-slate-500 ml-1">台</span>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">已通过</div>
            <div className="text-3xl font-bold text-emerald-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {inverters.filter((i) => i.conclusion === 'passed').length}
              <span className="text-sm text-slate-500 ml-1">台</span>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">未拍板</div>
            <div className="text-3xl font-bold text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {inverters.filter((i) => i.isPending).length}
              <span className="text-sm text-slate-500 ml-1">台</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {inverters.map((inverter, index) => {
            const isLaoZhouTest = inverter.id === LAOZHOU_TEST_INVERTER_ID;
            const manualRecords = inverter.stringTemperatures.filter((st) => st.source === 'manual');
            const hasSupplement = inverter.supplementRecords.length > 0;

            return (
              <div
                key={inverter.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ExpandableCard
                  highlight={isLaoZhouTest}
                  onToggle={() => handleExpand(inverter.id)}
                  title={
                    <>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-3 h-3 rounded-full',
                            getStatusColor(inverter.status)
                          )}
                        />
                        <span className="font-mono text-lg text-white font-medium">
                          {inverter.name}
                        </span>
                        <span className="text-sm text-slate-400">{inverter.model}</span>
                        {isLaoZhouTest && (
                          <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 border border-amber-500/50">
                            老周补录测试
                          </span>
                        )}
                        {hasSupplement && (
                          <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/50">
                            有补录
                          </span>
                        )}
                      </div>
                    </>
                  }
                  summary={
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded',
                          getStatusColor(inverter.conclusion),
                          'text-white'
                        )}>
                          {getStatusText(inverter.conclusion)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <User className="w-3.5 h-3.5" />
                        {inverter.handler}
                      </span>
                      {inverter.isPending && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {inverter.pendingReason}
                        </span>
                      )}
                      <span className="text-slate-500">
                        {inverter.stringTemperatures.length} 组串温度记录
                        {manualRecords.length > 0 && ` (含${manualRecords.length}条手工补录)`}
                      </span>
                    </div>
                  }
                >
                  <div className="pt-4 space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-amber-500" />
                        组串温度记录
                      </h4>
                      <div className="space-y-3 pl-6">
                        {inverter.stringTemperatures.map((st) => (
                          <div
                            key={st.id}
                            className={cn(
                              'bg-slate-900/50 border rounded-lg p-4',
                              st.source === 'manual'
                                ? 'border-amber-500/50 bg-amber-500/5'
                                : 'border-slate-700'
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-mono text-white">
                                    组串 #{st.stringNo}
                                  </span>
                                  <span className={cn(
                                    'px-2 py-0.5 text-xs rounded text-white',
                                    getStatusColor(st.source)
                                  )}>
                                    {getStatusText(st.source)}
                                  </span>
                                  {st.originalTemperature !== undefined && (
                                    <span className="text-xs text-slate-500">
                                      原始：<span className="line-through">{st.originalTemperature}℃</span>
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-slate-400">当前温度：</span>
                                    <span className={cn(
                                      'font-mono font-medium',
                                      st.temperature > 55 ? 'text-amber-400' : 'text-emerald-400'
                                    )}>
                                      {st.temperature}℃
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">备注：</span>
                                    <span className="text-slate-300">{st.remark}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                <div className="text-right">
                                  <div>{formatDate(st.recordTime)}</div>
                                  <div>记录人：{st.recorder}</div>
                                </div>
                              </div>
                            </div>
                            {st.originalRemark && (
                              <div className="mt-2 pt-2 border-t border-slate-700 text-sm">
                                <span className="text-slate-500">原始备注：</span>
                                <span className="text-slate-400 line-through">
                                  {st.originalRemark}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {inverter.supplementRecords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-500" />
                          补录记录
                        </h4>
                        <div className="space-y-2 pl-6">
                          {inverter.supplementRecords.map((sr) => (
                            <div
                              key={sr.id}
                              className={cn(
                                'bg-slate-900/50 border rounded-lg p-3 text-sm',
                                sr.status === 'delayed'
                                  ? 'border-orange-500/50 bg-orange-500/5'
                                  : 'border-slate-700'
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className={cn(
                                    'px-2 py-0.5 text-xs rounded text-white',
                                    getStatusColor(sr.status)
                                  )}>
                                    {getStatusText(sr.status)}
                                  </span>
                                  <span className="text-slate-300">{sr.materialType}</span>
                                  <span className="text-slate-500">—</span>
                                  <span className="text-slate-400">{sr.reason}</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {sr.handler} · {formatDate(sr.submitTime)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ExpandableCard>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
