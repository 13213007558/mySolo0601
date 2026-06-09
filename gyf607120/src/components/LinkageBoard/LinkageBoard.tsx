import { Zap, Clock, Users, CreditCard, Activity, ArrowRight } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { formatAmount, formatDuration, getStatusColor, getStatusText } from '@/utils/formatters';

export const PaymentStatusLights = () => {
  const { filteredFlows, selectedFlowId } = useReconciliationStore();

  const statusCounts = filteredFlows.reduce((acc, flow) => {
    acc[flow.paymentStatus] = (acc[flow.paymentStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusConfig = [
    { key: 'completed', label: '支付完成', color: 'emerald', count: statusCounts.completed || 0 },
    { key: 'pending', label: '待支付', color: 'amber', count: statusCounts.pending || 0 },
    { key: 'failed', label: '支付失败', color: 'red', count: statusCounts.failed || 0 },
    { key: 'refunded', label: '已退款', color: 'purple', count: statusCounts.refunded || 0 }
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4 text-orange-400" />
        <h4 className="text-sm font-semibold text-white">支付流水状态</h4>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {statusConfig.map(status => (
          <div
            key={status.key}
            className="relative p-3 rounded-xl bg-slate-900/50 border border-slate-700/30 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full mt-2 mr-2 ${
              status.color === 'emerald' ? 'bg-emerald-400' :
              status.color === 'amber' ? 'bg-amber-400 animate-pulse' :
              status.color === 'red' ? 'bg-red-400 animate-pulse' :
              'bg-purple-400'
            }`} />
            <div className="text-2xl font-bold text-white mb-1">{status.count}</div>
            <div className="text-xs text-slate-400">{status.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GunHeatmap = () => {
  const { gunInfos, filters, filteredFlows } = useReconciliationStore();

  const selectedGunNos = filters.gunNo;
  const selectedPlates = filters.plateNumber;
  
  const getGunActivityLevel = (gunNo: string) => {
    const gun = gunInfos.find(g => g.gunNo === gunNo);
    if (!gun) return 0;
    const count = gun.todayUsageCount;
    if (count === 0) return 0;
    if (count < 5) return 1;
    if (count < 10) return 2;
    if (count < 15) return 3;
    return 4;
  };

  const isSelected = (gunNo: string) => {
    if (selectedGunNos.length > 0 && !selectedGunNos.includes(gunNo)) return false;
    if (selectedPlates.length > 0) {
      const hasPlate = filteredFlows.some(f => 
        f.gunNo === gunNo && selectedPlates.includes(f.plateNumber)
      );
      if (!hasPlate) return false;
    }
    return true;
  };

  const heatColors = [
    'bg-slate-700/30 border-slate-600/30',
    'bg-emerald-500/10 border-emerald-500/30',
    'bg-cyan-500/20 border-cyan-500/40',
    'bg-orange-500/30 border-orange-500/50',
    'bg-red-500/40 border-red-500/60'
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-cyan-400" />
        <h4 className="text-sm font-semibold text-white">枪号占用热力图</h4>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {gunInfos.map(gun => {
          const level = getGunActivityLevel(gun.gunNo);
          const selected = isSelected(gun.gunNo);
          return (
            <div
              key={gun.gunNo}
              className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                selected ? heatColors[level] : 'bg-slate-700/10 border-slate-700/20 opacity-40'
              } ${selected && level > 0 ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">{gun.gunNo}</span>
                <span className={`w-2 h-2 rounded-full ${
                  gun.status === 'available' ? 'bg-emerald-400' :
                  gun.status === 'occupied' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
              </div>
              <div className="text-xs text-slate-400">{gun.todayUsageCount}次</div>
              <div className="text-xs text-slate-500">{gun.power}kW</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-700/30" />
          <span className="text-xs text-slate-500">空闲</span>
        </div>
        <ArrowRight className="w-3 h-3 text-slate-600" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/40" />
          <span className="text-xs text-slate-500">繁忙</span>
        </div>
      </div>
    </div>
  );
};

export const RefundTimeline = () => {
  const { refundRecords, filteredFlows } = useReconciliationStore();

  const relatedRefunds = refundRecords.filter(r =>
    filteredFlows.some(f => f.id === r.paymentFlowId)
  );

  if (relatedRefunds.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-white">退款重算轨迹</h4>
        </div>
        <div className="text-center py-6 text-slate-500 text-sm">
          暂无退款记录
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-semibold text-white">退款重算轨迹</h4>
      </div>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {relatedRefunds.map((refund, idx) => {
          const flow = filteredFlows.find(f => f.id === refund.paymentFlowId);
          return (
            <div key={refund.id} className="relative pl-4 pb-3 last:pb-0">
              {idx < relatedRefunds.length - 1 && (
                <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-700/50" />
              )}
              <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-slate-800" />
              <div className="text-sm text-white font-medium mb-1">
                {flow?.plateNumber} - {formatAmount(refund.refundAmount)}
              </div>
              <div className="text-xs text-slate-400 mb-1">{refund.refundReason}</div>
              <div className="text-xs text-slate-500 bg-slate-900/50 rounded p-2">
                {refund.recalculationNote}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                操作人：{refund.operator}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DriverQueueList = () => {
  const { driverQueues, filters } = useReconciliationStore();

  const selectedPlates = filters.plateNumber;
  const relatedQueues = selectedPlates.length > 0
    ? driverQueues.filter(q => selectedPlates.includes(q.plateNumber))
    : driverQueues;

  const waitingQueues = relatedQueues.filter(q => q.status === 'waiting' || q.status === 'charging');

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-emerald-400" />
        <h4 className="text-sm font-semibold text-white">司机排队记录</h4>
        <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
          {waitingQueues.length}辆
        </span>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {waitingQueues.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-sm">
            暂无排队车辆
          </div>
        ) : (
          waitingQueues.map((queue, idx) => (
            <div
              key={queue.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-all"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-400'
              }`}>
                {queue.queuePosition}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-sm truncate">
                    {queue.plateNumber}
                  </span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(queue.status)}`}>
                    {getStatusText(queue.status)}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {queue.driverName} · 预计{queue.expectedGunNo}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(queue.waitDuration)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const LinkageBoard = () => {
  return (
    <div className="space-y-4">
      <PaymentStatusLights />
      <GunHeatmap />
      <RefundTimeline />
      <DriverQueueList />
    </div>
  );
};
