import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UserCircle,
  Clock,
  ChevronRight,
  ArrowDownUp,
  FileWarning,
  Sparkles,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CalendarCheck,
} from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { FilterBar } from '../components/FilterBar';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { relativeTime, formatDate, formatDateTime } from '../utils/format';
import type { RecordStatus, RescheduleRecord } from '../types';
import { STATUS_LABEL } from '../utils/format';

function SummaryCard({
  label,
  count,
  icon,
  tone,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${tone}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-ink-500">{label}</div>
        <div className="text-2xl font-serif font-semibold text-ink-800 mt-0.5">
          {count}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { records, getFilteredRecords, role, markBadData, unmarkBadData } =
    useRecordStore();
  const filtered = getFilteredRecords();
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [badTarget, setBadTarget] = useState<RescheduleRecord | null>(null);
  const [badReason, setBadReason] = useState('');
  const [unmarkTarget, setUnmarkTarget] = useState<RescheduleRecord | null>(
    null,
  );

  const stats = useMemo(() => {
    const normal = records.filter((r) => !r.isBadData);
    return {
      total: records.length,
      normal: normal.length,
      pending: normal.filter(
        (r) => r.currentStatus === 'pending' || r.currentStatus === 'promised',
      ).length,
      rescheduled: normal.filter((r) => r.currentStatus === 'rescheduled')
        .length,
      completed: normal.filter((r) => r.currentStatus === 'completed').length,
      bad: records.filter((r) => r.isBadData).length,
      manual: records.filter((r) => r.sourceType === 'manual').length,
    };
  }, [records]);

  const confirmBad = () => {
    if (!badTarget || !badReason.trim()) return;
    markBadData(badTarget.id, badReason.trim());
    setBadTarget(null);
    setBadReason('');
  };

  const confirmUnmark = () => {
    if (!unmarkTarget) return;
    unmarkBadData(unmarkTarget.id);
    setUnmarkTarget(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink-800 tracking-wide">
            改期追踪台
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            按最近更新时间倒序排列。点击行进入详情，查看完整承诺与改判轨迹。
          </p>
        </div>
        <div className="text-[11px] text-ink-400 hidden sm:block">
          当前角色：
          <span className="text-ink-700 font-semibold ml-1">
            {role === 'supervisor' ? '课程主管（可复核/导出）' : '试听顾问（可补录备注）'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <SummaryCard
          label="记录总数"
          count={stats.total}
          icon={<FileText className="w-4 h-4 text-ink-700" />}
          tone="bg-ink-50"
        />
        <SummaryCard
          label="待处理 / 已承诺"
          count={stats.pending}
          icon={<Clock className="w-4 h-4 text-sky-700" />}
          tone="bg-sky-50"
        />
        <SummaryCard
          label="已改期"
          count={stats.rescheduled}
          icon={<RotateCcw className="w-4 h-4 text-amber-700" />}
          tone="bg-amber-50"
        />
        <SummaryCard
          label="已完成（闭环）"
          count={stats.completed}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
          tone="bg-emerald-50"
        />
        <SummaryCard
          label="手工补录"
          count={stats.manual}
          icon={<Sparkles className="w-4 h-4 text-purple-700" />}
          tone="bg-purple-50"
        />
        <SummaryCard
          label="坏数据（已隔离）"
          count={stats.bad}
          icon={<AlertTriangle className="w-4 h-4 text-red-700" />}
          tone="bg-red-50"
        />
      </div>

      <FilterBar />

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-paper-200 flex items-center justify-between bg-paper-100/60">
          <div className="flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-ink-500" />
            <span className="text-sm font-medium text-ink-700">
              记录列表（共 {filtered.length} 条，按最近更新倒序）
            </span>
          </div>
          <div className="text-[11px] text-ink-400">
            行首灰显 = 已标记坏数据，不会污染正常统计
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper-50 text-[11px] text-ink-500 uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left font-semibold">
                  儿童 / 家长
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  来源文件 / 录入方式
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  原承诺日期
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  当前状态
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  处理人
                </th>
                <th className="px-4 py-2.5 text-left font-semibold min-w-[260px]">
                  最近一次人工说明
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  更新时间
                </th>
                <th className="px-4 py-2.5 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-ink-400 text-sm"
                  >
                    <XCircle className="w-10 h-10 mx-auto mb-2 text-ink-200" />
                    暂无匹配记录，尝试调整筛选条件。
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const isExpanded = expandedNote === r.id;
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-paper-200 table-row-hover ${
                      r.isBadData ? 'bg-paper-100/70 opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        {r.sourceType === 'manual' && (
                          <span
                            title="手工补录"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 text-[10px] border border-purple-200 font-semibold"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            手工
                          </span>
                        )}
                        {r.isBadData && (
                          <span
                            title="坏数据已隔离"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-red-50 text-red-700 text-[10px] border border-red-200 font-semibold line-through"
                          >
                            <FileWarning className="w-2.5 h-2.5" />
                            坏数据
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-ink-800 mt-1">
                        {r.childName}
                      </div>
                      <div className="text-xs text-ink-500">
                        {r.parentName} · {r.parentPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-1.5 text-xs text-ink-600">
                        <FileText className="w-3.5 h-3.5 mt-0.5 text-ink-400 shrink-0" />
                        <span className="break-all line-clamp-2">
                          {r.sourceFile}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-400 mt-1">
                        {r.sourceType === 'manual' ? '手工补录' : '文件批量导入'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5 text-sm text-ink-700">
                        <CalendarCheck className="w-3.5 h-3.5 text-ink-400" />
                        {r.originalPromiseDate || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusPill status={r.currentStatus} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5 text-sm text-ink-700">
                        <UserCircle className="w-3.5 h-3.5 text-ink-400" />
                        {r.handler}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p
                        className={`text-sm text-ink-700 leading-relaxed ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {r.latestNote || (
                          <span className="text-ink-400 italic">暂无人工说明</span>
                        )}
                      </p>
                      {r.latestNote.length > 40 && (
                        <button
                          onClick={() =>
                            setExpandedNote(isExpanded ? null : r.id)
                          }
                          className="text-[11px] text-amber-600 hover:text-amber-700 font-medium mt-0.5"
                        >
                          {isExpanded ? '收起' : '展开全文'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <div className="text-sm text-ink-700">
                        {formatDateTime(r.updatedAt)}
                      </div>
                      <div className="text-[11px] text-ink-400">
                        {relativeTime(r.updatedAt)} · 创建于{' '}
                        {formatDate(r.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/record/${r.id}`}
                          className="btn !px-2.5 !py-1.5 !text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          详情
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        {role === 'supervisor' && (
                          <>
                            <span className="divider-v" />
                            {r.isBadData ? (
                              <button
                                onClick={() => setUnmarkTarget(r)}
                                className="btn !px-2.5 !py-1.5 !text-xs"
                                title="解除坏数据标记"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                解除
                              </button>
                            ) : (
                              <button
                                onClick={() => setBadTarget(r)}
                                className="btn btn-danger !px-2.5 !py-1.5 !text-xs"
                                title="标记为坏数据（隔离）"
                              >
                                <FileWarning className="w-3.5 h-3.5" />
                                标记坏
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!badTarget}
        onClose={() => {
          setBadTarget(null);
          setBadReason('');
        }}
        title="标记为坏数据（隔离）"
        subtitle={
          badTarget
            ? `即将隔离【${badTarget.childName}】的记录，它将从正常列表中灰显，且不参与常规统计。`
            : ''
        }
      >
        <label className="label">必填：标记原因（将写入变更历史并可复核）</label>
        <textarea
          rows={4}
          className="textarea"
          placeholder="例如：日期字段非法；家长电话为空；重复导入的脏数据..."
          value={badReason}
          onChange={(e) => setBadReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="btn"
            onClick={() => {
              setBadTarget(null);
              setBadReason('');
            }}
          >
            取消
          </button>
          <button
            className="btn btn-danger"
            onClick={confirmBad}
            disabled={!badReason.trim()}
          >
            <AlertTriangle className="w-4 h-4" />
            确认标记为坏数据
          </button>
        </div>
      </Modal>

      <Modal
        open={!!unmarkTarget}
        onClose={() => setUnmarkTarget(null)}
        title="解除坏数据标记"
        subtitle={
          unmarkTarget
            ? `将恢复【${unmarkTarget.childName}】为正常记录，并回退至上一个有效状态。`
            : ''
        }
      >
        <div className="text-sm text-ink-600 mb-4">
          <p>标记原因：</p>
          <p className="mt-1 p-3 bg-paper-100 rounded-sm border border-paper-200 text-ink-700">
            {unmarkTarget?.badDataReason || '（未填写）'}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={() => setUnmarkTarget(null)}>
            取消
          </button>
          <button className="btn btn-primary" onClick={confirmUnmark}>
            <RotateCcw className="w-4 h-4" />
            确认解除
          </button>
        </div>
      </Modal>
    </div>
  );
}
