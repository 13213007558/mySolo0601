import { useCallback, useMemo, useState } from 'react';
import { useAlarmStore } from '../stores/useAlarmStore';
import type { Alarm, ExportOptions } from '../types';
import { maskPhone } from '../utils/formatters';

interface ExportPreviewData {
  alarms: Alarm[];
  totalAmount: string;
  preciseTotalAmount: string;
  amountMismatch: boolean;
  hasPhoneLeak: boolean;
  leakedPhones: string[];
  readmeInconsistencies: Array<{
    alarmId: string;
    field: string;
    pageValue: string;
    expectedValue: string;
  }>;
}

export function useExport() {
  const { getFilteredAlarms, getStats, selectedAlarmIds, getStatusHistoryByAlarmId } =
    useAlarmStore();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includePhotos: false,
    includeHistory: false,
  });
  const [showPreview, setShowPreview] = useState(false);

  const alarmsToExport = useMemo(() => {
    const filtered = getFilteredAlarms();
    if (selectedAlarmIds.length > 0) {
      return filtered.filter((a) => selectedAlarmIds.includes(a.id));
    }
    return filtered;
  }, [getFilteredAlarms, selectedAlarmIds]);

  const previewData = useMemo((): ExportPreviewData => {
    const stats = getStats();
    const displayTotal = parseFloat(stats.totalAmountDisplay);
    const preciseTotal = parseFloat(stats.preciseTotalAmount);
    const amountMismatch = Math.abs(displayTotal - preciseTotal) > 0.001;

    const leakedPhones = alarmsToExport
      .filter((a) => a.phone !== maskPhone(a.phone) && !a.phoneMasked.includes('****'))
      .map((a) => a.phone);

    const readmeInconsistencies: ExportPreviewData['readmeInconsistencies'] = [];
    alarmsToExport.forEach((alarm) => {
      if (alarm.id === 'alarm-readme-001') {
        if (alarm.description !== 'README命令测试告警-命令行版本') {
          readmeInconsistencies.push({
            alarmId: alarm.id,
            field: 'description',
            pageValue: alarm.description,
            expectedValue: 'README命令测试告警-命令行版本',
          });
        }
      }
    });

    return {
      alarms: alarmsToExport,
      totalAmount: stats.totalAmountDisplay,
      preciseTotalAmount: stats.preciseTotalAmount,
      amountMismatch,
      hasPhoneLeak: leakedPhones.length > 0,
      leakedPhones,
      readmeInconsistencies,
    };
  }, [alarmsToExport, getStats]);

  const generateCSV = useCallback(() => {
    const headers = [
      '告警编号',
      '站点名称',
      '设备名称',
      '告警级别',
      '告警描述',
      '金额(显示)',
      '金额(精确)',
      '联系电话(脱敏)',
      '状态',
      '数据来源',
      '创建时间',
      '更新时间',
    ];

    if (exportOptions.includePhotos) {
      headers.push('BMS拍照URL');
    }
    if (exportOptions.includeHistory) {
      headers.push('状态变更历史');
    }

    const rows = alarmsToExport.map((alarm) => {
      const row = [
        alarm.alarmCode,
        alarm.siteName,
        alarm.deviceName,
        alarm.level,
        alarm.description,
        alarm.amountDisplay,
        alarm.amount.toFixed(4),
        alarm.phoneMasked,
        alarm.status,
        alarm.source,
        alarm.createdAt,
        alarm.updatedAt,
      ];

      if (exportOptions.includePhotos) {
        row.push(alarm.bmsPhotoUrl || '');
      }
      if (exportOptions.includeHistory) {
        const history = getStatusHistoryByAlarmId(alarm.id);
        row.push(history.map((h) => `${h.fromStatus}→${h.toStatus}(${h.operator})`).join('; '));
      }

      return row;
    });

    const totalsRow = [
      '合计',
      '',
      '',
      '',
      '',
      previewData.totalAmount,
      previewData.preciseTotalAmount,
      '',
      '',
      '',
      '',
      '',
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      totalsRow.map((cell) => `"${cell}"`).join(','),
    ].join('\n');

    return csvContent;
  }, [alarmsToExport, exportOptions, getStatusHistoryByAlarmId, previewData]);

  const generateJSON = useCallback(() => {
    const data = {
      exportTime: new Date().toISOString(),
      exportOptions,
      summary: {
        totalCount: alarmsToExport.length,
        displayTotalAmount: previewData.totalAmount,
        preciseTotalAmount: previewData.preciseTotalAmount,
        amountMismatch: previewData.amountMismatch,
        hasPhoneLeak: previewData.hasPhoneLeak,
      },
      alarms: alarmsToExport.map((alarm) => ({
        ...alarm,
        statusHistory: exportOptions.includeHistory ? getStatusHistoryByAlarmId(alarm.id) : undefined,
      })),
      validationNotes: {
        readmeInconsistencies: previewData.readmeInconsistencies,
        decimalPrecisionWarning: previewData.amountMismatch
          ? `金额显示与精确计算存在偏差: ¥${previewData.totalAmount} vs ¥${previewData.preciseTotalAmount}`
          : null,
      },
    };

    return JSON.stringify(data, null, 2);
  }, [alarmsToExport, exportOptions, getStatusHistoryByAlarmId, previewData]);

  const downloadFile = useCallback(
    (content: string, filename: string, mimeType: string) => {
      const blob = new Blob(['\uFEFF' + content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    []
  );

  const exportData = useCallback(() => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportOptions.format === 'csv') {
      content = generateCSV();
      filename = `BMS告警对账_${timestamp}.csv`;
      mimeType = 'text/csv;charset=utf-8';
    } else {
      content = generateJSON();
      filename = `BMS告警对账_${timestamp}.json`;
      mimeType = 'application/json;charset=utf-8';
    }

    downloadFile(content, filename, mimeType);
    setShowPreview(false);
  }, [exportOptions, generateCSV, generateJSON, downloadFile]);

  return {
    exportOptions,
    setExportOptions,
    showPreview,
    setShowPreview,
    previewData,
    alarmsToExport,
    exportData,
    generateCSV,
    generateJSON,
  };
}
