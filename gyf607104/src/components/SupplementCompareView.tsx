import React, { useState } from 'react';
import { GitCompare, ArrowRight, CheckCircle2, XCircle, FileImage, RefreshCw, Download, Upload, AlertTriangle } from 'lucide-react';
import type { HotSpotRecord, SupplementalRecord } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { exportSingleRecord, readImportedFile } from '@/utils/export';
import { checkRecordConsistency, validateSupplementalRecord } from '@/utils/consistency';
import { formatDesensitizedNumber } from '@/utils/desensitize';

interface SupplementCompareViewProps {
  record: HotSpotRecord;
  onExport?: () => void;
}

export const SupplementCompareView: React.FC<SupplementCompareViewProps> = ({
  record,
  onExport,
}) => {
  const [showDiff, setShowDiff] = useState(true);
  const [importedData, setImportedData] = useState<Record<string, unknown> | null>(null);
  const [consistencyCheckResult, setConsistencyCheckResult] = useState<string | null>(null);
  const { currentRole, canViewSensitiveData, canSupplement } = useAuthStore();
  
  const supplementalRecord = record.supplementalRecord;
  const validation = validateSupplementalRecord(record);
  
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      exportSingleRecord(record, {
        format: 'xlsx',
        includeSensitive: canViewSensitiveData(),
        role: currentRole,
      });
    }
  };
  
  const handleImportVerify = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const data = await readImportedFile(file);
      const importedRecord = data.find(r => r['记录ID'] === record.id);
      setImportedData(importedRecord || null);
      
      if (importedRecord) {
        const result = checkRecordConsistency(record, record, importedRecord);
        if (result.allMatch) {
          setConsistencyCheckResult(`✅ 数据一致性校验通过！记录 ${result.recordId} 在列表、详情和导出文件中完全一致。`);
        } else {
          setConsistencyCheckResult(`❌ 数据一致性校验失败：\n${result.errors.join('\n')}`);
        }
      } else {
        setConsistencyCheckResult(`⚠️ 未在导入文件中找到记录 ${record.id}`);
      }
    } catch (error) {
      setConsistencyCheckResult(`❌ 导入文件解析失败：${error}`);
    }
  };
  
  const diffEntries = supplementalRecord 
    ? Object.entries(supplementalRecord.diffFromOriginal)
    : [];
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-accent-gold" />
            <div>
              <span className="font-semibold text-primary-700">补录数据对比视图</span>
              {record.isManuallySupplemented && (
                <span className="badge supplemental-badge ml-2">
                  已补录
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${validation.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {validation.valid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {validation.valid ? '数据完整' : `${validation.issues.length}个问题`}
            </span>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="btn-secondary text-sm py-1.5 px-3"
            >
              {showDiff ? '隐藏对比' : '显示对比'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {!validation.valid && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">补录数据完整性检查发现以下问题：</p>
                <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                  {validation.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {showDiff && supplementalRecord && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              补录前后差异对比
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-3 pb-2 border-b border-gray-200">
                  补录前（原始数据）
                </div>
                <div className="space-y-3">
                  {diffEntries.map(([field, diff]) => (
                    <div key={field} className="text-sm">
                      <span className="text-gray-500">{field}:</span>
                      <span className={`ml-2 ${diff.old !== diff.new ? 'text-red-500 line-through' : 'text-gray-700'}`}>
                        {JSON.stringify(diff.old)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs font-medium text-green-600 mb-3 pb-2 border-b border-green-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  补录后（当前数据）
                </div>
                <div className="space-y-3">
                  {diffEntries.map(([field, diff]) => (
                    <div key={field} className="text-sm">
                      <span className="text-gray-500">{field}:</span>
                      <span className={`ml-2 font-medium ${diff.old !== diff.new ? 'text-green-600' : 'text-gray-700'}`}>
                        {JSON.stringify(diff.new)}
                      </span>
                      {diff.old !== diff.new && (
                        <ArrowRight className="inline w-4 h-4 mx-1 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">补录说明：</p>
              <p>{supplementalRecord.supplementalNote}</p>
              <p className="mt-2 text-xs">
                补录人：{supplementalRecord.supplementedBy} · 
                补录时间：{supplementalRecord.supplementedAt}
              </p>
            </div>
          </div>
        )}
        
        {record.isManuallySupplemented && supplementalRecord && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FileImage className="w-4 h-4" />
              补录复测截图
            </h4>
            <div className="flex gap-4 items-center p-4 bg-gradient-to-r from-amber-50 to-white rounded-lg border border-amber-200">
              <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border-2 border-accent-gold">
                <img
                  src={supplementalRecord.supplementalImageUrl}
                  alt="补录截图"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-2">
                  此截图为老何于 <span className="font-medium text-accent-gold">{supplementalRecord.supplementedAt}</span> 手工补录
                </p>
                <p className="text-xs text-gray-500">
                  用于验证补录前后差异对比及导出读回功能。请点击下方按钮测试导出后再导入，验证数据一致性。
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">数据一致性校验工具</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出此记录（验证导出）
            </button>
            
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              导入并验证一致性
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportVerify}
                className="hidden"
              />
            </label>
          </div>
          
          {consistencyCheckResult && (
            <div className={`mt-4 p-4 rounded-lg whitespace-pre-line ${
              consistencyCheckResult.includes('通过') 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : consistencyCheckResult.includes('失败')
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}>
              {consistencyCheckResult}
            </div>
          )}
        </div>
        
        {canViewSensitiveData() && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">敏感数据（仅管理员可见）</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500">组件成本:</span>
                <span className="ml-2 font-medium">
                  {formatDesensitizedNumber(record.sensitiveData.componentCost, currentRole, 'componentCost')}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500">维修成本:</span>
                <span className="ml-2 font-medium">
                  {formatDesensitizedNumber(record.sensitiveData.repairCost, currentRole, 'repairCost')}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500">供应商联系人:</span>
                <span className="ml-2 font-medium">
                  {record.sensitiveData.supplierContact}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded col-span-2">
                <span className="text-gray-500">内部备注:</span>
                <span className="ml-2">{record.sensitiveData.internalComments}</span>
              </div>
            </div>
          </div>
        )}
        
        {!canViewSensitiveData() && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">敏感数据（权限不足已脱敏）</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-500">组件成本:</span>
                <span className="ml-2 desensitized">********</span>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-500">维修成本:</span>
                <span className="ml-2 desensitized">********</span>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-500">供应商联系人:</span>
                <span className="ml-2 desensitized">********</span>
              </div>
              <div className="p-3 bg-gray-100 rounded col-span-2">
                <span className="text-gray-500">内部备注:</span>
                <span className="ml-2 desensitized">********************</span>
              </div>
            </div>
          </div>
        )}
        
        <div id="source-material-detail" className="mt-4 border-t border-gray-200 pt-4 transition-all duration-300">
          <h4 className="text-sm font-medium text-gray-700 mb-2">原始材料引用</h4>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>记录ID:</strong> {record.id} <span className="mx-2">|</span>
              <strong>一致性校验ID:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded">{record._consistencyCheckId}</code>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              刷新页面后，请验证列表、详情、导出文件中的记录ID和一致性校验ID是否保持一致。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
