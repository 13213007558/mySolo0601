import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, MapPin, Calendar, User, Tag, AlertTriangle, CheckCircle2, Clock, XCircle, Shield, RefreshCw } from 'lucide-react';
import { RecheckImageGallery } from '@/components/RecheckImageGallery';
import { VersionTimeline } from '@/components/VersionTimeline';
import { SupplementCompareView } from '@/components/SupplementCompareView';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDesensitizedNumber } from '@/utils/desensitize';
import { exportSingleRecord } from '@/utils/export';
import { generateConsistencyReport, validateSupplementalRecord } from '@/utils/consistency';
import type { HotSpotLevel, RecordStatus } from '@/types';

export const InspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecordById, records, selectRecord, selectedRecordId } = useInspectionStore();
  const { currentRole, canViewSensitiveData, canExport } = useAuthStore();
  
  const record = id ? getRecordById(id) : undefined;
  const rawRecord = records.find(r => r.id === id);
  
  useEffect(() => {
    if (id) {
      selectRecord(id);
    }
    return () => selectRecord(null);
  }, [id, selectRecord]);
  
  useEffect(() => {
    console.debug('页面加载 - 记录ID:', id);
    console.debug('列表中的记录ID:', records.map(r => r.id).join(', '));
    console.debug('详情页获取的记录:', record?.id);
    console.debug('一致性校验ID:', record?._consistencyCheckId);
  }, [id, record, records]);
  
  const handleExport = () => {
    if (record && canExport()) {
      exportSingleRecord(record, {
        format: 'xlsx',
        includeSensitive: canViewSensitiveData(),
        role: currentRole,
      });
    }
  };
  
  const handleShowConsistencyReport = () => {
    if (id) {
      const report = generateConsistencyReport(id);
      alert(report);
    }
  };
  
  const getLevelBadge = (level: HotSpotLevel) => {
    const styles = {
      '严重': 'bg-red-100 text-red-700 border-red-200',
      '中等': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      '轻微': 'bg-green-100 text-green-700 border-green-200',
    };
    const icons = {
      '严重': <AlertTriangle className="w-4 h-4" />,
      '中等': <AlertTriangle className="w-4 h-4" />,
      '轻微': <CheckCircle2 className="w-4 h-4" />,
    };
    return (
      <span className={`badge border ${styles[level]} flex items-center gap-1.5`}>
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
      '待处理': <Clock className="w-4 h-4" />,
      '处理中': <Clock className="w-4 h-4" />,
      '已完成': <CheckCircle2 className="w-4 h-4" />,
      '已撤回': <XCircle className="w-4 h-4" />,
    };
    return (
      <span className={`badge border ${styles[status]} flex items-center gap-1.5`}>
        {icons[status]}
        {status}
      </span>
    );
  };
  
  if (!record) {
    return (
      <div className="card p-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">记录不存在</h3>
        <p className="text-gray-500 mb-6">未找到ID为 {id} 的巡检记录</p>
        <button
          onClick={() => navigate('/inspection')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
      </div>
    );
  }
  
  const validation = validateSupplementalRecord(record);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/inspection')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleShowConsistencyReport}
            className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3"
          >
            <Shield className="w-4 h-4" />
            一致性校验
          </button>
          {canExport() && (
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2 text-sm py-1.5 px-3"
            >
              <Download className="w-4 h-4" />
              导出记录
            </button>
          )}
        </div>
      </div>
      
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-primary-700 font-display">
                巡检记录详情
              </h2>
              <span className="font-mono text-lg text-gray-500 bg-gray-100 px-3 py-1 rounded">
                {record.id}
              </span>
              {record.isManuallySupplemented && (
                <span className="badge supplemental-badge animate-pulse-slow">
                  老何手工补录
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              一致性校验ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{record._consistencyCheckId}</code>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getLevelBadge(record.hotSpotLevel)}
            {getStatusBadge(record.status)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InfoItem
            icon={<MapPin className="w-4 h-4" />}
            label="电站名称"
            value={record.stationName}
          />
          <InfoItem
            icon={<MapPin className="w-4 h-4" />}
            label="具体位置"
            value={record.location}
          />
          <InfoItem
            icon={<Tag className="w-4 h-4" />}
            label="组件编号"
            value={record.componentId}
            isMono
          />
          <InfoItem
            icon={<Tag className="w-4 h-4" />}
            label="报价版本"
            value={record.supplierQuoteVersion}
            isMono
          />
          <InfoItem
            icon={<Calendar className="w-4 h-4" />}
            label="检测日期"
            value={record.detectedDate}
          />
          <InfoItem
            icon={<Calendar className="w-4 h-4" />}
            label="处理日期"
            value={record.processedDate || '未处理'}
          />
          <InfoItem
            icon={<User className="w-4 h-4" />}
            label="处理人"
            value={record.processedBy}
          />
          <InfoItem
            icon={<User className="w-4 h-4" />}
            label="补录人"
            value={record.supplementedBy || '无'}
            highlight={!!record.supplementedBy}
          />
        </div>
        
        {record.supplementedAt && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <span className="font-medium">补录时间:</span> {record.supplementedAt}
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                原始撤回理由
              </div>
              {canViewSensitiveData() ? (
                <p className="text-sm text-gray-700 line-through">{record.originalWithdrawReason}</p>
              ) : (
                <p className="text-sm desensitized">***</p>
              )}
            </div>
            
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="text-xs text-primary-600 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                当前撤回理由
              </div>
              {canViewSensitiveData() ? (
                <p className="text-sm font-medium text-primary-700">{record.currentWithdrawReason}</p>
              ) : (
                <p className="text-sm desensitized">***</p>
              )}
            </div>
          </div>
          
          {canViewSensitiveData() && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5" />
                内部字段编码 (仅管理员可见)
                <span className="font-mono text-gray-700 ml-auto">{record.internalFieldCode}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {rawRecord && (
        <RecheckImageGallery
          recordId={record.id}
          images={rawRecord.recheckImages}
          versionHistory={rawRecord.versionHistory}
          initiallyExpanded={rawRecord.isManuallySupplemented}
          showInternalFields={canViewSensitiveData()}
        />
      )}
      
      {rawRecord && (
        <VersionTimeline
          versionHistory={rawRecord.versionHistory}
          showSensitiveContent={canViewSensitiveData()}
        />
      )}
      
      {rawRecord && rawRecord.isManuallySupplemented && (
        <SupplementCompareView
          record={rawRecord}
          onExport={handleExport}
        />
      )}
      
      <div className="card p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Shield className="w-4 h-4" />
            当前查看身份: <span className="font-medium text-primary-600">{useAuthStore.getState().userName}</span>
            {!canViewSensitiveData() && (
              <span className="text-gray-400">（敏感内容已按角色权限脱敏）</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4" />
            刷新页面后验证列表、详情、导出ID是否一致
          </div>
        </div>
      </div>
    </div>
  );
};

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isMono?: boolean;
  highlight?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, isMono = false, highlight = false }) => {
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      highlight 
        ? 'bg-amber-50 border-amber-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className={`text-xs mb-1.5 flex items-center gap-1.5 ${
        highlight ? 'text-amber-600' : 'text-gray-500'
      }`}>
        {icon}
        {label}
      </div>
      <p className={`text-sm font-medium ${
        highlight ? 'text-amber-700' : 'text-gray-800'
      } ${isMono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
};
