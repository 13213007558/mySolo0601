import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChevronLeft,
  AlertTriangle,
  Send,
  Building2,
  CalendarDays,
  Layers,
  Hash,
  TrendingUp,
  AlertOctagon,
  Gauge,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { SaffronGrade as Grade } from '@/types';
import type { SaffronGrade } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { dayjs, batchStatusMeta, percentOf } from '@/utils/helpers';

const GRADE_COLORS: Record<SaffronGrade, string> = {
  [Grade.GRADE_S]: '#DC143C',
  [Grade.GRADE_A]: '#E03E3E',
  [Grade.GRADE_B]: '#E55B5B',
  [Grade.GRADE_C]: '#EB7878',
  [Grade.GRADE_D]: '#F09A9A',
  [Grade.GRADE_E]: '#B45309',
  [Grade.GRADE_F]: '#6B7280',
};

const GRADE_LABELS: Record<SaffronGrade, string> = {
  [Grade.GRADE_S]: '特级S', [Grade.GRADE_A]: '一级A', [Grade.GRADE_B]: '二级B',
  [Grade.GRADE_C]: '三级C', [Grade.GRADE_D]: '四级D', [Grade.GRADE_E]: '五级E', [Grade.GRADE_F]: '退货F',
};

export default function BatchSummaryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getBatchById, getBatchRecords, applyReturnOrder, colorCards } = useAppStore();

  const batch = useMemo(() => (id ? getBatchById(id) : undefined), [id, getBatchById]);
  const records = useMemo(() => (id ? getBatchRecords(id) : []), [id, getBatchRecords]);

  const pieData = useMemo(() => {
    if (!batch) return [];
    return (Object.keys(batch.gradeDistribution) as SaffronGrade[])
      .filter((g) => batch.gradeDistribution[g] > 0)
      .map((g) => ({
        name: GRADE_LABELS[g],
        value: batch.gradeDistribution[g],
        grade: g,
      }));
  }, [batch]);

  const outOfThresholdList = useMemo(
    () =>
      records
        .filter((r) => !r.isWithinThreshold)
        .sort((a, b) => b.deltaE - a.deltaE)
        .slice(0, 8),
    [records]
  );

  const deltaTrend = useMemo(() => {
    const chunkSize = Math.max(1, Math.floor(records.length / 12));
    const points: Array<{ name: string; deltaE: number }> = [];
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const avg = chunk.reduce((s, r) => s + r.deltaE, 0) / chunk.length;
      points.push({
        name: `${i + 1}-${Math.min(i + chunkSize, records.length)}`,
        deltaE: Number(avg.toFixed(2)),
      });
      if (points.length >= 12) break;
    }
    return points;
  }, [records]);

  const outRatio = batch ? percentOf(batch.outOfThresholdCount, batch.totalQuantity, 0) : 0;
  const needWarning = outRatio > 20;
  const threshold = batch
    ? colorCards.find((c) => c.grade === batch.expectedGrade)?.maxDeltaE ?? 3
    : 3;

  const handleApplyReturn = () => {
    if (!batch) return;
    const order = applyReturnOrder({
      batchId: batch.id,
      batchNo: batch.batchNo,
      supplierName: batch.supplierName,
      originalGrade: batch.expectedGrade,
      degradedToGrade: (batch.gradeDistribution[Grade.GRADE_D] || batch.gradeDistribution[Grade.GRADE_E]) ? Grade.GRADE_D : Grade.GRADE_C,
      degradationReason: `批次 ${batch.batchNo} 共 ${batch.totalQuantity} 条，超阈 ${batch.outOfThresholdCount} 条（占比 ${outRatio}%），平均ΔE ${batch.avgDeltaE}，最大ΔE ${batch.maxDeltaE}，超出合同等级 ${batch.expectedGrade} 阈值 ${threshold}，建议降级退货处理。`,
      avgDeltaE: batch.avgDeltaE,
      maxDeltaE: batch.maxDeltaE,
      outOfThresholdCount: batch.outOfThresholdCount,
      totalCount: batch.totalQuantity,
    });
    if (order) {
      navigate(`/approvals/${order.id}`);
    }
  };

  if (!batch) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/batches')} className="btn-hard-ghost mb-5">
          <ChevronLeft className="w-4 h-4" /> 返回列表
        </button>
        <div className="panel p-16 text-center text-ink-500">批次不存在</div>
      </div>
    );
  }

  const statusMeta = batchStatusMeta(batch.status);

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/batches')} className="btn-hard-ghost !px-3 !py-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-2xl font-bold text-ink-100 tracking-wide truncate">
              批次汇总 · {batch.batchNo}
            </h1>
            <span className={`data-chip ${statusMeta.color} border-transparent`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="text-sm text-ink-400 mt-1">
            创建于 {dayjs(batch.createdAt).format('YYYY-MM-DD HH:mm')}
          </p>
        </div>
      </div>

      <div className="panel p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-gold-500 mt-0.5" />
            <div>
              <div className="text-ink-500 text-xs uppercase tracking-wider">合同等级</div>
              <div className="led-number font-bold text-ink-100 mt-1">等级 {batch.expectedGrade}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gold-500 mt-0.5" />
            <div className="min-w-0">
              <div className="text-ink-500 text-xs uppercase tracking-wider">供应商</div>
              <div className="text-ink-100 mt-1 truncate" title={batch.supplierName}>{batch.supplierName}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays className="w-5 h-5 text-gold-500 mt-0.5" />
            <div>
              <div className="text-ink-500 text-xs uppercase tracking-wider">到货日期</div>
              <div className="font-mono text-ink-100 mt-1">{dayjs(batch.arrivalDate).format('YYYY-MM-DD')}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-gold-500 mt-0.5" />
            <div>
              <div className="text-ink-500 text-xs uppercase tracking-wider">质检进度</div>
              <div className="led-number text-ink-100 mt-1">
                {batch.inspectedCount} / {batch.totalQuantity}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-ink-900/60 border border-ink-700 p-3">
            <div className="text-xs text-ink-500 flex items-center gap-1"><Gauge className="w-3 h-3" />平均ΔE</div>
            <div className={`led-number text-xl font-bold mt-1 ${
              batch.avgDeltaE > 4 ? 'text-saffron-400' : batch.avgDeltaE > 2.5 ? 'text-amber-400' : 'text-emerald-400'
            }`}>{batch.inspectedCount > 0 ? batch.avgDeltaE.toFixed(2) : '—'}</div>
          </div>
          <div className="bg-ink-900/60 border border-ink-700 p-3">
            <div className="text-xs text-ink-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" />最大ΔE</div>
            <div className="led-number text-xl font-bold text-saffron-400 mt-1">
              {batch.inspectedCount > 0 ? batch.maxDeltaE.toFixed(2) : '—'}
            </div>
          </div>
          <div className="bg-ink-900/60 border border-ink-700 p-3">
            <div className="text-xs text-ink-500 flex items-center gap-1"><AlertOctagon className="w-3 h-3" />超阈数</div>
            <div className="led-number text-xl font-bold text-amber-400 mt-1">
              {batch.outOfThresholdCount} <span className="text-xs text-ink-500">({outRatio}%)</span>
            </div>
          </div>
          <div className="bg-ink-900/60 border border-ink-700 p-3">
            <div className="text-xs text-ink-500">阈值(ΔE≤)</div>
            <div className="led-number text-xl font-bold text-gold-500 mt-1">{threshold.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {needWarning && (
        <div className="panel border-saffron-700 bg-saffron-950/30">
          <div className="p-5 flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 flex items-center justify-center bg-saffron-900/60 border border-saffron-700 text-saffron-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-[260px]">
              <h3 className="font-serif text-lg font-bold text-saffron-400">色差严重超标警告</h3>
              <p className="text-sm text-ink-300 mt-1">
                本批次超阈比例为 <span className="font-bold text-saffron-400">{outRatio}%</span>（{batch.outOfThresholdCount}/{batch.totalQuantity}），
                超过 20% 警戒线，平均ΔE {batch.avgDeltaE}，建议发起降级退货申请。
              </p>
            </div>
            <button
              onClick={handleApplyReturn}
              className="btn-hard-primary shrink-0"
              disabled={batch.status === 'RETURNED'}
            >
              <Send className="w-4 h-4" />
              发起降级退货
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold-500" /> 等级分布
            </div>
          </div>
          <div className="p-5 h-72">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-500 text-sm">暂无质检数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    stroke="#111827"
                    strokeWidth={2}
                    label={{ fontSize: 11, fill: '#D1D5DB', fontFamily: 'JetBrains Mono' }}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 0, fontSize: 12 }}
                    itemStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold-500" /> ΔE 趋势
            </div>
            <span className="text-xs text-ink-500">按检测序号分段平均</span>
          </div>
          <div className="p-5 h-72">
            {deltaTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-500 text-sm">暂无质检数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deltaTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} tickLine={false} domain={[0, 'auto']} width={30} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 0, fontSize: 12 }}
                    labelStyle={{ color: '#D4AF37' }}
                    itemStyle={{ color: '#F3F4F6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deltaE"
                    name="ΔE"
                    stroke="#D4AF37"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#D4AF37', stroke: '#111827', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: '#DC2626' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-saffron-500" />
            超阈明细（Top {outOfThresholdList.length}，按ΔE降序）
          </div>
          <span className="text-xs text-ink-500">阈值 ΔE ≤ {threshold.toFixed(1)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/60 text-ink-400">
              <tr>
                <th className="px-5 py-3 text-left font-medium">序号</th>
                <th className="px-5 py-3 text-left font-medium">供应商批号</th>
                <th className="px-5 py-3 text-left font-medium">实际等级</th>
                <th className="px-5 py-3 text-left font-medium">ΔE</th>
                <th className="px-5 py-3 text-left font-medium">检测人</th>
                <th className="px-5 py-3 text-left font-medium">检测时间</th>
              </tr>
            </thead>
            <tbody>
              {outOfThresholdList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-500">
                    暂无超阈记录
                  </td>
                </tr>
              )}
              {outOfThresholdList.map((r) => (
                <tr key={r.id} className="border-t border-ink-700/60 hover:bg-ink-700/20">
                  <td className="px-5 py-3 led-number text-ink-200">#{r.serialNumber}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-400">{r.supplierLotNo}</td>
                  <td className="px-5 py-3">
                    <span className="data-chip border-transparent"
                      style={{ backgroundColor: `${GRADE_COLORS[r.actualGrade]}33`, borderColor: GRADE_COLORS[r.actualGrade], color: GRADE_COLORS[r.actualGrade] }}>
                      {GRADE_LABELS[r.actualGrade]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="led-number font-bold text-saffron-400 text-shadow-red">{r.deltaE.toFixed(2)}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-300">{r.inspectorName}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-500">
                    {dayjs(r.inspectedAt).format('MM-DD HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
