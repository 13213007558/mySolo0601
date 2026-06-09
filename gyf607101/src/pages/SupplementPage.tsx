import { useState, useEffect } from 'react';
import { useInverterStore } from '@/store/inverterStore';
import { PlainTip } from '@/components/PlainTip';
import { getStatusText, formatDate } from '@/utils';
import { FileText, User, Calendar, Send, Zap, AlertCircle } from 'lucide-react';
import type { SupplementStatus } from '../types';
import { cn } from '@/lib/utils';

export function SupplementPage() {
  const { inverters, initData, addSupplement } = useInverterStore();
  const [formData, setFormData] = useState({
    inverterId: '',
    materialType: '',
    reason: '',
    handler: '',
    status: 'pending' as SupplementStatus,
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    initData();
  }, [initData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.inverterId || !formData.materialType || !formData.handler) {
      return;
    }

    addSupplement({
      id: `sup-user-${Date.now()}`,
      inverterId: formData.inverterId,
      materialType: formData.materialType,
      reason: formData.reason || '未填写',
      handler: formData.handler,
      submitTime: new Date().toISOString(),
      status: formData.status,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        inverterId: '',
        materialType: '',
        reason: '',
        handler: '',
        status: 'pending',
      });
    }, 2000);
  };

  const hasDelayedRecords = inverters.some((inv) =>
    inv.supplementRecords.some((sr) => sr.status === 'delayed')
  );

  const selectedInverter = inverters.find((i) => i.id === formData.inverterId);

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                补录材料登记
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                登记补录材料 · 系统自动提醒延迟风险
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {hasDelayedRecords && (
          <PlainTip
            tipId="supplement_delayed_warning"
            message="⚠️ 注意：当前有补录材料晚到3天以上，会影响本月复核进度。如果是测温仪校准数据，记得在备注里说明原因，不然班组长那边不好交代。"
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              补录登记表单
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  选择逆变器 <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.inverterId}
                  onChange={(e) => setFormData({ ...formData, inverterId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                  required
                >
                  <option value="">请选择逆变器</option>
                  {inverters.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} - {inv.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  材料类型 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.materialType}
                  onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                  placeholder="如：温度传感器校准报告、组串温度人工复测记录"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  补录原因
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="请简要说明补录原因..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  处理人 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.handler}
                    onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
                    placeholder="请输入处理人姓名"
                    className="w-full bg-slate-900 border border-slate-600 rounded pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  材料状态
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'pending', label: '待提交', color: 'slate' },
                    { value: 'completed', label: '已完成', color: 'emerald' },
                    { value: 'delayed', label: '延迟', color: 'orange' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: opt.value as SupplementStatus })}
                      className={cn(
                        'px-4 py-2 rounded border-2 text-sm font-medium transition-all',
                        formData.status === opt.value && opt.color === 'slate' && 'border-slate-500 bg-slate-500/20 text-slate-300',
                        formData.status === opt.value && opt.color === 'emerald' && 'border-emerald-500 bg-emerald-500/20 text-emerald-400',
                        formData.status === opt.value && opt.color === 'orange' && 'border-orange-500 bg-orange-500/20 text-orange-400',
                        formData.status !== opt.value && 'border-slate-700 text-slate-500 hover:border-slate-600'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.status === 'delayed' && (
                <PlainTip
                  tipId={`delayed_${formData.inverterId}`}
                  message="💡 你选了「延迟」状态。说白话就是：这份材料晚到了，可能拖慢整个复核进度。建议在补录原因里写清楚晚到多久、为啥晚到，这样后面解释起来省事儿。"
                />
              )}

              <button
                type="submit"
                disabled={submitted}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-6 py-3 rounded font-medium transition-all',
                  submitted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                )}
              >
                {submitted ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    已提交
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    提交补录
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                补录记录
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inverters.flatMap((inv) =>
                  inv.supplementRecords.map((sr) => (
                    <div
                      key={sr.id}
                      className={cn(
                        'bg-slate-900/50 border rounded-lg p-4',
                        sr.status === 'delayed'
                          ? 'border-orange-500/50'
                          : 'border-slate-700'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-white">
                              {inv.name}
                            </span>
                            <span className={cn(
                              'px-2 py-0.5 text-xs rounded text-white',
                              sr.status === 'pending' && 'bg-slate-500',
                              sr.status === 'completed' && 'bg-emerald-500',
                              sr.status === 'delayed' && 'bg-orange-500'
                            )}>
                              {getStatusText(sr.status)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-300 mb-1">
                            {sr.materialType}
                          </div>
                          {sr.reason && (
                            <div className="text-xs text-slate-500">
                              原因：{sr.reason}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex-shrink-0 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <User className="w-3 h-3" />
                            {sr.handler}
                          </div>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(sr.submitTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {inverters.every((inv) => inv.supplementRecords.length === 0) && (
                  <div className="text-center py-8 text-slate-500">
                    暂无补录记录
                  </div>
                )}
              </div>
            </div>

            {selectedInverter && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  已选逆变器信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">名称</span>
                    <span className="text-white font-mono">{selectedInverter.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">型号</span>
                    <span className="text-slate-300">{selectedInverter.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">处理人</span>
                    <span className="text-slate-300">{selectedInverter.handler}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">组串数</span>
                    <span className="text-slate-300">{selectedInverter.stringTemperatures.length} 组</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
