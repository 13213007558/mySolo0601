import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { ANOMALY_LABELS, type User, type RescheduleRecord } from '@/types';
import type { NavKey } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

type TabKey = 'pending' | 'cross_shift';

export default function ApprovalPage() {
  const navigate = useNavigate();
  const {
    init,
    currentUser,
    switchUser,
    records,
    loadRecords,
    approveRecord,
    rejectRecord,
    updateRecordStatus,
    loading,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  useEffect(() => {
    const initialize = async () => {
      await init();
    };
    initialize();
  }, [init]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'supervisor') {
      const state = useAppStore.getState();
      state.accessDeniedInfo = {
        recordId: '',
        babyName: '',
        reason: '仅护理主管可进入审批处理页面',
      };
      useAppStore.setState({ accessDeniedInfo: state.accessDeniedInfo });
      navigate('/access-denied');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser) {
      loadRecords();
    }
  }, [currentUser, loadRecords]);

  const handleNavChange = (key: NavKey) => {
    switch (key) {
      case 'list':
        navigate('/');
        break;
      case 'new':
        navigate('/records/new');
        break;
      case 'approve':
        break;
      case 'import':
        navigate('/records/import');
        break;
      case 'export':
        navigate('/export');
        break;
    }
  };

  const handleUserSwitch = (user: User) => {
    switchUser(user.id);
  };

  const handleApprove = async (record: RescheduleRecord) => {
    try {
      await approveRecord(record.id);
      await loadRecords();
    } catch {
      // error handled in store
    }
  };

  const handleReject = async (record: RescheduleRecord) => {
    const reason = window.prompt('请输入驳回原因：');
    if (!reason) return;
    try {
      await rejectRecord(record.id, reason);
      await loadRecords();
    } catch {
      // error handled in store
    }
  };

  const handleConfirmCrossShift = async (record: RescheduleRecord) => {
    try {
      await updateRecordStatus(record.id, 'approved', '跨班已确认');
      await loadRecords();
    } catch {
      // error handled in store
    }
  };

  const handleViewDetail = (record: RescheduleRecord) => {
    // TODO: navigate to detail page when implemented
    alert(`查看记录详情：${record.babyName}（${record.babyId}）`);
  };

  const filteredRecords = records.filter((r) =>
    activeTab === 'pending' ? r.status === 'pending' : r.status === 'cross_shift'
  );

  if (!currentUser) return null;

  return (
    <Layout
      user={currentUser}
      activeNav="approve"
      onNavChange={handleNavChange}
      onUserSwitch={handleUserSwitch}
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">审批处理</h1>
        </div>

        <div className="mb-4 border-b border-gray-200">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'pending'
                  ? 'border-ink-blue text-ink-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              待审批
            </button>
            <button
              onClick={() => setActiveTab('cross_shift')}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'cross_shift'
                  ? 'border-ink-blue text-ink-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              跨班待确认
            </button>
          </nav>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500">暂无待审批记录</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      宝宝姓名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      班次变动
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      处理人
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      提交时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      异常提示
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record, idx) => (
                    <tr
                      key={record.id}
                      className={cn(
                        'hover:bg-ink-blue/5 transition-colors',
                        idx % 2 === 1 && 'bg-gray-50/50'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.babyName}
                          </div>
                          <div className="text-xs text-gray-500">{record.babyId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="text-right">
                            <div className="text-gray-900">{record.originalShift}</div>
                            <div className="text-xs text-gray-500">{record.originalDate}</div>
                          </div>
                          <ArrowRight className="h-[14px] w-[14px] text-gray-400 flex-shrink-0" />
                          <div>
                            <div className="text-gray-900">{record.targetShift}</div>
                            <div className="text-xs text-gray-500">{record.targetDate}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{record.handlerName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {record.anomaly && record.anomaly.type !== 'none' ? (
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle
                              className={cn(
                                'h-[14px] w-[14px] mt-0.5 flex-shrink-0',
                                record.anomaly.type === 'cross_shift_conflict'
                                  ? 'text-status-yellow'
                                  : 'text-status-red'
                              )}
                            />
                            <div>
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  record.anomaly.type === 'cross_shift_conflict'
                                    ? 'text-status-yellow'
                                    : 'text-status-red'
                                )}
                              >
                                {ANOMALY_LABELS[record.anomaly.type]}
                              </span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {record.anomaly.message}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <StatusBadge status={record.status} />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {activeTab === 'pending' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<CheckCircle className="h-[14px] w-[14px]" />}
                                onClick={() => handleApprove(record)}
                                disabled={loading}
                              >
                                通过
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<XCircle className="h-[14px] w-[14px]" />}
                                onClick={() => handleReject(record)}
                                disabled={loading}
                                className="text-status-red hover:bg-status-red/10 hover:text-status-red"
                              >
                                驳回
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<CheckCircle className="h-[14px] w-[14px]" />}
                              onClick={() => handleConfirmCrossShift(record)}
                              disabled={loading}
                            >
                              确认跨班
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="h-[14px] w-[14px]" />}
                            onClick={() => handleViewDetail(record)}
                          >
                            详情
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
