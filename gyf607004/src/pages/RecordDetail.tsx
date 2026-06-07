import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ShieldAlert, Send } from 'lucide-react';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import AnomalyAlert from '@/components/AnomalyAlert';
import StatusBadge from '@/components/StatusBadge';
import Timeline from '@/components/Timeline';
import Button from '@/components/Button';
import { AuthService } from '@/services/AuthService';
import { AuditService } from '@/services/AuditService';
import { RescheduleRecord, AuditLog, User } from '@/types';
import type { NavKey } from '@/components/Sidebar';

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    init,
    currentUser,
    switchUser,
    checkRecordAccess,
    approveRecord,
    rejectRecord,
    isolateRecord,
    addNoteToRecord,
    loading,
  } = useAppStore();

  const [activeNav, setActiveNav] = useState<NavKey>('list');
  const [record, setRecord] = useState<RescheduleRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await init();
    };
    initialize();
  }, [init]);

  useEffect(() => {
    if (!id || !currentUser) return;

    const verifyAccess = async () => {
      const result = await checkRecordAccess(id);
      if (!result.allowed) {
        navigate('/access-denied');
        return;
      }
      if (result.record) {
        setRecord(result.record);
        const logs = await AuditService.getLogsByRecord(id);
        setAuditLogs(logs);
      }
      setAccessChecked(true);
    };

    verifyAccess();
  }, [id, currentUser, checkRecordAccess, navigate]);

  const handleNavChange = (key: NavKey) => {
    setActiveNav(key);
    if (key === 'list') {
      navigate('/records');
    } else if (key === 'new') {
      navigate('/records/new');
    } else if (key === 'approve') {
      navigate('/approvals');
    } else if (key === 'import') {
      navigate('/import');
    }
  };

  const handleUserSwitch = async (user: User) => {
    await switchUser(user.id);
  };

  const handleBack = () => {
    navigate('/records');
  };

  const canPerformAction = (): boolean => {
    if (!currentUser || !record) return false;
    return AuthService.canApprove(currentUser) || AuthService.canEditRecord(currentUser, record);
  };

  const handleApprove = async () => {
    if (!id || !record) return;
    setActionLoading(true);
    try {
      await approveRecord(id);
      const updatedRecord = { ...record, status: 'approved' as const };
      setRecord(updatedRecord);
      const logs = await AuditService.getLogsByRecord(id);
      setAuditLogs(logs);
    } catch {
      //
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !record) return;
    const reason = window.prompt('请输入驳回原因：');
    if (!reason || reason.trim() === '') return;
    setActionLoading(true);
    try {
      await rejectRecord(id, reason.trim());
      const updatedRecord = { ...record, status: 'rejected' as const };
      setRecord(updatedRecord);
      const logs = await AuditService.getLogsByRecord(id);
      setAuditLogs(logs);
    } catch {
      //
    } finally {
      setActionLoading(false);
    }
  };

  const handleIsolate = async () => {
    if (!id || !record) return;
    const reason = window.prompt('请输入隔离原因：');
    if (!reason || reason.trim() === '') return;
    setActionLoading(true);
    try {
      await isolateRecord(id, reason.trim());
      const updatedRecord = { ...record, isIsolated: true };
      setRecord(updatedRecord);
      const logs = await AuditService.getLogsByRecord(id);
      setAuditLogs(logs);
    } catch {
      //
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;
    setSubmittingNote(true);
    try {
      await addNoteToRecord(id, noteText.trim());
      setNoteText('');
      if (record) {
        setRecord({
          ...record,
          latestNote: noteText.trim(),
          latestNoteAt: new Date().toISOString(),
          latestNoteBy: currentUser?.name,
        });
      }
      const logs = await AuditService.getLogsByRecord(id);
      setAuditLogs(logs);
    } catch {
      //
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!currentUser || !accessChecked) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  return (
    <Layout
      user={currentUser}
      activeNav={activeNav}
      onNavChange={handleNavChange}
      onUserSwitch={handleUserSwitch}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={handleBack}
            >
              返回
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">记录详情</h1>
            {record && <StatusBadge status={record.status} />}
          </div>
          {canPerformAction() && record && record.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={handleApprove}
                loading={actionLoading}
              >
                通过
              </Button>
              <Button
                variant="danger"
                size="md"
                icon={<XCircle className="h-4 w-4" />}
                onClick={handleReject}
                loading={actionLoading}
              >
                驳回
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<ShieldAlert className="h-4 w-4" />}
                onClick={handleIsolate}
                loading={actionLoading}
              >
                隔离
              </Button>
            </div>
          )}
        </div>

        {record && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <AnomalyAlert anomaly={record.anomaly} isIsolated={record.isIsolated} />

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">基础信息</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">宝宝姓名</div>
                    <div className="text-sm font-medium text-gray-900">{record.babyName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">宝宝编号</div>
                    <div className="text-sm text-gray-700">{record.babyId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">原班次</div>
                    <div className="text-sm text-gray-900">{record.originalShift}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">原日期</div>
                    <div className="text-sm text-gray-700">{record.originalDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">改期班次</div>
                    <div className="text-sm text-gray-900">{record.targetShift}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">改期日期</div>
                    <div className="text-sm text-gray-700">{record.targetDate}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500 mb-1">改期原因</div>
                    <div className="text-sm text-gray-700">{record.reason}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">来源信息</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">来源文件名</div>
                    <div className="text-sm text-gray-900">{record.sourceFileName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">上传时间</div>
                    <div className="text-sm text-gray-700">
                      {new Date(record.sourceUploadedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">处理人</div>
                    <div className="text-sm text-gray-900">{record.handlerName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">当前状态</div>
                    <StatusBadge status={record.status} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">最近人工说明</h2>
                {record.latestNote ? (
                  <div>
                    <div className="text-sm text-gray-700 mb-2">{record.latestNote}</div>
                    <div className="text-xs text-gray-400">
                      {record.latestNoteBy} ·{' '}
                      {record.latestNoteAt &&
                        new Date(record.latestNoteAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">暂无说明</div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">追加备注</h2>
                <div className="space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="请输入备注说明..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ink-blue/30 focus:border-ink-blue resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="md"
                      icon={<Send className="h-4 w-4" />}
                      onClick={handleAddNote}
                      loading={submittingNote}
                      disabled={!noteText.trim()}
                    >
                      添加说明
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">操作轨迹</h2>
                {loading && auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">加载中...</div>
                ) : (
                  <Timeline logs={auditLogs} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
