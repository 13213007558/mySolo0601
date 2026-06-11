import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Combobox } from '@headlessui/react';
import { Calendar, Check, ChevronDown, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useSeedBatchRecords } from '@/hooks/useSeedBatchRecords';
import { SaffronGrade, type BatchInfo } from '@/types';
import { dayjs } from '@/utils/helpers';

const GRADE_COLORS: Record<SaffronGrade, string> = {
  [SaffronGrade.GRADE_S]: '#B22222',
  [SaffronGrade.GRADE_A]: '#CD2626',
  [SaffronGrade.GRADE_B]: '#DC143C',
  [SaffronGrade.GRADE_C]: '#E03E3E',
  [SaffronGrade.GRADE_D]: '#E55B5B',
  [SaffronGrade.GRADE_E]: '#EB7878',
  [SaffronGrade.GRADE_F]: '#F09A9A',
};

const ALL_GRADES: SaffronGrade[] = [
  SaffronGrade.GRADE_S,
  SaffronGrade.GRADE_A,
  SaffronGrade.GRADE_B,
  SaffronGrade.GRADE_C,
  SaffronGrade.GRADE_D,
  SaffronGrade.GRADE_E,
  SaffronGrade.GRADE_F,
];

interface SupplierOption {
  id: string;
  name: string;
}

function buildGradeDeltaData(
  batches: BatchInfo[],
  silkRecords: ReturnType<typeof useAppStore.getState>['silkRecords']
) {
  const sortedBatches = [...batches]
    .sort((a, b) => dayjs(a.arrivalDate).valueOf() - dayjs(b.arrivalDate).valueOf())
    .slice(-10);

  return sortedBatches.map((batch) => {
    const records = silkRecords.filter((r) => r.batchId === batch.id);
    const row: Record<string, unknown> = {
      batchNo: batch.batchNo,
      batchId: batch.id,
    };
    ALL_GRADES.forEach((grade) => {
      const gradeRecords = records.filter((r) => r.actualGrade === grade);
      if (gradeRecords.length > 0) {
        const avg =
          gradeRecords.reduce((sum, r) => sum + r.deltaE, 0) / gradeRecords.length;
        row[grade] = Number(avg.toFixed(2));
      }
    });
    return row;
  });
}

function buildSupplierProfileData(
  batches: BatchInfo[],
  suppliers: SupplierOption[]
) {
  const supplierMap = new Map<string, BatchInfo[]>();
  batches.forEach((batch) => {
    if (!supplierMap.has(batch.supplierId)) {
      supplierMap.set(batch.supplierId, []);
    }
    supplierMap.get(batch.supplierId)!.push(batch);
  });

  const data = suppliers.map((sp) => {
    const spBatches = supplierMap.get(sp.id) ?? [];
    const totalRecords = spBatches.reduce((sum, b) => sum + b.inspectedCount, 0);
    const totalOutOf = spBatches.reduce((sum, b) => sum + b.outOfThresholdCount, 0);
    const avgDeltaE =
      spBatches.length > 0
        ? spBatches.reduce((sum, b) => sum + b.avgDeltaE, 0) / spBatches.length
        : 0;
    const qualifiedRate =
      totalRecords > 0
        ? Number(((1 - totalOutOf / totalRecords) * 100).toFixed(1))
        : 0;
    return {
      supplierId: sp.id,
      supplierName: sp.name,
      avgDeltaE: Number(avgDeltaE.toFixed(2)),
      qualifiedRate,
      batchCount: spBatches.length,
      outOfCount: totalOutOf,
    };
  });

  return data.sort((a, b) => b.qualifiedRate - a.qualifiedRate);
}

function SupplierMultiCombobox({
  options,
  selected,
  onChange,
}: {
  options: SupplierOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  const selectedSuppliers = options.filter((o) => selected.includes(o.id));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <Combobox
      as="div"
      value={selected}
      onChange={() => {}}
      multiple
      className="relative"
    >
      <Combobox.Input
        className={cn(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm',
          'focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100'
        )}
        placeholder="选择供应商（可多选）"
        displayValue={() => selectedSuppliers.map((s) => s.name).join('、')}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <Combobox.Options
        className={cn(
          'absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200',
          'bg-white py-1 shadow-lg'
        )}
      >
        <div className="px-3 py-2 text-xs font-medium text-slate-500">
          已选 {selected.length} 个
        </div>
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-slate-400">无匹配结果</div>
        ) : (
          filtered.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <Combobox.Option
                key={opt.id}
                value={opt.id}
                onClick={() => toggle(opt.id)}
                className={({ active: hover }) =>
                  cn(
                    'flex cursor-pointer items-center justify-between px-3 py-2 text-sm',
                    hover ? 'bg-rose-50' : 'bg-white',
                    active ? 'text-rose-600' : 'text-slate-700'
                  )
                }
              >
                <span>{opt.name}</span>
                {active && <Check className="h-4 w-4" aria-hidden />}
              </Combobox.Option>
            );
          })
        )}
      </Combobox.Options>
    </Combobox>
  );
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
}

function TrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const batchId = payload[0]?.payload?.batchId as string | undefined;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-slate-700">批次号：{label}</p>
      {batchId && (
        <p className="mb-2 text-[11px] text-slate-400">ID：{batchId}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">等级 {entry.dataKey}</span>
            </div>
            <span className="font-mono font-medium text-slate-800">
              ΔE {Number(entry.value).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProfileTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: Record<string, unknown>;
  }>;
}

function ProfileTooltip({ active, payload }: ProfileTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as Record<string, unknown> | undefined;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-slate-700">
        {data.supplierName as string}
      </p>
      <div className="space-y-0.5 text-xs text-slate-600">
        <p>批次数量：{data.batchCount as number} 批</p>
        <p>平均色偏 ΔE：{Number(data.avgDeltaE).toFixed(2)}</p>
        <p>不合格件数：{data.outOfCount as number} 件</p>
        <p className="font-medium text-rose-600">
          合格率：{Number(data.qualifiedRate).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

export default function HistoryComparePage() {
  useSeedBatchRecords();

  const batches = useAppStore((s) => s.batches);
  const silkRecords = useAppStore((s) => s.silkRecords);

  const [startDate, setStartDate] = useState<string>(
    dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  const supplierOptions: SupplierOption[] = useMemo(() => {
    const map = new Map<string, string>();
    batches.forEach((b) => {
      if (!map.has(b.supplierId)) {
        map.set(b.supplierId, b.supplierName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const d = dayjs(batch.arrivalDate);
      const inDate =
        d.isAfter(dayjs(startDate).subtract(1, 'day')) &&
        d.isBefore(dayjs(endDate).add(1, 'day'));
      const inSupplier =
        selectedSupplierIds.length === 0 ||
        selectedSupplierIds.includes(batch.supplierId);
      return inDate && inSupplier;
    });
  }, [batches, startDate, endDate, selectedSupplierIds]);

  const trendData = useMemo(
    () => buildGradeDeltaData(filteredBatches, silkRecords),
    [filteredBatches, silkRecords]
  );

  const profileData = useMemo(() => {
    const suppliersToShow =
      selectedSupplierIds.length > 0
        ? supplierOptions.filter((o) => selectedSupplierIds.includes(o.id))
        : supplierOptions;
    return buildSupplierProfileData(filteredBatches, suppliersToShow);
  }, [filteredBatches, selectedSupplierIds, supplierOptions]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">历史批次对比</h1>
          <p className="text-sm text-slate-500">
            多维度分析历史质检数据，识别供应商质量波动与色偏趋势
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Calendar className="h-3.5 w-3.5" />
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm',
                  'focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100'
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Calendar className="h-3.5 w-3.5" />
                结束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(
                  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm',
                  'focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100'
                )}
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Users className="h-3.5 w-3.5" />
                供应商筛选
              </label>
              <SupplierMultiCombobox
                options={supplierOptions}
                selected={selectedSupplierIds}
                onChange={setSelectedSupplierIds}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              共 {filteredBatches.length} 个批次
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              供应商 {profileData.length} 家
            </span>
            {selectedSupplierIds.length > 0 && (
              <button
                onClick={() => setSelectedSupplierIds([])}
                className="text-rose-600 hover:underline"
              >
                清除供应商筛选
              </button>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-rose-500" />
              <h2 className="text-base font-semibold text-slate-800">
                色偏趋势（近 10 批次各等级平均 ΔE）
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              数值越高表示色偏越严重
            </span>
          </div>
          <div className="h-80 w-full">
            {trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                暂无符合筛选条件的数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="batchNo"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: '平均 ΔE',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12, fill: '#64748B' },
                    }}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="circle"
                  />
                  {ALL_GRADES.map((grade) => {
                    const hasData = trendData.some((d) => grade in d);
                    if (!hasData) return null;
                    return (
                      <Line
                        key={grade}
                        type="monotone"
                        dataKey={grade}
                        stroke={GRADE_COLORS[grade]}
                        strokeWidth={2}
                        dot={{ r: 3, fill: GRADE_COLORS[grade] }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-rose-500" />
              <h2 className="text-base font-semibold text-slate-800">
                供应商质量画像（合格率对比）
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              横向条形图：合格率越高越好
            </span>
          </div>
          <div className="h-96 w-full">
            {profileData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                暂无符合筛选条件的数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={profileData}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={(v) => `${v}%`}
                    label={{
                      value: '合格率 (%)',
                      position: 'insideBottom',
                      offset: -5,
                      style: { fontSize: 12, fill: '#64748B' },
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="supplierName"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    width={200}
                  />
                  <Tooltip content={<ProfileTooltip />} />
                  <Bar
                    dataKey="qualifiedRate"
                    name="合格率"
                    barSize={22}
                    radius={[0, 6, 6, 0]}
                    label={{
                      position: 'right',
                      formatter: (v: number) => `${v.toFixed(1)}%`,
                      fontSize: 11,
                      fill: '#475569',
                    }}
                  >
                    {profileData.map((entry, index) => {
                      const color =
                        entry.qualifiedRate >= 90
                          ? '#10B981'
                          : entry.qualifiedRate >= 75
                          ? '#F59E0B'
                          : '#EF4444';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
