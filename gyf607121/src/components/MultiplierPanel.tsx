import { useState } from 'react';
import { User, Plus, TrendingUp, History, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useMeterStore } from '@/store/useMeterStore';
import { MultiplierConfig } from '@/types';

export default function MultiplierPanel() {
  const multipliers = useMeterStore((state) => state.multipliers);
  const updateMultiplier = useMeterStore((state) => state.updateMultiplier);
  const currentOperator = useMeterStore((state) => state.currentOperator);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    meterNo: '',
    multiplier: '',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });

  const zhouMultipliers = multipliers.filter((m) => m.enteredBy === 'zhou');
  const systemMultipliers = multipliers.filter((m) => m.enteredBy === 'system');

  const groupedByMeter = zhouMultipliers.reduce((acc, m) => {
    if (!acc[m.meterNo]) acc[m.meterNo] = [];
    acc[m.meterNo].push(m);
    acc[m.meterNo].sort((a, b) => b.version - a.version);
    return acc;
  }, {} as Record<string, MultiplierConfig[]>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.meterNo || !formData.multiplier) return;

    const isZhou = currentOperator === '老周';

    updateMultiplier({
      meterNo: formData.meterNo,
      multiplier: parseFloat(formData.multiplier),
      effectiveDate: new Date(formData.effectiveDate),
      enteredBy: isZhou ? 'zhou' : 'system',
      note: formData.note || (isZhou ? '老周手工补录' : '系统更新'),
    });

    setFormData({
      meterNo: '',
      multiplier: '',
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    });
    setShowAddForm(false);
  };

  const getMeterHistory = (meterNo: string) => {
    return groupedByMeter[meterNo] || [];
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-industrial-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-purple" />
              分表倍率管理
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              老周手工补录 · 共 {zhouMultipliers.length} 条配置
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            新增倍率
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="p-5 border-b border-industrial-border bg-industrial-bg/50 animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">电表编号</label>
                <input
                  type="text"
                  value={formData.meterNo}
                  onChange={(e) => setFormData({ ...formData, meterNo: e.target.value })}
                  placeholder="8位数字编号"
                  className="input-field"
                  pattern="\d{8}"
                  required
                />
              </div>
              <div>
                <label className="label">倍率值</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                  placeholder="如: 40, 60, 80"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">生效日期</label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">说明备注</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder={currentOperator === '老周' ? '老周手工补录说明' : '变更说明'}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <User className="w-3 h-3 inline mr-1" />
                当前操作人: <span className="text-gray-300">{currentOperator}</span>
                {currentOperator === '老周' && (
                  <span className="ml-2 text-status-purple">（将标记为手工补录）</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary py-2 text-sm"
                >
                  取消
                </button>
                <button type="submit" className="btn-success py-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  确认添加
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-industrial-border/50 max-h-[400px] overflow-y-auto">
        {Object.entries(groupedByMeter).length > 0 ? (
          Object.entries(groupedByMeter).map(([meterNo, versions]) => {
            const latest = versions[0];
            const isExpanded = selectedMeter === meterNo;

            return (
              <div key={meterNo} className="animate-fade-in">
                <div
                  className="p-4 cursor-pointer hover:bg-industrial-hover/50 transition-colors"
                  onClick={() => setSelectedMeter(isExpanded ? null : meterNo)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-status-purple/20 to-primary-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-status-purple" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-200">
                            {meterNo}
                          </span>
                          <span className="badge bg-status-purple/20 text-status-purple border-status-purple/30">
                            <User className="w-3 h-3" />
                            老周手工补录
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {latest.note}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">当前倍率</p>
                        <p className="text-2xl font-bold font-mono-tabular text-status-purple">
                          ×{latest.multiplier}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          生效时间
                        </p>
                        <p className="text-sm text-gray-300">
                          {format(latest.effectiveDate, 'yyyy-MM-dd', { locale: zhCN })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">版本</p>
                        <p className="text-sm font-medium text-gray-300">v{latest.version}</p>
                      </div>
                      <button className="text-gray-500 hover:text-gray-300 transition-colors">
                        <History className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && versions.length > 1 && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="p-4 rounded-lg bg-industrial-bg/70 border border-industrial-border">
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4 text-primary-400" />
                        历史版本记录
                      </h4>
                      <div className="space-y-2">
                        {versions.slice(1).map((version) => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-industrial-card/50 border border-industrial-border/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-industrial-hover flex items-center justify-center text-xs font-mono text-gray-400">
                                v{version.version}
                              </div>
                              <div>
                                <p className="text-sm text-gray-300">
                                  倍率 ×{version.multiplier}
                                </p>
                                <p className="text-xs text-gray-500">{version.note}</p>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <p>
                                {format(version.effectiveDate, 'yyyy-MM-dd', { locale: zhCN })} 生效
                              </p>
                              <p>
                                {format(version.createdAt, 'MM-dd HH:mm', { locale: zhCN })} 录入
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无手工补录的倍率配置</p>
          </div>
        )}
      </div>

      {systemMultipliers.length > 0 && (
        <div className="p-5 border-t border-industrial-border bg-industrial-bg/30">
          <h4 className="text-sm font-medium text-gray-400 mb-3">系统默认倍率</h4>
          <div className="flex flex-wrap gap-2">
            {systemMultipliers.map((m) => (
              <span
                key={m.id}
                className="px-3 py-1.5 text-xs bg-industrial-card rounded-lg border border-industrial-border text-gray-400"
              >
                {m.meterNo}: ×{m.multiplier}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
