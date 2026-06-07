import { useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CalendarCheck,
  UserCircle,
  Phone,
  User,
  Sparkles,
  AlertTriangle,
  MessageSquarePlus,
  Gavel,
  FileWarning,
  Download,
  History,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { StatusPill } from '../components/StatusPill';
import { Timeline } from '../components/Timeline';
import { Modal } from '../components/Modal';
import {
  formatDate,
  formatDateTime,
  recordsToCSV,
  downloadCSV,
  STATUS_LABEL,
} from '../utils/format';
import type { RecordStatus } from '../types';

export function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const record = useRecordStore((s) => s.getRecordById(id ?? ''));
  const {
    role,
    appendNote,
    rejudgeStatus,
    markBadData,
    unmarkBadData,
    currentOperator,
  } = useRecordStore();

  const [note, setNote] = useState('');
  const [noteStatus, setNoteStatus] = useState<RecordStatus | ''>('');
  const [showNote, setShowNote] = useState(false);

  const [rejudgeTo, setRejudgeTo] = useState<RecordStatus>('completed');
  const [rejudgeReason, setRejudgeReason] = useState('');
  const [showRejudge, setShowRejudge] = useState(false);

  const [badReason, setBadReason] = useState('');
  const [showBad, setShowBad] = useState(false);
  const [showUnmark, setShowUnmark] = useState(false);

  const canEdit = useMemo(() => {
    if (!record) return false;
    if (record.isBadData) return false;
    return true;
  }, [record]);

  if (!record) {
    return (
      <div className="animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回追踪台
        </Link>
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-ink-300" />
          <p className="text-ink-500">未找到该记录（可能已被删除或 ID 错误）。</p>
        </div>
      </div>
    );
  }

  const submitNote = () => {
    if (!note.trim()) return;
    appendNote(record.id, note.trim(), noteStatus || undefined);
    setNote('');
    setNoteStatus('');
    setShowNote(false);
  };

  const submitRejudge = () => {
    if (!rejudgeReason.trim()) return;
    rejudgeStatus(record.id, rejudgeTo, rejudgeReason.trim());
    setRejudgeReason('');
    setShowRejudge(false);
  };

  const submitBad = () => {
    if (!badReason.trim()) return;
    markBadData(record.id, badReason.trim());
    setBadReason('');
    setShowBad(false);
  };

  const submitUnmark = () => {
    unmarkBadData(record.id);
    setShowUnmark(false);
  };

  const exportSingle = () => {
    const csv = recordsToCSV([record]);
    downloadCSV(csv, `改期记录_${record.childName}_${formatDate(record.createdAt)}.csv`);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
          >
            <ArrowLeft className="w-4 h-4" />
            返回追踪台
          </Link>
          <span className="text-ink-300">|</span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink-800 flex items-center gap-2">
              {record.childName}
              {record.sourceType === 'manual' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-purple-50 text-purple-700 text-[11px] border border-purple-200 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  手工补录
                </span>
              )}
              {record.isBadData && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-red-50 text-red-700 text-[11px] border border-red-200 font-semibold line-through">
                  <FileWarning className="w-3 h-3" />
                  坏数据（已隔离）
                </span>
              )}
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              记录 ID：{record.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportSingle} className="btn !py-1.5 !text-xs">
            <Download className="w-3.5 h-3.5" />
            导出本条
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => setShowNote(true)}
                className="btn !py-1.5 !text-xs"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                追加家长改口备注
              </button>
              {role === 'supervisor' && (
                <>
                  <button
                    onClick={() => setShowRejudge(true)}
                    className="btn btn-amber !py-1.5 !text-xs"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    主管人工改判
                  </button>
                  <button
                    onClick={() => setShowBad(true)}
                    className="btn btn-danger !py-1.5 !text-xs"
                  >
                    <FileWarning className="w-3.5 h-3.5" />
                    标记坏数据
                  </button>
                </>
              )}
            </>
          )}
          {record.isBadData && role === 'supervisor' && (
            <button
              onClick={() => setShowUnmark(true)}
              className="btn !py-1.5 !text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              解除坏数据标记
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <div className="card p-5">
            <h3 className="font-serif text-sm font-semibold text-ink-700 mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              基本信息
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  儿童姓名
                </dt>
                <dd className="text-ink-800 font-medium">{record.childName}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  家长
                </dt>
                <dd className="text-ink-800 flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5 text-ink-400" />
                  {record.parentName}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  联系电话
                </dt>
                <dd className="text-ink-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-ink-400" />
                  {record.parentPhone}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  处理人
                </dt>
                <dd className="text-ink-800">{record.handler}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  原承诺日期
                </dt>
                <dd className="text-ink-800 flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-ink-400" />
                  {record.originalPromiseDate}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  当前状态
                </dt>
                <dd>
                  <StatusPill status={record.currentStatus} size="md" />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  录入方式
                </dt>
                <dd className="text-ink-800">
                  {record.sourceType === 'manual' ? '手工补录' : '文件导入'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="font-serif text-sm font-semibold text-ink-700 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              来源与时间
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  来源文件
                </dt>
                <dd className="text-ink-700 break-all text-xs bg-paper-100 p-2 rounded-sm border border-paper-200">
                  {record.sourceFile}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  创建时间
                </dt>
                <dd className="text-ink-800">{formatDateTime(record.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  最近更新
                </dt>
                <dd className="text-ink-800">{formatDateTime(record.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-400 mb-0.5">
                  变更次数
                </dt>
                <dd className="text-ink-800">
                  {record.changeLogs.length} 次（含原始承诺）
                </dd>
              </div>
              {record.isBadData && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-sm">
                  <dt className="text-[11px] uppercase tracking-wider text-red-600 mb-1 font-semibold flex items-center gap-1">
                    <FileWarning className="w-3 h-3" />
                    坏数据原因
                  </dt>
                  <dd className="text-sm text-red-700">
                    {record.badDataReason || '未填写'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-semibold text-ink-800 flex items-center gap-1.5">
                <History className="w-4 h-4" />
                完整变更时间线（日期倒序，原始承诺永不删除）
              </h3>
              <div className="text-[11px] text-ink-400">
                当前操作身份：
                <span className="text-ink-700 font-semibold ml-1 flex items-center gap-1 inline-flex">
                  {role === 'supervisor' ? (
                    <Shield className="w-3 h-3 text-amber-500" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {currentOperator}
                </span>
              </div>
            </div>
            <Timeline logs={record.changeLogs} />
          </div>
        </div>
      </div>

      {/* 追加备注 */}
      <Modal
        open={showNote}
        onClose={() => {
          setShowNote(false);
          setNote('');
          setNoteStatus('');
        }}
        title="追加家长改口备注"
        subtitle="填写家长最新的改口说明。原承诺不会被抹除，将完整保留在时间线中。"
      >
        <div className="space-y-4">
          <div>
            <label className="label">改口说明（必填）</label>
            <textarea
              rows={4}
              className="textarea"
              placeholder="例如：家长 6 月 7 日晚微信通知，原定 6 月 8 日的试听改至 6 月 15 日，理由是孩子生病..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div>
            <label className="label">同步更新状态（可选）</label>
            <select
              className="input"
              value={noteStatus}
              onChange={(e) => setNoteStatus(e.target.value as RecordStatus | '')}
            >
              <option value="">不改变当前状态（仅追加备注）</option>
              {(['promised', 'rescheduled', 'completed', 'cancelled'] as RecordStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ),
              )}
            </select>
            <p className="text-[11px] text-ink-400 mt-1">
              留空表示本次仅记录家长说明，不改变流程状态。
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="btn"
              onClick={() => {
                setShowNote(false);
                setNote('');
                setNoteStatus('');
              }}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={submitNote}
              disabled={!note.trim()}
            >
              <MessageSquarePlus className="w-4 h-4" />
              追加备注（保留原承诺）
            </button>
          </div>
        </div>
      </Modal>

      {/* 人工改判 */}
      <Modal
        open={showRejudge}
        onClose={() => {
          setShowRejudge(false);
          setRejudgeReason('');
        }}
        title="主管人工改判"
        subtitle="改判将覆盖旧状态作为当前状态，但旧状态与原承诺完整保留在时间线中，可随时复核。"
      >
        <div className="space-y-4">
          <div className="p-3 bg-paper-100 border border-paper-200 rounded-sm text-sm">
            当前状态：
            <span className="ml-2">
              <StatusPill status={record.currentStatus} />
            </span>
          </div>
          <div>
            <label className="label">改判为</label>
            <select
              className="input"
              value={rejudgeTo}
              onChange={(e) => setRejudgeTo(e.target.value as RecordStatus)}
            >
              {(['pending', 'promised', 'rescheduled', 'completed', 'cancelled'] as RecordStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label className="label">改判原因（必填，将写入历史）</label>
            <textarea
              rows={4}
              className="textarea"
              placeholder="例如：经复核家长已确认到店，流程已闭环，改判为已完成。"
              value={rejudgeReason}
              onChange={(e) => setRejudgeReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="btn"
              onClick={() => {
                setShowRejudge(false);
                setRejudgeReason('');
              }}
            >
              取消
            </button>
            <button
              className="btn btn-amber"
              onClick={submitRejudge}
              disabled={!rejudgeReason.trim()}
            >
              <Gavel className="w-4 h-4" />
              确认人工改判
            </button>
          </div>
        </div>
      </Modal>

      {/* 标记坏数据 */}
      <Modal
        open={showBad}
        onClose={() => {
          setShowBad(false);
          setBadReason('');
        }}
        title="标记为坏数据（隔离）"
        subtitle="该记录将在正常追踪列表中灰显，不再参与常规统计，但原始承诺与所有变更均保留可复核。"
      >
        <div className="space-y-4">
          <div>
            <label className="label">坏数据原因（必填，将写入历史）</label>
            <textarea
              rows={4}
              className="textarea"
              placeholder="例如：家长电话为空；日期字段非法；与其他记录重复..."
              value={badReason}
              onChange={(e) => setBadReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="btn"
              onClick={() => {
                setShowBad(false);
                setBadReason('');
              }}
            >
              取消
            </button>
            <button
              className="btn btn-danger"
              onClick={submitBad}
              disabled={!badReason.trim()}
            >
              <AlertTriangle className="w-4 h-4" />
              确认标记为坏数据
            </button>
          </div>
        </div>
      </Modal>

      {/* 解除坏数据 */}
      <Modal
        open={showUnmark}
        onClose={() => setShowUnmark(false)}
        title="解除坏数据标记"
        subtitle="记录将恢复为正常追踪状态，并回退至最近一次有效状态。"
      >
        <div className="space-y-4">
          <div className="p-3 bg-paper-100 border border-paper-200 rounded-sm text-sm">
            <p className="text-ink-500 text-xs mb-1">当前坏数据原因：</p>
            <p className="text-ink-800">{record.badDataReason || '未填写'}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn" onClick={() => setShowUnmark(false)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={submitUnmark}>
              <RotateCcw className="w-4 h-4" />
              确认解除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
