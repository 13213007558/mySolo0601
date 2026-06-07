import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TriStateContainer from '../components/TriStateContainer';
import RecordEditModal from '../components/RecordEditModal';
import AuditDrawer from '../components/AuditDrawer';
import TraceBreadcrumb from '../components/TraceBreadcrumb';
import { DataQualityBadge, ReviewBadge, StatusBadge, TemperatureBadge } from '../components/Badges';
import { useRecordsStore } from '../stores/recordsStore';
import { useBabyStore } from '../stores/babyStore';
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit3,
  History,
  FileSpreadsheet,
  Baby as BabyIcon,
  Calendar,
} from 'lucide-react';
import type { MorningCheck, RecordWithBaby } from '../../shared/types';

export default function RecordsPage() {
  const navigate = useNavigate();
  const { records, loading, fetchRecords, filters, setFilter, getFilteredRecords } = useRecordsStore();
  const { babies, fetchBabies, lookupByExportRow } = useBabyStore();
  const [editModal, setEditModal] = useState<{ open: boolean; mode: 'create' | 'edit' | 'manual'; data?: RecordWithBaby }>({
    open: false,
    mode: 'create',
  });
  const [auditDrawer, setAuditDrawer] = useState<{ open: boolean; recordId: string; title: string }>({
    open: false,
    recordId: '',
    title: '',
  });
  const [exportRowNo, setExportRowNo] = useState<string>('');

  useEffect(() => {
    fetchRecords();
    fetchBabies();
  }, [fetchRecords, fetchBabies]);

  const filtered = getFilteredRecords();

  const { state, dirtyCount, emptyCount } = useMemo(() => {
    if (filtered.length === 0) return { state: 'empty' as const, dirtyCount: 0, emptyCount: 0 };
    const dirty = filtered.filter((r) => r.dataQuality === 'dirty').length;
    const empty = filtered.filter((r) => r.dataQuality === 'empty').length;
    return {
      state: dirty > 0 || empty > 0 ? ('dirty' as const) : ('clean' as const),
      dirtyCount: dirty,
      emptyCount: empty,
    };
  }, [filtered]);

  const classList = ['all', ...Array.from(new Set(records.map((r) => r.className)))];

  const handleExportLookup = async () => {
    const row = Number(exportRowNo);
    if (!row) return;
    const baby = await lookupByExportRow(row);
    if (baby) {
      navigate(`/baby/${baby.id}`);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in-up">
        <TraceBreadcrumb
          items={[
            { label: '导出表第 17 行', icon: 'sheet', onClick: () => setExportRowNo('17') },
            { label: '晨检记录列表', icon: 'baby', active: true },
          ]}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <div>
          <h1 className="font-serif text-2xl font-bold text-medical-800 mb-1">晨检复核记录</h1>
          <p className="text-sm text-medical-500">南门母婴店 · 月底复盘追溯 · 每条数据均可追溯原始记录</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-medical-100 shadow-soft">
            <FileSpreadsheet className="w-4 h-4 text-medical-500" />
            <input
              type="number"
              placeholder="导出行号反查..."
              value={exportRowNo}
              onChange={(e) => setExportRowNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExportLookup()}
              className="w-32 text-sm bg-transparent outline-none text-medical-700 placeholder:text-medical-300"
            />
            <button
              onClick={handleExportLookup}
              className="text-xs px-2.5 py-1 rounded-md bg-medical-500 text-white hover:bg-medical-600 transition-colors"
            >
              定位
            </button>
          </div>
          <button
            onClick={() => setEditModal({ open: true, mode: 'manual' })}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-warm-200 text-warm-700 text-sm font-medium hover:bg-warm-50 transition-colors shadow-soft"
          >
            <Edit3 className="w-4 h-4" />
            手工补录
          </button>
          <button
            onClick={() => setEditModal({ open: true, mode: 'create' })}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-medical-500 text-white text-sm font-medium hover:bg-medical-600 transition-colors shadow-inset-medical"
          >
            <Plus className="w-4 h-4" />
            新增记录
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-soft border border-medical-50 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-medical-500" />
            <span className="text-sm font-medium text-medical-700">筛选：</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-medical-50/60">
            <Search className="w-4 h-4 text-medical-400" />
            <input
              placeholder="搜索宝宝姓名..."
              value={filters.keyword ?? ''}
              onChange={(e) => setFilter('keyword', e.target.value)}
              className="w-32 text-sm bg-transparent outline-none text-medical-700 placeholder:text-medical-300"
            />
          </div>
          <select
            value={filters.className ?? 'all'}
            onChange={(e) => setFilter('className', e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-medical-50/60 border-0 text-medical-700 outline-none cursor-pointer"
          >
            {classList.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? '全部班级' : c}
              </option>
            ))}
          </select>
          <select
            value={filters.dataQuality ?? 'all'}
            onChange={(e) => setFilter('dataQuality', e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-medical-50/60 border-0 text-medical-700 outline-none cursor-pointer"
          >
            <option value="all">全部数据状态</option>
            <option value="clean">正常</option>
            <option value="dirty">脏数据</option>
            <option value="empty">空数据</option>
          </select>
          <select
            value={filters.reviewStatus ?? 'all'}
            onChange={(e) => setFilter('reviewStatus', e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-medical-50/60 border-0 text-medical-700 outline-none cursor-pointer"
          >
            <option value="all">全部复核状态</option>
            <option value="pending">待复核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="rolled-back">已回退</option>
          </select>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 text-sm text-medical-600 hover:text-medical-800 transition-colors">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <TriStateContainer
        state={state}
        dirtyCount={dirtyCount}
        emptyCount={emptyCount}
        onAddClick={() => setEditModal({ open: true, mode: 'create' })}
      >
        {loading ? (
          <div className="text-center py-12 text-medical-500">加载中...</div>
        ) : state === 'empty' ? null : (
          <div className="bg-white rounded-2xl shadow-soft border border-medical-50 overflow-hidden animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-medical-50/60 text-medical-700 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-left">宝宝</th>
                    <th className="px-5 py-3.5 text-left">班级</th>
                    <th className="px-5 py-3.5 text-left">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        日期
                      </span>
                    </th>
                    <th className="px-5 py-3.5 text-left">体温</th>
                    <th className="px-5 py-3.5 text-left">状态</th>
                    <th className="px-5 py-3.5 text-left">数据质量</th>
                    <th className="px-5 py-3.5 text-left">复核</th>
                    <th className="px-5 py-3.5 text-left">补录</th>
                    <th className="px-5 py-3.5 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, idx) => (
                    <tr
                      key={rec.id}
                      className={`border-t border-medical-50 transition-colors hover:bg-medical-50/30 animate-fade-in-up ${
                        rec.dataQuality === 'dirty' ? 'bg-warm-50/40' : idx % 2 === 1 ? 'bg-medical-50/20' : ''
                      }`}
                      style={{ animationDelay: `${240 + idx * 40}ms` }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={rec.babyAvatar} alt={rec.babyName} className="w-9 h-9 rounded-xl bg-medical-100" />
                          <div>
                            <p className="text-sm font-semibold text-medical-800">{rec.babyName}</p>
                            <p className="text-xs text-medical-400">ID: {rec.babyId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-medical-100/50 text-medical-700">
                          <BabyIcon className="w-3 h-3" />
                          {rec.className}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-medical-700 font-mono">{rec.date}</td>
                      <td className="px-5 py-3.5">
                        <TemperatureBadge value={rec.temperature} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <DataQualityBadge quality={rec.dataQuality} />
                      </td>
                      <td className="px-5 py-3.5">
                        <ReviewBadge status={rec.reviewStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        {rec.isManualEntry ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-warm-100 text-warm-700 font-medium">
                            <Edit3 className="w-3 h-3" />
                            补录
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/baby/${rec.babyId}`}
                            className="w-8 h-8 rounded-lg text-medical-600 hover:bg-medical-50 hover:text-medical-800 flex items-center justify-center transition-colors"
                            title="查看宝宝详情（追溯原始记录）"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setEditModal({ open: true, mode: 'edit', data: rec })}
                            className="w-8 h-8 rounded-lg text-medical-600 hover:bg-medical-50 hover:text-medical-800 flex items-center justify-center transition-colors"
                            title="编辑记录"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setAuditDrawer({
                                open: true,
                                recordId: rec.id,
                                title: `${rec.babyName} · ${rec.date}`,
                              })
                            }
                            className="w-8 h-8 rounded-lg text-medical-600 hover:bg-medical-50 hover:text-medical-800 flex items-center justify-center transition-colors"
                            title="查看审计历史（含自动回退保留）"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </TriStateContainer>

      <RecordEditModal
        open={editModal.open}
        onClose={() => setEditModal({ ...editModal, open: false })}
        mode={editModal.mode}
        initialData={
          editModal.data
            ? {
                id: editModal.data.id,
                babyId: editModal.data.babyId,
                date: editModal.data.date,
                temperature: editModal.data.temperature,
                oralCheck: editModal.data.oralCheck,
                handCheck: editModal.data.handCheck,
                skinCheck: editModal.data.skinCheck,
                remark: editModal.data.remark,
              }
            : undefined
        }
        onSuccess={() => fetchRecords()}
      />

      <AuditDrawer
        open={auditDrawer.open}
        onClose={() => setAuditDrawer({ ...auditDrawer, open: false })}
        recordId={auditDrawer.recordId}
        recordTitle={auditDrawer.title}
      />
    </AppLayout>
  );
}
