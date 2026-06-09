import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  AlertCircle, 
  AlertTriangle, 
  ShieldAlert,
  FileText, 
  MapPin, 
  Building2,
  Hash,
  TrendingDown,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import type { BatchData } from '@/types';
import { formatCurrency, formatCount, getMismatchItems, getMismatchReason } from '@/utils/compare';
import { compareExportWithCard, exportBatchAsJson, getManualCertificates } from '@/utils/export';

interface DetailPanelProps {
  batch: BatchData;
  onClose: () => void;
  onOpenSupply: () => void;
  onTriggerExport: () => void;
}

export const DetailPanel = ({ batch, onClose, onOpenSupply, onTriggerExport }: DetailPanelProps) => {
  const comparison = compareExportWithCard(batch);
  const mismatchItems = getMismatchItems(batch);
  const mismatchReason = getMismatchReason(batch);
  const manualCerts = getManualCertificates(batch.certificates);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-50 overflow-y-auto"
    >
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-semibold text-white">{batch.stationName}</h2>
          <p className="text-sm text-slate-400">{batch.batchNo}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {batch.hasMismatch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-medium text-red-400 mb-1">导出数字与卡片对不上</h3>
                <p className="text-sm text-red-300/70">{mismatchReason}</p>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-500 font-medium p-3">对比项</th>
                    <th className="text-right text-slate-500 font-medium p-3">卡片显示</th>
                    <th className="text-right text-slate-500 font-medium p-3">导出数据</th>
                    <th className="text-right text-slate-500 font-medium p-3">差值</th>
                  </tr>
                </thead>
                <tbody>
                  {mismatchItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-800 last:border-0">
                      <td className="p-3 text-slate-300">{item.name}</td>
                      <td className="p-3 text-right font-mono text-white">{formatCount(item.cardValue)}</td>
                      <td className="p-3 text-right font-mono text-red-400">{formatCount(item.exportValue)}</td>
                      <td className="p-3 text-right font-mono text-red-400 flex items-center justify-end gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {formatCount(item.cardValue - item.exportValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={onTriggerExport}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-colors"
            >
              <Download className="w-4 h-4" />
              重新导出并验证差异
            </button>
          </motion.div>
        )}

        {batch.hasDuplicateStation && batch.duplicateStations && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-400 mb-1">站点同名串站告警</h3>
                <p className="text-sm text-yellow-300/70">
                  存在 {batch.duplicateStations.length} 个同名"创智园 A 座"站点，请确认归属
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {batch.duplicateStations.map((station, idx) => (
                <div key={station.id} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">站点 {idx + 1}</span>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full ml-auto">
                      ID: {station.id}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{station.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Hash className="w-4 h-4" />
                      <span>归属项目：{station.projectName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>证书数量：{station.certCount} 张</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-xs text-yellow-300/80">
                ⚠️ 操作员：{batch.operator} | 操作时间：{batch.submitTime}
              </p>
            </div>
          </motion.div>
        )}

        {!batch.hiddenPhone && batch.phone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-medium text-orange-400 mb-1">权限视图配置错误</h3>
                <p className="text-sm text-orange-300/70 mb-2">手机号未脱敏，存在泄露风险</p>
                <p className="text-lg font-mono text-orange-400 bg-slate-900/50 px-3 py-2 rounded inline-block">
                  {batch.phone}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!batch.hasMismatch && !batch.hasDuplicateStation && batch.hiddenPhone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-medium text-emerald-400">数据校验通过</h3>
                <p className="text-sm text-emerald-300/70">卡片与导出数据一致，无异常</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-slate-800/50 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            数据对比总览
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">卡片证书数</p>
              <p className="text-2xl font-bold text-white font-mono">{formatCount(comparison.cardCount)}</p>
              <p className="text-xs text-slate-500 mt-1">{formatCurrency(comparison.cardAmount)}</p>
            </div>
            <div className={`rounded-lg p-4 ${comparison.match ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <p className="text-xs text-slate-500 mb-1">导出证书数</p>
              <p className={`text-2xl font-bold font-mono ${comparison.match ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCount(comparison.exportCount)}
              </p>
              <p className={`text-xs ${comparison.match ? 'text-emerald-500' : 'text-red-500'} mt-1`}>
                {formatCurrency(comparison.exportAmount)}
              </p>
            </div>
          </div>

          {!comparison.match && (
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-300/80">差异数量</span>
                <span className="text-xl font-bold text-red-400 font-mono">
                  ↓ {comparison.countDiff} 张
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-red-300/80">差异金额</span>
                <span className="text-xl font-bold text-red-400 font-mono">
                  ↓ {formatCurrency(comparison.amountDiff)}
                </span>
              </div>
            </div>
          )}
        </div>

        {manualCerts.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              手工补录证书 ({manualCerts.length} 张)
            </h3>
            <div className="space-y-3">
              {manualCerts.map((cert) => (
                <div key={cert.id} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-emerald-400">{cert.certNo}</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      ★ 补录
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">电量</span>
                      <p className="text-white font-mono">{cert.power} MWh</p>
                    </div>
                    <div>
                      <span className="text-slate-500">金额</span>
                      <p className="text-emerald-400 font-mono">{formatCurrency(cert.power * 400)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-400">补录人：{cert.suppliedBy}</span>
                    <span className="text-slate-500">{cert.supplyTime}</span>
                  </div>
                  {cert.scanUrl && (
                    <div className="mt-3">
                      <img 
                        src={cert.scanUrl} 
                        alt="证书扫描件" 
                        className="w-full rounded-lg border border-slate-700"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {batch.consultantNote && (
          <div className="bg-slate-800/50 rounded-xl p-5">
            <h3 className="font-medium text-white mb-2">顾问备注</h3>
            <p className="text-sm text-slate-400">{batch.consultantNote}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => exportBatchAsJson(batch)}
            className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出 JSON
          </button>
          <button
            onClick={onOpenSupply}
            className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
          >
            周顾问补录
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
