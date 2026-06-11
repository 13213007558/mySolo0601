import { useMemo } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Package,
  ClipboardList,
  FileCheck,
  TrendingUp,
  Activity,
  Clock,
  User,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { dayjs, batchStatusMeta, percentOf } from '@/utils/helpers';

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}

function KpiCard({ icon: Icon, label, value, hint, accent = 'text-gold-500' }: KpiCardProps) {
  return (
    <div className="panel p-5 flex items-center gap-4">
      <div className={`w-12 h-12 flex items-center justify-center bg-ink-900 border border-ink-700 ${accent}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-ink-400 uppercase tracking-wider">{label}</div>
        <div className="led-number text-2xl font-bold text-ink-100 mt-1">{value}</div>
        {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { batches, returnOrders, silkRecords, currentUser } = useAppStore();

  const stats = useMemo(() => {
    const pending = batches.filter((b) => b.status === 'PENDING').length;
    const inspecting = batches.filter((b) => b.status === 'INSPECTING').length;
    const pendingApproval = returnOrders.filter(
      (r) => r.status === 'PENDING_APPROVAL' || r.status === 'FIRST_APPROVED'
    ).length;
    const inspectedBatches = batches.filter((b) => b.inspectedCount > 0);
    const avgDeltaE =
      inspectedBatches.length > 0
        ? (
            inspectedBatches.reduce((sum, b) => sum + b.avgDeltaE, 0) /
            inspectedBatches.length
          ).toFixed(2)
        : '0.00';
    return { pending, inspecting, pendingApproval, avgDeltaE };
  }, [batches, returnOrders]);

  const recentBatches = useMemo(
    () => [...batches].sort((a, b) => dayjs(b.arrivalDate).unix() - dayjs(a.arrivalDate).unix()).slice(0, 5),
    [batches]
  );

  const timeline = useMemo(() => {
    const events: Array<{ time: string; text: string; type: string }> = [];
    recentBatches.forEach((b) => {
      const meta = batchStatusMeta(b.status);
      events.push({
        time: dayjs(b.arrivalDate).format('MM-DD HH:mm'),
        text: `批次 ${b.batchNo}：${meta.label}`,
        type: b.status,
      });
    });
    silkRecords.slice(-5).forEach((r) => {
      events.push({
        time: dayjs(r.inspectedAt).format('MM-DD HH:mm'),
        text: `${r.inspectorName} 完成 ${r.serialNumber} 号丝质检测（ΔE ${r.deltaE}）`,
        type: 'RECORD',
      });
    });
    return events.sort((a, b) => dayjs(b.time, 'MM-DD HH:mm').unix() - dayjs(a.time, 'MM-DD HH:mm').unix()).slice(0, 8);
  }, [recentBatches, silkRecords]);

  const deltaTrend = useMemo(() => {
    return recentBatches
      .slice()
      .reverse()
      .map((b) => ({
        name: b.batchNo.split('-').slice(-2).join('-'),
        deltaE: b.inspectedCount > 0 ? b.avgDeltaE : 0,
        fullName: b.batchNo,
      }));
  }, [recentBatches]);

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-100 tracking-wide">总览台</h1>
          <p className="text-sm text-ink-400 mt-1 flex items-center gap-2">
            <User className="w-4 h-4" />
            {currentUser.name} · {dayjs().format('YYYY年MM月DD日')}
          </p>
        </div>
        <button
          onClick={() => navigate('/batches')}
          className="btn-hard-gold"
        >
          批次列表 <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="待质检批次" value={stats.pending} hint={`共 ${batches.length} 批次`} accent="text-sky-400" />
        <KpiCard icon={ClipboardList} label="质检中" value={stats.inspecting} hint="正在进行逐条比对" accent="text-amber-400" />
        <KpiCard icon={FileCheck} label="待审批退货单" value={stats.pendingApproval} hint="一级/终审待确认" accent="text-saffron-400" />
        <KpiCard icon={TrendingUp} label="近期平均ΔE" value={stats.avgDeltaE} hint="色差值越低越好" accent="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <div className="panel-title flex items-center gap-2">
              <Activity className="w-5 h-5 text-gold-500" />
              近期批次
            </div>
            <button onClick={() => navigate('/batches')} className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1">
              查看全部 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-900/60 text-ink-400">
                <tr>
                  <th className="px-5 py-3 text-left font-mono font-medium">批次号</th>
                  <th className="px-5 py-3 text-left font-medium">供应商</th>
                  <th className="px-5 py-3 text-left font-medium">到货日</th>
                  <th className="px-5 py-3 text-left font-medium w-40">质检进度</th>
                  <th className="px-5 py-3 text-left font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((b) => {
                  const meta = batchStatusMeta(b.status);
                  const progress = percentOf(b.inspectedCount, b.totalQuantity);
                  return (
                    <tr key={b.id} className="border-t border-ink-700/60 hover:bg-ink-700/20 cursor-pointer"
                      onClick={() => navigate(`/batches/${b.id}/summary`)}>
                      <td className="px-5 py-3 font-mono text-ink-200">{b.batchNo}</td>
                      <td className="px-5 py-3 text-ink-300 max-w-[200px] truncate">{b.supplierName}</td>
                      <td className="px-5 py-3 text-ink-400 font-mono text-xs">
                        {dayjs(b.arrivalDate).format('YYYY-MM-DD')}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="progress-track flex-1">
                            <div
                              className="progress-bar bg-gradient-to-r from-saffron-700 to-gold-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="led-number text-xs text-ink-300 w-12 text-right">{b.inspectedCount}/{b.totalQuantity}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`data-chip ${meta.color} border-transparent`}>{meta.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-500" />
              动态时间线
            </div>
          </div>
          <div className="p-5 space-y-3 max-h-[340px] overflow-y-auto scrollbar-thin">
            {timeline.length === 0 && <p className="text-ink-500 text-sm">暂无动态</p>}
            {timeline.map((e, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 mt-1.5 ${
                    e.type === 'DEGRADED' || e.type === 'RETURNED' ? 'bg-saffron-500' :
                    e.type === 'INSPECTED' ? 'bg-emerald-500' :
                    e.type === 'INSPECTING' ? 'bg-amber-500' :
                    e.type === 'RECORD' ? 'bg-sky-500' : 'bg-ink-500'
                  }`} />
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-ink-700 my-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="font-mono text-xs text-ink-500">{e.time}</div>
                  <div className="text-sm text-ink-200 mt-0.5">{e.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-500" />
            ΔE 趋势（近期批次平均色差）
          </div>
          {Number(stats.avgDeltaE) > 4 && (
            <span className="data-chip bg-saffron-600/20 border-saffron-700 text-saffron-400">
              <AlertTriangle className="w-3 h-3" /> 平均色差偏高
            </span>
          )}
        </div>
        <div className="p-5 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deltaTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} tickLine={false} domain={[0, 'auto']} width={32} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 0, fontSize: 12 }}
                labelStyle={{ color: '#D4AF37', fontFamily: 'JetBrains Mono' }}
                itemStyle={{ color: '#F3F4F6' }}
                labelFormatter={(l, p) => p?.[0]?.payload?.fullName || l}
              />
              <Line
                type="monotone"
                dataKey="deltaE"
                stroke="#D4AF37"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#D4AF37', stroke: '#111827', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#DC2626' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
