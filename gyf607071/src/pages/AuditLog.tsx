import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Eye,
  Download,
  Plus,
  ShieldAlert,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  User,
  Filter,
  ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';
import { AuditLog } from '@/types';

const actionLabels: Record<AuditLog['action'], string> = {
  view_detail: '查看详情',
  view_photo: '查看照片',
  export: '导出数据',
  supplement: '手工补录',
  unauthorized_access: '越权访问',
};

const roleLabels: Record<string, string> = {
  elder: '老人',
  parent: '父母',
  manager: '店长',
  supervisor: '主管',
};

export default function AuditLogPage() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const auditLogs = useStore((s) => s.auditLogs);
  const canViewAudit = useStore((s) => s.canViewAudit());

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  if (!canViewAudit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-800 mb-2">
            无权访问
          </h2>
          <p className="text-gray-500 mb-6">
            您没有权限查看审计日志
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-xl bg-medical-500 text-white hover:bg-medical-600 transition-colors"
          >
            返回排程板
          </button>
        </div>
      </div>
    );
  }

  const stats = useMemo(() => {
    const success = auditLogs.filter((l) => l.result === 'success').length;
    const denied = auditLogs.filter((l) => l.result === 'denied').length;
    const partial = auditLogs.filter((l) => l.result === 'partial').length;
    return { total: auditLogs.length, success, denied, partial };
  }, [auditLogs]);

  const resultConfig = {
    success: { icon: CheckCircle, label: '成功', color: 'text-emerald-600 bg-emerald-50' },
    denied: { icon: XCircle, label: '拒绝', color: 'text-red-600 bg-red-50' },
    partial: { icon: MinusCircle, label: '部分', color: 'text-amber-600 bg-amber-50' },
  };

  const getActionIcon = (action: AuditLog['action']) => {
    switch (action) {
      case 'view_detail':
      case 'view_photo':
        return Eye;
      case 'export':
        return Download;
      case 'supplement':
        return Plus;
      default:
        return ShieldAlert;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-medical-50/30">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">
            审计日志
          </h1>
          <p className="text-gray-500">
              所有操作记录与越权访问记录，方便主管复查
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">总记录数</p>
            <p className="font-serif text-3xl font-bold text-gray-900">
              {stats.total}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-emerald-600 mb-1">成功操作</p>
            <p className="font-serif text-3xl font-bold text-emerald-700">
              {stats.success}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-red-600 mb-1">拒绝访问</p>
            <p className="font-serif text-3xl font-bold text-red-700">
              {stats.denied}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-amber-600 mb-1">部分权限</p>
            <p className="font-serif text-3xl font-bold text-amber-700">
              {stats.partial}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">全部操作</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">全部角色</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="ml-auto text-sm text-gray-500">
              共 {auditLogs.length} 条记录
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {auditLogs.map((log, idx) => {
              const ResultIcon = resultConfig[log.result].icon;
              const ActionIcon = getActionIcon(log.action);
              return (
                <div
                  key={log.id}
                  className="p-5 hover:bg-gray-50/50 transition-colors animate-slide-up"
                  style={{ animationDelay: (idx * 30) + 'ms' }}
                >
                  <div className="flex items-start gap-4">
                    <div className={'w-10 h-10 rounded-xl ' + resultConfig[log.result].color + ' flex items-center justify-center flex-shrink-0'}>
                      <ResultIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <ActionIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-800">
                            {actionLabels[log.action]}
                          </span>
                        </div>
                        {log.targetName && (
                          <span className="px-2.5 py-0.5 rounded-full bg-medical-50 text-medical-700 text-xs font-medium">
                            {log.targetName}
                          </span>
                        )}
                        <span
                          className={'px-2.5 py-0.5 rounded-full text-xs font-medium ' + resultConfig[log.result].color}
                        >
                          {resultConfig[log.result].label}
                        </span>
                      </div>

                      {log.detail && (
                        <p className="text-sm text-gray-600 mb-2">{log.detail}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {log.userName}
                          <span className="text-gray-400">({roleLabels[log.userRole] || log.userRole})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {log.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
