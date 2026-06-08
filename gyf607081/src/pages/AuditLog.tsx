import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Clock, User, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Database, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button, Tabs, Tag, message } from 'antd';
import { useCheckStore } from '../store/useCheckStore';
import {
  getAllAuditLogs,
  getAllServiceRestarts,
  getLostRecordsWithAudit,
  restoreFromAudit
} from '../services/auditService';
import { AuditTimeline } from '../components/AuditTimeline';
import {
  AuditLog as AuditLogType,
  ServiceRestart,
  AuditAction
} from '../types';

const AuditLogPage: React.FC = () => {
  const { initData, refreshData, simulateServiceRestart } = useCheckStore();

  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>([]);
  const [serviceRestarts, setServiceRestarts] = useState<ServiceRestart[]>([]);
  const [lostRecords, setLostRecords] = useState<Array<{
    recordId: string;
    babyId?: string;
    lastSnapshot: unknown;
    lastSeen: string;
    errorMessage?: string;
  }>>([]);
  const [expandedRestart, setExpandedRestart] = useState<string | null>(null);
  const [restartLoading, setRestartLoading] = useState(false);

  useEffect(() => {
    initData();
    loadData();
  }, [initData]);

  const loadData = () => {
    setAuditLogs(getAllAuditLogs());
    setServiceRestarts(getAllServiceRestarts());
    setLostRecords(getLostRecordsWithAudit());
  };

  const handleServiceRestart = async () => {
    setRestartLoading(true);
    try {
      const result = await simulateServiceRestart();
      message.success(
        `服务重启完成：成功 ${result.success.length} 条，失败 ${result.failed.length} 条`
      );
      if (result.failed.length > 0) {
        message.warning(
          `失败记录已保留审计快照：${result.failed.map(f => f.recordId).join(', ')}`
        );
      }
      loadData();
    } catch (error) {
      message.error('服务重启失败');
    } finally {
      setRestartLoading(false);
    }
  };

  const handleRestore = async (recordId: string) => {
    try {
      const restored = await restoreFromAudit(recordId);
      if (restored) {
        message.success('数据已从审计快照恢复');
        refreshData();
        loadData();
      } else {
        message.warning('未找到可恢复的审计快照');
      }
    } catch (error) {
      message.error('恢复失败');
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionText = (action: AuditAction) => {
    const map: Record<AuditAction, string> = {
      [AuditAction.CREATE]: '创建记录',
      [AuditAction.UPDATE]: '更新记录',
      [AuditAction.REJECT]: '拒绝',
      [AuditAction.REISSUE]: '补发',
      [AuditAction.MANUAL_ADD]: '手工补录',
      [AuditAction.EXPORT]: '导出数据',
      [AuditAction.SERVICE_RESTART]: '服务重启',
      [AuditAction.DATA_RESTORE]: '数据恢复'
    };
    return map[action];
  };

  const getStatusColor = (status: ServiceRestart['status']) => {
    const map = {
      processing: 'blue',
      partial_success: 'orange',
      completed: 'green',
      failed: 'red'
    };
    return map[status];
  };

  const getStatusText = (status: ServiceRestart['status']) => {
    const map = {
      processing: '处理中',
      partial_success: '部分成功',
      completed: '全部成功',
      failed: '全部失败'
    };
    return map[status];
  };

  const restartTab = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">服务重启记录</h3>
          <p className="text-sm text-slate-500 mt-1">
            服务重启时采用部分成功机制，失败数据单独标记并保留审计快照
          </p>
        </div>
        <Button
          type="primary"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={handleServiceRestart}
          loading={restartLoading}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 border-none"
        >
          模拟服务重启
        </Button>
      </div>

      {serviceRestarts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无服务重启记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {serviceRestarts.map((restart, index) => (
            <div
              key={restart.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              style={{
                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
              }}
            >
              <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedRestart(
                  expandedRestart === restart.id ? null : restart.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      restart.status === 'partial_success'
                        ? 'bg-amber-100'
                        : restart.status === 'completed'
                        ? 'bg-emerald-100'
                        : 'bg-red-100'
                    }`}>
                      {restart.status === 'processing' ? (
                        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                      ) : restart.status === 'partial_success' ? (
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      ) : restart.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          服务重启 #{restart.id.slice(-6)}
                        </span>
                        <Tag color={getStatusColor(restart.status)}>
                          {getStatusText(restart.status)}
                        </Tag>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(restart.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {restart.operator}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">处理统计</p>
                      <p className="font-semibold text-slate-800">
                        <span className="text-emerald-600">{restart.successCount}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-red-600">{restart.failCount}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span>{restart.totalRecords}</span>
                      </p>
                      <p className="text-xs text-slate-400">成功/失败/总计</p>
                    </div>
                    {expandedRestart === restart.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedRestart === restart.id && restart.failDetails && restart.failDetails.length > 0 && (
                <div className="p-4 bg-red-50 border-t border-red-200">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    处理失败的记录（审计快照已保留）
                  </h4>
                  <div className="space-y-2">
                    {restart.failDetails.map((fail, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-lg border border-red-200 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            记录ID: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{fail.recordId}</code>
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            失败原因: {fail.reason}
                          </p>
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(fail.recordId);
                          }}
                        >
                          从审计恢复
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const lostRecordsTab = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">历史丢失记录</h3>
        <p className="text-sm text-slate-500 mt-1">
          即使主数据丢失，审计快照仍保留，主管可随时复查或恢复
        </p>
      </div>

      {lostRecords.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
          <p className="text-lg font-medium">暂无丢失记录</p>
          <p className="text-sm">所有数据完整</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-red-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">
                    记录ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">
                    宝宝ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">
                    最后出现时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">
                    错误信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">
                    审计快照
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {lostRecords.map((record, index) => (
                  <tr key={record.recordId} className="bg-red-50/50">
                    <td className="px-4 py-3">
                      <code className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {record.recordId}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {record.babyId || '-'}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(record.lastSeen)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 max-w-xs">
                      {record.errorMessage}
                    </td>
                    <td className="px-4 py-3">
                      <Tag color="green">已保留</Tag>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="primary"
                        size="small"
                        icon={<Database className="w-3.5 h-3.5" />}
                        onClick={() => handleRestore(record.recordId)}
                      >
                        恢复
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          审计保障机制
        </h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• <strong>写时复制</strong>：每次操作前先保存快照到审计日志，再执行更新</li>
          <li>• <strong>部分成功</strong>：服务重启时每条记录单独事务，失败不影响其他</li>
          <li>• <strong>审计优先</strong>：即使业务处理失败，审计快照必须写入保留</li>
          <li>• <strong>数据恢复</strong>：主数据丢失时，可从审计快照完整恢复</li>
        </ul>
      </div>
    </div>
  );

  const allLogsTab = (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">全部审计日志</h3>
      <AuditTimeline logs={auditLogs} />
    </div>
  );

  const tabItems = [
    {
      key: 'restart',
      label: '服务重启记录',
      children: restartTab
    },
    {
      key: 'lost',
      label: `历史丢失记录 (${lostRecords.length})`,
      children: lostRecordsTab
    },
    {
      key: 'all',
      label: `全部审计日志 (${auditLogs.length})`,
      children: allLogsTab
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-bold text-slate-800"
          style={{ fontFamily: '"Noto Serif SC", serif' }}
        >
          审计日志
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          服务重启部分成功记录、历史丢失记录审计、所有操作追溯
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <p className="text-xs text-emerald-600 mb-1">服务重启</p>
          <p className="text-2xl font-bold text-emerald-700">{serviceRestarts.length}</p>
          <p className="text-xs text-emerald-500">次</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-600 mb-1">部分成功</p>
          <p className="text-2xl font-bold text-amber-700">
            {serviceRestarts.filter(r => r.status === 'partial_success').length}
          </p>
          <p className="text-xs text-amber-500">次</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200">
          <p className="text-xs text-red-600 mb-1">丢失记录</p>
          <p className="text-2xl font-bold text-red-700">{lostRecords.length}</p>
          <p className="text-xs text-red-500">条（已保留审计）</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-600 mb-1">审计日志</p>
          <p className="text-2xl font-bold text-blue-700">{auditLogs.length}</p>
          <p className="text-xs text-blue-500">条</p>
        </div>
      </div>

      <Tabs
        defaultActiveKey="restart"
        items={tabItems}
        className="bg-transparent"
      />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogPage;
