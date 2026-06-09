import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, FileText, Camera, Shield, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { HotSpotRecord, HotSpotLevel, RecordStatus, UserRole } from '@/types';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { desensitizeRecords, formatDesensitizedNumber } from '@/utils/desensitize';
import { exportToExcel } from '@/utils/export';

export const InspectionTable: React.FC = () => {
  const navigate = useNavigate();
  const { filteredRecords, filters } = useInspectionStore();
  const { currentRole, canViewSensitiveData, canExport } = useAuthStore();
  
  const handleExportAll = () => {
    exportToExcel(filteredRecords, {
      format: 'xlsx',
      includeSensitive: canViewSensitiveData(),
      role: currentRole,
    });
  };
  
  const getLevelBadge = (level: HotSpotLevel) => {
    const styles = {
      '严重': 'bg-red-100 text-red-700 border-red-200',
      '中等': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      '轻微': 'bg-green-100 text-green-700 border-green-200',
    };
    const icons = {
      '严重': <AlertTriangle className="w-3.5 h-3.5" />,
      '中等': <AlertTriangle className="w-3.5 h-3.5" />,
      '轻微': <CheckCircle2 className="w-3.5 h-3.5" />,
    };
    return (
      <span className={`badge border ${styles[level]}`}>
        {icons[level]}
        {level}
      </span>
    );
  };
  
  const getStatusBadge = (status: RecordStatus) => {
    const styles = {
      '待处理': 'bg-gray-100 text-gray-700 border-gray-200',
      '处理中': 'bg-blue-100 text-blue-700 border-blue-200',
      '已完成': 'bg-green-100 text-green-700 border-green-200',
      '已撤回': 'bg-red-100 text-red-700 border-red-200',
    };
    const icons = {
      '待处理': <Clock className="w-3.5 h-3.5" />,
      '处理中': <Clock className="w-3.5 h-3.5" />,
      '已完成': <CheckCircle2 className="w-3.5 h-3.5" />,
      '已撤回': <XCircle className="w-3.5 h-3.5" />,
    };
    return (
      <span className={`badge border ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };
  
  const hasActiveFilters = Object.values(filters).some(v => 
    typeof v === 'string' ? v !== '' : v !== null
  );
  
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-lg text-primary-700">
            巡检记录列表
          </h3>
          <span className="badge bg-primary-100 text-primary-700">
            {filteredRecords.length} 条记录
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-gray-500">
              (已筛选)
            </span>
          )}
        </div>
        {canExport() && (
          <button
            onClick={handleExportAll}
            className="btn-primary flex items-center gap-2 text-sm py-1.5 px-3"
          >
            <Download className="w-4 h-4" />
            导出当前视图
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                记录ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                组件编号
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                电站/位置
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                等级
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                检测日期
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                报价版本
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                成本估算
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                复测图
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.map((record, index) => (
              <tr
                key={record.id}
                className={`hover:bg-primary-50/50 transition-colors ${
                  record.isManuallySupplemented ? 'bg-amber-50/30' : ''
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-primary-700">
                      {record.id}
                    </span>
                    {record.isManuallySupplemented && (
                      <span className="badge supplemental-badge text-[10px]">
                        补录
                      </span>
                    )}
                  </div>
                  {canViewSensitiveData() && (
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {record.internalFieldCode}
                    </div>
                  )}
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-800">{record.componentId}</span>
                </td>
                
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-800">{record.stationName}</div>
                  <div className="text-xs text-gray-500">{record.location}</div>
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  {getLevelBadge(record.hotSpotLevel)}
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(record.status)}
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {record.detectedDate}
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-mono text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    {record.supplierQuoteVersion}
                  </span>
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-700">
                    {formatDesensitizedNumber(
                      record.sensitiveData.componentCost + record.sensitiveData.repairCost,
                      currentRole,
                      'componentCost'
                    )}
                  </span>
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {record.recheckImages.length}张
                    </span>
                    {record.recheckImages.some(img => img.isSupplemental) && (
                      <span className="w-2 h-2 rounded-full bg-accent-gold" />
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => navigate(`/inspection/${record.id}`)}
                      className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canExport() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToExcel([record], {
                            format: 'xlsx',
                            includeSensitive: canViewSensitiveData(),
                            role: currentRole,
                          });
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="导出此记录"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredRecords.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无符合条件的记录</p>
            <p className="text-sm mt-1">请尝试调整筛选条件</p>
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          当前以 <span className="font-medium text-primary-600">{useAuthStore.getState().userName}</span> 身份查看
          {!canViewSensitiveData() && (
            <span className="text-gray-400">（敏感内容已脱敏）</span>
          )}
        </div>
        <div className="text-xs text-gray-400 font-mono">
          一致性校验ID: {filteredRecords[0]?._consistencyCheckId || 'N/A'}
        </div>
      </div>
    </div>
  );
};
