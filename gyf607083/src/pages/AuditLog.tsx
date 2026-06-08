import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  User, 
  UserX, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Filter,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ROLE_LABELS, AuditLog } from '../../shared/types';

const OPERATION_TYPE_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  export: '导出'
};

export const AuditLogPage: React.FC = () => {
  const { auditLogs, loading, loadAuditLogs, refreshKey, currentRole } = useStore();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [refreshKey]);

  const entityTypes = Array.from(new Set(auditLogs.map(log => log.entityType)));
  
  const filteredLogs = entityTypeFilter === 'all' 
    ? auditLogs 
    : auditLogs.filter(log => log.entityType === entityTypeFilter);

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">审计日志</h2>
        <p className="text-gray-500">查看所有操作记录，处理人缺失的记录会保留以便主管复查</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{auditLogs.length}</p>
              <p className="text-sm text-gray-500">总操作数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {auditLogs.filter(l => l.success).length}
              </p>
              <p className="text-sm text-gray-500">成功操作</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {auditLogs.filter(l => !l.success).length}
              </p>
              <p className="text-sm text-gray-500">失败操作</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <UserX className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {auditLogs.filter(l => !l.operatorId).length}
              </p>
              <p className="text-sm text-gray-500">处理人缺失</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <UserX className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-800">
            <p className="font-medium mb-1">处理人缺失记录说明</p>
            <p>
              审计日志中处理人缺失的记录（operatorId 为 null）会被完整保留，不会因处理人信息缺失而删除。
              这些记录会用橙色标记，方便主管进行复查。即使处理人信息无法获取，
              操作时间、IP地址、请求参数和响应结果都会被完整记录。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            操作记录列表
          </h3>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部类型</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {loading.auditLogs ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-12">暂无审计记录</p>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  !log.operatorId 
                    ? 'border-orange-200 bg-orange-50/30' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        log.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {log.success ? (
                          <CheckCircle className={`w-5 h-5 ${log.success ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">
                            {OPERATION_TYPE_LABELS[log.operationType] || log.operationType}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {log.entityType}
                          </span>
                          {!log.operatorId && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs flex items-center gap-1">
                              <UserX size={12} />
                              处理人缺失
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(log.timestamp).toLocaleString('zh-CN')}
                          </span>
                          <span className="flex items-center gap-1">
                            {log.operatorId ? (
                              <>
                                <User size={12} />
                                {log.operatorName || log.operatorId}
                                {log.operatorRole && ` (${ROLE_LABELS[log.operatorRole]})`}
                              </>
                            ) : (
                              <>
                                <UserX size={12} className="text-orange-500" />
                                <span className="text-orange-600">处理人信息缺失，请联系主管复查</span>
                              </>
                            )}
                          </span>
                          <span>IP: {log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!log.success && log.errorMessage && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          {log.errorMessage}
                        </span>
                      )}
                      {expandedLog === log.id ? (
                        <ChevronDown size={20} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedLog === log.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Eye size={14} />
                          请求参数
                        </h4>
                        <pre className="bg-white p-3 rounded-lg text-xs overflow-auto max-h-48 border border-gray-200">
                          {formatJson(log.requestParams)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Eye size={14} />
                          响应数据
                        </h4>
                        <pre className="bg-white p-3 rounded-lg text-xs overflow-auto max-h-48 border border-gray-200">
                          {formatJson(log.responseData)}
                        </pre>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>隐私处理说明：</strong>
                        以上请求参数和响应数据中的隐私字段已根据您的角色（{ROLE_LABELS[currentRole]}）进行过滤处理。
                        主管角色可查看完整数据，客服和普通员工角色会看到脱敏后的数据。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
