import React, { useEffect } from 'react';
import { useShadowStore } from '@/store/useShadowStore';
import { ReviewTable } from '@/components/ReviewCompare/ReviewTable';
import { SaveStatus } from '@/components/SaveStatus/SaveStatus';
import { FileText, AlertCircle } from 'lucide-react';

export const ReviewPage: React.FC = () => {
  const { records, loadFromStorage } = useShadowStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const modifiedCount = records.filter(r => 
    r.shadowHours !== r.originalShadowHours || 
    r.powerEfficiency !== r.originalPowerEfficiency
  ).length;

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">数据复盘对比</h1>
          <p className="text-sm text-gray-500 mt-1">
            保留原始值记录，所有修改可追溯，解决导出数字与卡片不一致问题
          </p>
        </div>
        <SaveStatus />
      </div>

      {modifiedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg text-warning-700 text-sm">
          <AlertCircle size={16} />
          <span>
            当前有 <strong>{modifiedCount}</strong> 条记录已被修改。导出时可选择"原始值"版本以确保数据一致性。
          </span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">关于原始值保留</p>
            <p className="text-blue-700">
              每条数据记录同时保存"原始值"和"修正值"两个版本。原始值为数据首次录入时的值，永不修改；
              修正值为当前展示的值，可通过表格编辑修改。导出时可选择导出哪个版本，
              解决了"卡片展示值"与"导出值"不一致的问题。
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <ReviewTable />
      </div>
    </div>
  );
};
