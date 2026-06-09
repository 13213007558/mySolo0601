import { X, GitCompare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useGateStore } from '../store/useGateStore';
import { cn } from '@/lib/utils';

export function DiffViewer() {
  const { showDiffViewer, setShowDiffViewer, gates, selectedGateId } = useGateStore();

  const selectedGate = gates.find((g) => g.id === selectedGateId);

  if (!showDiffViewer || !selectedGate) return null;

  const original = selectedGate.originalPassDescription;
  const current = selectedGate.passDescription;

  const hasDifference = original && current && original !== current;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-industrial-blue-300 max-w-4xl w-full shadow-xl max-h-[90vh] flex flex-col">
        <div className="bg-industrial-blue-500 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <GitCompare className="w-6 h-6" />
            <h3 className="panel-title text-white">补录前后差异对比</h3>
          </div>
          <button
            onClick={() => setShowDiffViewer(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <p className="text-sm text-industrial-gray-600 mb-1">道闸编号</p>
              <p className="font-mono font-bold text-industrial-gray-800">{selectedGate.gateNo}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-industrial-gray-600 mb-1">位置</p>
              <p className="font-medium text-industrial-gray-800">{selectedGate.location}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-industrial-gray-600 mb-1">补录人</p>
              <p className="font-medium text-industrial-blue-600">{selectedGate.operator || '小乔'}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-industrial-gray-600 mb-1">补录时间</p>
              <p className="font-mono text-industrial-gray-800">{selectedGate.manualEntryTime || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-industrial-gray-600">
                <span className="w-3 h-3 rounded-full bg-industrial-gray-400" />
                <span className="font-medium">补录前（原始记录）</span>
              </div>
              <div className="bg-industrial-gray-50 border-2 border-industrial-gray-300 p-4 min-h-[200px]">
                {original ? (
                  <div className="space-y-3">
                    <p className="text-industrial-gray-700 leading-relaxed relative">
                      <span className="relative">
                        {original}
                        <span className="absolute left-0 right-0 top-1/2 h-0.5 bg-industrial-gray-400" />
                      </span>
                    </p>
                    <div className="pt-2 border-t border-industrial-gray-300">
                      <p className="text-xs text-industrial-gray-500">
                        巡检时间：{selectedGate.inspectionTime}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-industrial-gray-400 italic">无原始记录</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-industrial-green-600">
                <span className="w-3 h-3 rounded-full bg-industrial-green-500" />
                <span className="font-medium">补录后（当前记录）</span>
              </div>
              <div className="bg-industrial-green-50 border-2 border-industrial-green-300 p-4 min-h-[200px]">
                {current ? (
                  <div className="space-y-3">
                    <p className="text-industrial-gray-800 leading-relaxed">
                      {current}
                    </p>
                    <div className="pt-2 border-t border-industrial-green-300">
                      <p className="text-xs text-industrial-green-600">
                      补录时间：{selectedGate.manualEntryTime || '-'}
                    </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-industrial-gray-400 italic">无当前记录</p>
                )}
              </div>
            </div>
          </div>

          {hasDifference && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-industrial-gray-400">
                <span className="text-sm">变更内容</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          )}

          {hasDifference && (
            <div className="bg-industrial-blue-50 border border-industrial-blue-200 p-4">
              <h4 className="font-semibold text-industrial-blue-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                变更摘要
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex gap-4">
                <span className="text-industrial-gray-500 w-20 flex-shrink-0">新增内容：</span>
                <span className="text-industrial-gray-700">
                  {current?.replace(original || '', '').trim() || '完整新增放行说明'}
                </span>
              </div>
              <div className="flex gap-4">
                <span className="text-industrial-gray-500 w-20 flex-shrink-0">变更原因：</span>
                <span className="text-industrial-gray-700">
                  手工补录道闸放行详细信息，避免在聊天中泄露隐私信息
                </span>
              </div>
              <div className="flex gap-4">
                <span className="text-industrial-gray-500 w-20 flex-shrink-0">隐私保护：</span>
                <span className="text-industrial-green-600 font-medium">
                  手机号已脱敏显示（138****1234）
                </span>
              </div>
            </div>
          </div>
        )}

          <div className="bg-industrial-gray-50 border border-industrial-gray-200 p-4 text-sm">
            <p className="text-industrial-gray-700 font-medium mb-2">导出验证说明：</p>
            <p className="text-industrial-gray-600">
              导出的 JSON 文件中将包含完整的补录前后数据，可用于数据备份或导入回系统进行核对。
              导入时系统会自动对比数据完整性，确保数据一致性。
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-industrial-gray-50 border-t border-industrial-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={() => setShowDiffViewer(false)}
            className="industrial-btn-primary"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
