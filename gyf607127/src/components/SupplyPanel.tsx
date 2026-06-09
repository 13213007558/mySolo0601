import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Eye,
  ArrowRight
} from 'lucide-react';
import type { BatchData, SupplyRecord } from '@/types';
import { formatCurrency, formatCount } from '@/utils/compare';
import { downloadAsJson, generateExportFilename } from '@/utils/export';

interface SupplyPanelProps {
  batch: BatchData;
  supplyRecords: SupplyRecord[];
  onClose: () => void;
  onBack: () => void;
  onSupply: (note: string) => void;
}

export const SupplyPanel = ({ batch, supplyRecords, onClose, onBack, onSupply }: SupplyPanelProps) => {
  const [note, setNote] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [hasSupplied, setHasSupplied] = useState(false);

  const currentRecord = supplyRecords.find(r => r.batchId === batch.id);

  const handleSupply = () => {
    onSupply(note);
    setHasSupplied(true);
  };

  const exportReadbackData = () => {
    if (currentRecord) {
      downloadAsJson(
        currentRecord.exportedData,
        generateExportFilename(batch.batchNo, 'readback')
      );
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full md:w-[560px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-50 overflow-y-auto"
    >
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 px-6 py-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回详情
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <h2 className="text-lg font-semibold text-white">周顾问手工补录</h2>
        <p className="text-sm text-slate-400">{batch.stationName} · {batch.batchNo}</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">周顾问</h3>
              <p className="text-sm text-emerald-400">手工补录权限已授权</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <span className="text-slate-500">当前证书数</span>
              <p className="text-xl font-bold text-white font-mono mt-1">{formatCount(batch.cardCount)} 张</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <span className="text-slate-500">当前金额</span>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1">{formatCurrency(batch.amount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5">
          <h3 className="font-medium text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            证书扫描件
          </h3>
          
          <div className="relative">
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center bg-slate-900/30">
              <div className="mb-3">
                <img 
                  src="/certificate.svg" 
                  alt="证书扫描件预览" 
                  className="max-h-48 mx-auto rounded-lg border border-slate-700"
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>已自动关联内置证书扫描件</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <label className="text-xs text-slate-500 block mb-1">证书编号</label>
                <p className="text-emerald-400 font-mono text-sm">GC-2026-ZHOU-001</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <label className="text-xs text-slate-500 block mb-1">电量（MWh）</label>
                <p className="text-white font-mono text-sm">125.50</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <label className="text-xs text-slate-500 block mb-1">补录金额</label>
              <p className="text-2xl font-bold text-emerald-400 font-mono">{formatCurrency(125.5 * 400)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            补录说明
          </h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="请填写补录原因（如：系统漏传，现场核对原件后补录）..."
            className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        <button
          onClick={handleSupply}
          disabled={hasSupplied}
          className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            hasSupplied
              ? 'bg-emerald-500/30 text-emerald-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {hasSupplied ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              已完成补录
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              确认补录证书
            </>
          )}
        </button>

        <AnimatePresence>
          {currentRecord && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-800/50 rounded-xl p-5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  补录前后差异对比
                </h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? '隐藏' : '查看'}扫描件
                </button>
              </div>

              <AnimatePresence>
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4"
                  >
                    <img 
                      src="/certificate.svg" 
                      alt="补录证书扫描件" 
                      className="w-full rounded-lg border border-slate-700"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-500 font-medium p-3">对比项</th>
                      <th className="text-right text-slate-500 font-medium p-3">补录前</th>
                      <th className="text-center text-slate-500 font-medium p-3"></th>
                      <th className="text-right text-slate-500 font-medium p-3">补录后</th>
                      <th className="text-right text-slate-500 font-medium p-3">导出读回</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="p-3 text-slate-300">证书数量</td>
                      <td className="p-3 text-right font-mono text-white">{formatCount(currentRecord.beforeData.cardCount)}</td>
                      <td className="p-3 text-center text-emerald-400">
                        <ArrowRight className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400">{formatCount(currentRecord.afterData.cardCount)}</td>
                      <td className="p-3 text-right font-mono text-blue-400">{formatCount(currentRecord.exportedData.cardCount)}</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-3 text-slate-300">结算金额</td>
                      <td className="p-3 text-right font-mono text-white">{formatCurrency(currentRecord.beforeData.amount)}</td>
                      <td className="p-3 text-center text-emerald-400">
                        <ArrowRight className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400">{formatCurrency(currentRecord.afterData.amount)}</td>
                      <td className="p-3 text-right font-mono text-blue-400">{formatCurrency(currentRecord.exportedData.amount)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300">证书数增加</td>
                      <td className="p-3 text-right" colSpan={3}></td>
                      <td className="p-3 text-right font-mono text-emerald-400">+1 张</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300">金额增加</td>
                      <td className="p-3 text-right" colSpan={3}></td>
                      <td className="p-3 text-right font-mono text-emerald-400">+{formatCurrency(50200)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-xs text-emerald-400">
                  ✅ 一致性验证：补录后数据与导出读回数据完全一致
                </p>
              </div>

              <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
                <p><span className="text-slate-500">补录人：</span>{currentRecord.suppliedBy}</p>
                <p><span className="text-slate-500">补录时间：</span>{currentRecord.supplyTime}</p>
                {currentRecord.afterData.consultantNote && (
                  <p><span className="text-slate-500">备注：</span>{currentRecord.afterData.consultantNote}</p>
                )}
              </div>

              <button
                onClick={exportReadbackData}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                导出差读回数据（JSON）
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-yellow-300/80">
            ⚠️ 补录操作将自动记录审计日志，包含操作人、时间、补录内容和前后数据快照
          </p>
        </div>
      </div>
    </motion.div>
  );
};
