import { Search, RotateCcw, Filter, Car, Zap, CreditCard, Calendar } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';

export const FilterPanel = () => {
  const {
    filters,
    setFilter,
    resetFilters,
    applyFilters,
    chartFiltersApplied,
    paymentFlows,
    gunInfos
  } = useReconciliationStore();

  const plateNumbers = [...new Set(paymentFlows.map(f => f.plateNumber))];
  const gunNos = [...new Set(gunInfos.map(g => g.gunNo))];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 h-fit">
      <div className="flex items-center gap-2 mb-5">
        <Filter className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-semibold text-white">筛选条件</h3>
        {!chartFiltersApplied && (
          <span className="ml-auto px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full animate-pulse">
            未应用
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Car className="w-4 h-4" />
            车牌号
          </label>
          <div className="flex flex-wrap gap-2">
            {plateNumbers.map(plate => (
              <button
                key={plate}
                onClick={() => {
                  const current = filters.plateNumber;
                  const next = current.includes(plate)
                    ? current.filter(p => p !== plate)
                    : [...current, plate];
                  setFilter('plateNumber', next);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                  filters.plateNumber.includes(plate)
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {plate}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Search className="w-4 h-4" />
            支付流水备注
          </label>
          <input
            type="text"
            value={filters.paymentRemark}
            onChange={(e) => setFilter('paymentRemark', e.target.value)}
            placeholder="输入备注关键词..."
            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <CreditCard className="w-4 h-4" />
            退款标记
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('hasRefundMark', null)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                filters.hasRefundMark === null
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('hasRefundMark', true)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                filters.hasRefundMark === true
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              有退款
            </button>
            <button
              onClick={() => setFilter('hasRefundMark', false)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                filters.hasRefundMark === false
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              无退款
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Zap className="w-4 h-4" />
            枪号
          </label>
          <div className="flex flex-wrap gap-2">
            {gunNos.map(gun => (
              <button
                key={gun}
                onClick={() => {
                  const current = filters.gunNo;
                  const next = current.includes(gun)
                    ? current.filter(g => g !== gun)
                    : [...current, gun];
                  setFilter('gunNo', next);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  filters.gunNo.includes(gun)
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {gun}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Calendar className="w-4 h-4" />
            账单状态
          </label>
          <div className="flex gap-2">
            {[
              { value: 'normal', label: '正常', color: 'emerald' },
              { value: 'anomaly', label: '异常', color: 'red' },
              { value: 'pending', label: '待处理', color: 'amber' }
            ].map(status => (
              <button
                key={status.value}
                onClick={() => {
                  const current = filters.status;
                  const next = current.includes(status.value)
                    ? current.filter(s => s !== status.value)
                    : [...current, status.value];
                  setFilter('status', next);
                }}
                className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                  filters.status.includes(status.value)
                    ? status.color === 'emerald'
                      ? 'bg-emerald-500 text-white'
                      : status.color === 'red'
                      ? 'bg-red-500 text-white'
                      : 'bg-amber-500 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={resetFilters}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-all text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
        <button
          onClick={applyFilters}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5"
        >
          应用筛选
        </button>
      </div>
    </div>
  );
};
