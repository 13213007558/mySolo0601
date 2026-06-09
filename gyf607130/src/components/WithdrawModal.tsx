import { useState } from 'react';
import { X, AlertCircle, RotateCcw, Send } from 'lucide-react';
import { useForecastStore } from '../store/useForecastStore';
import { statusLabels } from '../data/mockData';

export const WithdrawModal = () => {
  const { modals, closeModal, withdrawRecord, resubmitRecord } = useForecastStore();
  const { open, record } = modals.withdraw;
  const [reason, setReason] = useState('');

  if (!open || !record) return null;

  const isWithdrawn = record.status === 'withdrawn';
  const originalRemarks = record.remarks.filter(r => r.type === 'original');
  const newRemarks = record.remarks.filter(r => r.type === 'new');

  const handleWithdraw = () => {
    if (!reason.trim()) {
      alert('请填写撤回理由');
      return;
    }
    withdrawRecord(record.id, reason);
    setReason('');
    closeModal('withdraw');
    alert('已撤回结论，原始理由已保留');
  };

  const handleResubmit = () => {
    resubmitRecord(record.id, reason);
    setReason('');
    closeModal('withdraw');
    alert('已重新提交，旧备注保留，新备注已追加');
  };

  const handleClose = () => {
    setReason('');
    closeModal('withdraw');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isWithdrawn ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className={isWithdrawn ? 'text-blue-600' : 'text-orange-600'} />
            <h3 className="text-base font-semibold text-slate-800">
              {isWithdrawn ? '重新提交审核' : '撤回审核结论'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/50 rounded transition-colors text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">设备信息</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${
                isWithdrawn ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
              }`}>
                {statusLabels[record.status]}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800">{record.deviceNo}</p>
            <p className="text-xs text-slate-600">{record.deviceName}</p>
          </div>

          {originalRemarks.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">原始审核理由（只读，不可修改）</p>
              <div className="space-y-2">
                {originalRemarks.map(remark => (
                  <div key={remark.id} className="bg-slate-50 rounded p-3 border border-slate-200">
                    <p className="text-sm text-slate-500 italic">{remark.content}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                      <span>{remark.author}</span>
                      <span>{remark.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newRemarks.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">历史备注</p>
              <div className="space-y-2">
                {newRemarks.map(remark => (
                  <div key={remark.id} className="bg-blue-50 rounded p-3 border border-blue-200">
                    <p className="text-sm text-slate-800">{remark.content}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>{remark.author}</span>
                      <span>{remark.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-500 mb-2">
              {isWithdrawn ? '补充说明（可选，将作为新备注追加）' : '撤回理由'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isWithdrawn ? '请输入补充说明...' : '请输入撤回理由...'}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              rows={3}
            />
          </div>

          <div className={`text-xs ${isWithdrawn ? 'text-blue-600' : 'text-orange-600'} bg-opacity-10 rounded p-3`}
               style={{ backgroundColor: isWithdrawn ? '#eff6ff' : '#fff7ed' }}>
            <p className="font-medium mb-1">重要提示</p>
            {isWithdrawn ? (
              <p>提交后状态将变为"待复核"，原有备注全部保留，新备注将追加显示。旧理由不会被覆盖。</p>
            ) : (
              <p>撤回后状态将变为"已撤回"，原审核理由将标记为"旧理由"并设为只读，可后续补充新备注重新提交。</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm transition-colors"
          >
            取消
          </button>
          {isWithdrawn ? (
            <button
              onClick={handleResubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
            >
              <Send size={14} />
              重新提交
            </button>
          ) : (
            <button
              onClick={handleWithdraw}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm transition-colors"
            >
              <RotateCcw size={14} />
              确认撤回
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
