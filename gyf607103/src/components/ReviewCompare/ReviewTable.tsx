import React, { useMemo, useState } from 'react';
import { useShadowStore } from '@/store/useShadowStore';
import { calculateRecordDiff, formatDiffValue, getDiffColorClass } from '@/utils/diffCalculator';
import { Clock, User, ArrowRight, Eye, EyeOff, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { exportToJSON, exportToCSV, downloadFile } from '@/utils/importExport';
import type { RoofShadowRecord } from '@/types';

export const ReviewTable: React.FC = () => {
  const { records, annotations, currentUser } = useShadowStore();
  const [showOnlyModified, setShowOnlyModified] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeRecords = useMemo(() => records.filter(r => !r.isDeleted), [records]);
  
  const displayRecords = useMemo(() => {
    if (showOnlyModified) {
      return activeRecords.filter(r => 
        r.shadowHours !== r.originalShadowHours || 
        r.powerEfficiency !== r.originalPowerEfficiency
      );
    }
    return activeRecords;
  }, [activeRecords, showOnlyModified]);

  const modifiedCount = useMemo(() => 
    activeRecords.filter(r => 
      r.shadowHours !== r.originalShadowHours || 
      r.powerEfficiency !== r.originalPowerEfficiency
    ).length, [activeRecords]);

  const stats = useMemo(() => {
    let totalShadowDiff = 0;
    let totalEfficiencyDiff = 0;
    
    displayRecords.forEach(record => {
      const diffs = calculateRecordDiff(record);
      diffs.forEach(diff => {
        if (diff.field === '阴影时长') {
          totalShadowDiff += diff.difference as number;
        } else if (diff.field === '发电效率') {
          totalEfficiencyDiff += diff.difference as number;
        }
      });
    });

    return {
      totalShadowDiff: Math.round(totalShadowDiff * 10) / 10,
      totalEfficiencyDiff: Math.round(totalEfficiencyDiff * 10) / 10,
    };
  }, [displayRecords]);

  const handleExport = (type: 'json' | 'csv', dataType: 'raw' | 'modified') => {
    const exportRecords = dataType === 'raw'
      ? activeRecords.map(r => ({ ...r, shadowHours: r.originalShadowHours, powerEfficiency: r.originalPowerEfficiency }))
      : activeRecords;

    const dateStr = new Date().toISOString().split('T')[0];
    const typeLabel = dataType === 'raw' ? '原始值' : '修正值';

    if (type === 'json') {
      const result = exportToJSON(exportRecords, annotations, dataType, currentUser);
      downloadFile(result.data, `复盘数据_${typeLabel}_${dateStr}.json`, 'application/json');
    } else {
      const csv = exportToCSV(exportRecords, dataType);
      downloadFile(csv, `复盘数据_${typeLabel}_${dateStr}.csv`, 'text/csv');
    }
    setShowExportMenu(false);
  };

  if (activeRecords.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        暂无数据，请先在主面板导入或录入数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-white rounded-lg border-2 border-primary-100 p-4">
            <div className="text-xs text-gray-500 mb-1">总记录数</div>
            <div className="text-2xl font-bold text-primary-700 font-mono">{activeRecords.length}</div>
          </div>
          <div className="bg-white rounded-lg border-2 border-warning-100 p-4">
            <div className="text-xs text-gray-500 mb-1">已修改记录</div>
            <div className="text-2xl font-bold text-warning-600 font-mono">{modifiedCount}</div>
          </div>
          <div className={`rounded-lg border-2 p-4 ${stats.totalShadowDiff > 0 ? 'bg-danger-50 border-danger-100' : 'bg-success-50 border-success-100'}`}>
            <div className="text-xs text-gray-500 mb-1">阴影时长总变化</div>
            <div className={`text-2xl font-bold font-mono ${stats.totalShadowDiff > 0 ? 'text-danger-600' : 'text-success-600'}`}>
              {formatDiffValue(stats.totalShadowDiff)}h
            </div>
          </div>
          <div className={`rounded-lg border-2 p-4 ${stats.totalEfficiencyDiff < 0 ? 'bg-danger-50 border-danger-100' : 'bg-success-50 border-success-100'}`}>
            <div className="text-xs text-gray-500 mb-1">发电效率总变化</div>
            <div className={`text-2xl font-bold font-mono ${stats.totalEfficiencyDiff < 0 ? 'text-danger-600' : 'text-success-600'}`}>
              {formatDiffValue(stats.totalEfficiencyDiff)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyModified(!showOnlyModified)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 rounded transition-colors ${
              showOnlyModified 
                ? 'bg-primary-600 text-white border-primary-600' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            {showOnlyModified ? <Eye size={16} /> : <EyeOff size={16} />}
            {showOnlyModified ? '仅显示修改' : '显示全部'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              <Download size={16} />
              导出复盘数据
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border-2 border-primary-200 rounded shadow-lg z-20 min-w-[200px]">
                <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">导出修正值（当前展示）</div>
                <button onClick={() => handleExport('json', 'modified')} className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 flex items-center gap-2">
                  <FileJson size={14} /> JSON 格式
                </button>
                <button onClick={() => handleExport('csv', 'modified')} className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 flex items-center gap-2">
                  <FileSpreadsheet size={14} /> CSV 格式
                </button>
                <div className="px-3 py-1.5 text-xs text-gray-500 border-t border-gray-100">导出原始值（不可修改，用于审计）</div>
                <button onClick={() => handleExport('json', 'raw')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                  <FileJson size={14} /> JSON 格式
                </button>
                <button onClick={() => handleExport('csv', 'raw')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                  <FileSpreadsheet size={14} /> CSV 格式
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border-2 border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">屋顶ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">建筑名称</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">记录日期</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100/50" colSpan={3}>
                  阴影时长 (小时)
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100/50" colSpan={3}>
                  发电效率 (%)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作人</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作时间</th>
              </tr>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">原始值</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">修正值</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">差异</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">原始值</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">修正值</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">差异</th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.map((record, index) => (
                <ReviewRow key={record.id} record={record} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {displayRecords.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {showOnlyModified 
            ? '当前没有被修改过的记录，所有数据都是原始值'
            : '没有数据记录'}
        </div>
      )}
    </div>
  );
};

const ReviewRow: React.FC<{ record: RoofShadowRecord; index: number }> = ({ record, index }) => {
  const diffs = calculateRecordDiff(record);
  const shadowDiff = diffs.find(d => d.field === '阴影时长');
  const efficiencyDiff = diffs.find(d => d.field === '发电效率');
  const hasChanges = diffs.length > 0;

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${hasChanges ? 'bg-warning-50/30' : ''}`}
      style={{
        animationDelay: `${index * 10}ms`,
        opacity: 0,
        animation: 'fadeInUp 0.3s ease-out forwards',
      }}
    >
      <td className="px-4 py-2">
        {hasChanges && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-100 text-warning-700">
            已修改
          </span>
        )}
      </td>
      <td className="px-4 py-2 text-sm font-mono text-gray-600">{record.roofId}</td>
      <td className="px-4 py-2 text-sm">{record.buildingName}</td>
      <td className="px-4 py-2 text-sm font-mono text-gray-600">{record.recordDate}</td>
      
      <td className="px-4 py-2 text-sm font-mono text-gray-400 italic">{record.originalShadowHours}</td>
      <td className={`px-4 py-2 text-sm font-mono font-semibold ${hasChanges ? 'text-primary-700' : 'text-gray-700'}`}>
        {record.shadowHours}
      </td>
      <td className="px-4 py-2 text-sm font-mono">
        {shadowDiff ? (
          <span className={getDiffColorClass(shadowDiff.difference as number, false)}>
            {formatDiffValue(shadowDiff.difference)}
          </span>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </td>
      
      <td className="px-4 py-2 text-sm font-mono text-gray-400 italic">{record.originalPowerEfficiency}%</td>
      <td className={`px-4 py-2 text-sm font-mono font-semibold ${hasChanges ? 'text-primary-700' : 'text-gray-700'}`}>
        {record.powerEfficiency}%
      </td>
      <td className="px-4 py-2 text-sm font-mono">
        {efficiencyDiff ? (
          <span className={getDiffColorClass(efficiencyDiff.difference as number, true)}>
            {formatDiffValue(efficiencyDiff.difference)}%
          </span>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </td>
      
      <td className="px-4 py-2 text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <User size={12} />
          {record.markedBy || '-'}
        </div>
      </td>
      <td className="px-4 py-2 text-sm">
        <div className="flex items-center gap-1 text-gray-500 text-xs font-mono">
          <Clock size={12} />
          {record.updatedAt ? new Date(record.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
        </div>
      </td>
    </tr>
  );
};
