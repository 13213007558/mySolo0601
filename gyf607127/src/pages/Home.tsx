import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { StatsBar } from '@/components/StatsBar';
import { AlertWall } from '@/components/AlertWall';
import { SceneSwitcher } from '@/components/SceneSwitcher';
import { DetailPanel } from '@/components/DetailPanel';
import { SupplyPanel } from '@/components/SupplyPanel';
import { useBatchData } from '@/hooks/useBatchData';

export default function Home() {
  const {
    scene,
    batches,
    stats,
    selectedBatch,
    supplyRecords,
    activePanel,
    changeScene,
    selectBatch,
    setActivePanel,
    manualSupplyCertificate,
    triggerExport,
  } = useBatchData();

  const handleSupply = (note: string) => {
    if (selectedBatch) {
      manualSupplyCertificate(selectedBatch.id, note);
    }
  };

  const handleTriggerExport = () => {
    if (selectedBatch) {
      const exported = triggerExport(selectedBatch.id);
      console.log('Export triggered:', exported);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern">
      <Header scene={scene} />

      <main className="px-4 md:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <StatsBar stats={stats} />

            <motion.div
              key={scene}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AlertWall
                batches={batches}
                selectedBatchId={selectedBatch?.id || null}
                onBatchSelect={selectBatch}
              />
            </motion.div>
          </div>

          <div className="lg:w-80">
            <SceneSwitcher
              currentScene={scene}
              onSceneChange={changeScene}
            />

            <div className="mt-6 bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-300 mb-3">快速操作指南</h3>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">1.</span>
                  <span>点击左侧批次卡片查看详情</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">2.</span>
                  <span>红色边框 = 导出数字对不上</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">3.</span>
                  <span>黄色边框 = 站点同名串站</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">4.</span>
                  <span>详情页可进入周顾问补录流程</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">5.</span>
                  <span>橙色标记 = 手机号泄露风险</span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-300 mb-3">当前场景异常点</h3>
              {scene === 'abnormal' ? (
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 font-medium text-xs mb-1">🔴 批次 LC-2026-003</p>
                    <p className="text-slate-400 text-xs">导出 128 张 vs 卡片 132 张</p>
                    <p className="text-slate-500 text-xs mt-1">差异原因：接口超时漏传 4 张</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 font-medium text-xs mb-1">🟡 批次 LC-2026-005</p>
                    <p className="text-slate-400 text-xs">"创智园 A 座" 同名串站</p>
                    <p className="text-slate-500 text-xs mt-1">一期 67 张 + 三期 58 张</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-orange-400 font-medium text-xs mb-1">🟠 批次 LC-2026-001</p>
                    <p className="text-slate-400 text-xs">权限视图泄露手机号</p>
                    <p className="text-slate-500 text-xs mt-1">显示完整 13800131234</p>
                  </div>
                </div>
              ) : scene === 'normal' ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                  <p className="text-emerald-400 text-sm">✅ 全部 8 个批次数据正常</p>
                  <p className="text-slate-500 text-xs mt-1">卡片与导出数字完全一致</p>
                </div>
              ) : (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
                  <p className="text-slate-400 text-sm">📭 无批次数据</p>
                  <p className="text-slate-500 text-xs mt-1">空状态展示测试</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence mode="wait">
        {selectedBatch && activePanel === 'detail' && (
          <DetailPanel
            key="detail"
            batch={selectedBatch}
            onClose={() => selectBatch(null)}
            onOpenSupply={() => setActivePanel('supply')}
            onTriggerExport={handleTriggerExport}
          />
        )}
        {selectedBatch && activePanel === 'supply' && (
          <SupplyPanel
            key="supply"
            batch={selectedBatch}
            supplyRecords={supplyRecords}
            onClose={() => selectBatch(null)}
            onBack={() => setActivePanel('detail')}
            onSupply={handleSupply}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
