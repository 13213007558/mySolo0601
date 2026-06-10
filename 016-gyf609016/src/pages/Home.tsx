import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Filter, RotateCcw, Download, Eye, CheckSquare, Square,
  User, ImageOff, Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { useStoneStore } from '@/store';
import { useFilteredStones, useStoneStats } from '@/hooks/useFilteredStones';
import {
  COLOR_GRADE_LABELS, COLOR_GRADE_COLORS,
  WALL_STATUS_LABELS, WALL_STATUS_COLORS,
  FACADE_ZONES,
} from '@/types';
import type { StoneRecord, ColorGrade, PhotoAttachment } from '@/types';
import { exportPavingSuggestion, downloadAsFile } from '@/utils/export';
import { db } from '@/db';

const GRADE_BORDER_COLORS: Record<ColorGrade, string> = {
  A: 'border-l-emerald-500',
  B: 'border-l-amber-500',
  C: 'border-l-orange-500',
  D: 'border-l-red-500',
};

export default function Home() {
  const navigate = useNavigate();
  const stones = useStoneStore((s) => s.stones);
  const filter = useStoneStore((s) => s.filter);
  const selectedIds = useStoneStore((s) => s.selectedIds);
  const operatorName = useStoneStore((s) => s.operatorName);
  const setFilter = useStoneStore((s) => s.setFilter);
  const resetFilter = useStoneStore((s) => s.resetFilter);
  const toggleSelect = useStoneStore((s) => s.toggleSelect);
  const toggleSelectAll = useStoneStore((s) => s.toggleSelectAll);
  const clearSelection = useStoneStore((s) => s.clearSelection);
  const batchUpdateZone = useStoneStore((s) => s.batchUpdateZone);
  const batchUpdateGrade = useStoneStore((s) => s.batchUpdateGrade);
  const setOperatorName = useStoneStore((s) => s.setOperatorName);
  const loadStones = useStoneStore((s) => s.loadStones);

  const [batchZone, setBatchZone] = useState('');
  const [batchGrade, setBatchGrade] = useState<ColorGrade | ''>('');

  useEffect(() => { loadStones(); }, [loadStones]);

  const filteredStones = useFilteredStones();
  const stats = useStoneStats(stones);

  const uniqueBatchNos = useMemo(() => {
    const set = new Set(stones.map((s) => s.batchNo.trim()).filter(Boolean));
    return Array.from(set).sort();
  }, [stones]);

  const columns = useMemo<ColumnDef<StoneRecord, unknown>[]>(() => [
    {
      id: 'select',
      header: () => {
        const pageIds = filteredStones.map((s) => s.id);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
        return (
          <button onClick={() => toggleSelectAll(pageIds)} className="text-orange-700">
            {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
        );
      },
      cell: ({ row }) => (
        <button onClick={() => toggleSelect(row.original.id)} className="text-orange-700">
          {selectedIds.has(row.original.id) ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
      ),
      size: 40,
    },
    { accessorKey: 'stoneNo', header: '石材编号', size: 140 },
    { accessorKey: 'batchNo', header: '批次号', size: 120 },
    { accessorKey: 'facadeZone', header: '立面分区', size: 130 },
    {
      accessorKey: 'colorGrade',
      header: '色差等级',
      size: 120,
      cell: ({ getValue }) => {
        const grade = getValue() as ColorGrade;
        return (
          <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${COLOR_GRADE_COLORS[grade]}`}>
            {COLOR_GRADE_LABELS[grade]}
          </span>
        );
      },
    },
    {
      accessorKey: 'wallStatus',
      header: '上墙状态',
      size: 110,
      cell: ({ getValue }) => {
        const status = getValue() as StoneRecord['wallStatus'];
        return (
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${WALL_STATUS_COLORS[status]}`}>
            {WALL_STATUS_LABELS[status]}
          </span>
        );
      },
    },
    { accessorKey: 'operator', header: '操作人', size: 100 },
    {
      id: 'actions',
      header: '操作',
      size: 80,
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/stone/${row.original.id}`)}
          className="inline-flex items-center gap-1 text-orange-700 hover:text-orange-900 text-sm"
        >
          <Eye size={14} /> 详情
        </button>
      ),
    },
  ], [filteredStones, selectedIds, toggleSelect, toggleSelectAll, navigate]);

  const table = useReactTable({
    data: filteredStones,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExport = async () => {
    const allPhotos = await db.photos.toArray();
    const photosMap: Record<string, PhotoAttachment[]> = {};
    for (const p of allPhotos) {
      if (!photosMap[p.stoneId]) photosMap[p.stoneId] = [];
      photosMap[p.stoneId].push(p);
    }
    const content = exportPavingSuggestion(filteredStones, photosMap);
    downloadAsFile(content, '铺贴建议.txt');
  };

  const handleBatchZone = async () => {
    if (!batchZone || selectedIds.size === 0) return;
    await batchUpdateZone(batchZone);
    setBatchZone('');
  };

  const handleBatchGrade = async () => {
    if (!batchGrade || selectedIds.size === 0) return;
    await batchUpdateGrade(batchGrade as ColorGrade);
    setBatchGrade('');
  };

  const statCards = [
    { label: '总计', value: stats.total, icon: BarChart3, border: 'border-l-slate-400' },
    { label: 'A 级', value: stats.gradeA, icon: CheckCircle2, border: GRADE_BORDER_COLORS.A },
    { label: 'B 级', value: stats.gradeB, icon: CheckCircle2, border: GRADE_BORDER_COLORS.B },
    { label: 'C 级', value: stats.gradeC, icon: AlertTriangle, border: GRADE_BORDER_COLORS.C },
    { label: 'D 级', value: stats.gradeD, icon: AlertTriangle, border: GRADE_BORDER_COLORS.D },
    { label: '缺照片', value: stats.missingPhoto, icon: ImageOff, border: 'border-l-purple-500' },
    { label: '已确认', value: stats.confirmed, icon: CheckCircle2, border: 'border-l-emerald-500' },
    { label: '待处理', value: stats.pending, icon: Clock, border: 'border-l-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            外立面石材色差复核板
          </h1>
          <div className="flex items-center gap-2">
            <User size={16} className="text-slate-400" />
            <input
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="操作人姓名"
              className="border border-slate-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {statCards.map((c) => (
            <div
              key={c.label}
              className={`bg-white rounded-lg border border-slate-200 border-l-4 ${c.border} shadow-sm px-3 py-2`}
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <c.icon size={12} /> {c.label}
              </div>
              <div className="mt-1 text-lg font-bold text-slate-800">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-4 py-3">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
            <Filter size={14} /> 筛选条件
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filter.batchNo}
              onChange={(e) => setFilter({ batchNo: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="">全部批次</option>
              {uniqueBatchNos.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={filter.facadeZone}
              onChange={(e) => setFilter({ facadeZone: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="">全部分区</option>
              {FACADE_ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <select
              value={filter.colorGrade}
              onChange={(e) => setFilter({ colorGrade: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="">全部等级</option>
              {Object.entries(COLOR_GRADE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.missingPhoto}
                onChange={(e) => setFilter({ missingPhoto: e.target.checked })}
                className="accent-orange-700"
              />
              缺照片
            </label>
            <input
              value={filter.searchText}
              onChange={(e) => setFilter({ searchText: e.target.value })}
              placeholder="搜索编号/批次/操作人..."
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <button
              onClick={resetFilter}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-orange-700 transition-colors"
            >
              <RotateCcw size={14} /> 重置
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-slate-100 border-b border-slate-200">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      style={{ width: h.getSize() }}
                      className="px-3 py-2.5 text-left font-medium text-slate-600 whitespace-nowrap"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 hover:bg-orange-50/40 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 whitespace-nowrap text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-slate-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-300 shadow-lg">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-slate-700">
              已选 <span className="text-orange-700 font-bold">{selectedIds.size}</span> 项
            </span>
            <select
              value={batchZone}
              onChange={(e) => setBatchZone(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="">批量设置分区</option>
              {FACADE_ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <button
              onClick={handleBatchZone}
              disabled={!batchZone}
              className="px-3 py-1 text-sm rounded bg-orange-700 text-white hover:bg-orange-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              应用分区
            </button>
            <select
              value={batchGrade}
              onChange={(e) => setBatchGrade(e.target.value as ColorGrade | '')}
              className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="">批量设置等级</option>
              {Object.entries(COLOR_GRADE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              onClick={handleBatchGrade}
              disabled={!batchGrade}
              className="px-3 py-1 text-sm rounded bg-orange-700 text-white hover:bg-orange-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              应用等级
            </button>
            <button
              onClick={handleExport}
              className="ml-auto flex items-center gap-1 px-3 py-1 text-sm rounded bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <Download size={14} /> 导出铺贴建议
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              取消选择
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
