import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, XCircle, Paperclip, AlertCircle, Info, RotateCcw, Send, Download, Search } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import { detectDuplicates, validateAbnormalData, validateAttachments, canSubmit, getImportStats } from '@/utils/fingerprint';
import { readExcelFile, exportToExcel, downloadFile, generateFileName } from '@/utils/exportSecurity';
import { statusTextMap, levelTextMap } from '@/types';
import type { ImportRecord, AlarmRecord, AlarmStatus, AlarmLevel } from '@/types';

export default function DataImport() {
  const { currentUser, addAlarms, hosts, alarms } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [importRecords, setImportRecords] = useState<ImportRecord[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'duplicate' | 'abnormal' | 'missing_attachment'>('all');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('请上传Excel或CSV格式的文件');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setUploadSuccess(false);
    setAddedCount(0);

    try {
      const data = await readExcelFile(file);
      
      const mappedData: Partial<AlarmRecord>[] = data.map((row: any) => ({
        hostId: row['主机编号'] || row['hostId'],
        hostName: row['主机名称'] || row['hostName'],
        alarmType: row['告警类型'] || row['alarmType'],
        alarmLevel: (row['告警等级'] || row['alarmLevel'] || 'warning') as AlarmLevel,
        alarmTime: row['告警时间'] || row['alarmTime'],
        status: (row['状态'] || row['status'] || 'pending') as AlarmStatus,
        location: {
          area: row['位置区域'] || row['location.area'] || '未知区域',
          detail: row['具体位置'] || row['location.detail'],
        },
        params: {
          temperature: row['温度'] !== undefined ? Number(row['温度']) : undefined,
          pressure: row['压力'] !== undefined ? Number(row['压力']) : undefined,
          voltage: row['电压'] !== undefined ? Number(row['电压']) : undefined,
        },
        attachments: row['附件'] ? String(row['附件']).split(',').map(s => s.trim()).filter(Boolean) : undefined,
      }));

      let records = detectDuplicates(mappedData, alarms);
      records = validateAbnormalData(records);
      records = validateAttachments(records);

      setImportRecords(records);
      setActiveTab('all');
    } catch (error) {
      console.error('文件解析失败:', error);
      alert('文件解析失败，请检查文件格式');
    } finally {
      setIsProcessing(false);
    }
  }, [alarms]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit(importRecords)) {
      alert('存在不合格记录，请修正后再提交');
      return;
    }

    const validRecords = importRecords
      .filter(r => r.status === 'valid')
      .map(r => r.data);

    const count = addAlarms(validRecords);
    setAddedCount(count);
    setUploadSuccess(true);
  };

  const handleReset = () => {
    setImportRecords([]);
    setFileName('');
    setActiveTab('all');
    setUploadSuccess(false);
    setAddedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportTemplate = () => {
    if (!currentUser) return;
    
    const templateData = [
      {
        '主机编号': 'HOST001',
        '主机名称': '1号主机',
        '告警类型': '温度过高',
        '告警等级': 'critical',
        '告警时间': dayjs().format('YYYY-MM-DD HH:mm:ss'),
        '状态': 'pending',
        '位置区域': 'A区',
        '具体位置': '1号楼3层',
        '温度': 45,
        '压力': 0.5,
        '电压': 235,
        '附件': 'photo1.jpg,report.pdf',
      }
    ];

    const blob = exportToExcel(templateData, currentUser, { 
      sheetName: '导入模板',
      includeSensitive: true,
      addWatermark: false 
    });
    downloadFile(blob, generateFileName('告警导入模板'));
  };

  const handleExportErrorReport = () => {
    if (!currentUser) return;
    
    const errorRecords = importRecords
      .filter(r => r.status !== 'valid')
      .map(r => ({
        '行号': r.rowIndex + 2,
        '主机编号': r.data.hostId,
        '主机名称': r.data.hostName,
        '告警时间': r.data.alarmTime,
        '错误类型': r.status === 'duplicate' ? '重复记录' : r.status === 'abnormal' ? '数据异常' : '缺少附件',
        '错误详情': r.errorMessage,
      }));

    const blob = exportToExcel(errorRecords, currentUser, { 
      sheetName: '错误报告',
      addWatermark: false 
    });
    downloadFile(blob, generateFileName('导入错误报告'));
  };

  const stats = getImportStats(importRecords);

  const filteredRecords = importRecords.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const getStatusIcon = (status: ImportRecord['status']) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-success-400" />;
      case 'duplicate': return <XCircle className="w-4 h-4 text-warning-400" />;
      case 'abnormal': return <AlertCircle className="w-4 h-4 text-danger-400" />;
      case 'missing_attachment': return <Paperclip className="w-4 h-4 text-warning-400" />;
    }
  };

  const getRowClass = (status: ImportRecord['status']) => {
    switch (status) {
      case 'valid': return 'bg-success-500/5 border-success-500/30';
      case 'duplicate': return 'bg-warning-500/5 border-warning-500/30 opacity-60';
      case 'abnormal': return 'bg-danger-500/10 border-danger-500/30';
      case 'missing_attachment': return 'bg-warning-500/10 border-warning-500/30';
    }
  };

  const tabs = [
    { key: 'all' as const, label: '全部', count: stats.total, icon: Info, color: 'primary' },
    { key: 'valid' as const, label: '正常', count: stats.valid, icon: CheckCircle, color: 'success' },
    { key: 'duplicate' as const, label: '重复', count: stats.duplicate, icon: XCircle, color: 'warning' },
    { key: 'abnormal' as const, label: '异常', count: stats.abnormal, icon: AlertTriangle, color: 'danger' },
    { key: 'missing_attachment' as const, label: '缺附件', count: stats.missingAttachments, icon: Paperclip, color: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white font-mono">数据导入</h3>
          <p className="text-sm text-dark-300 mt-1">批量导入空调主机告警记录，系统自动检测重复和异常数据</p>
        </div>
        <button onClick={handleExportTemplate} className="btn-secondary inline-flex items-center gap-2">
          <Download className="w-4 h-4" />
          下载导入模板
        </button>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-success-500/20 border-2 border-success-500 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-success-400" />
            <div>
              <p className="font-medium text-success-400">导入成功</p>
              <p className="text-sm text-dark-200">已成功导入 <span className="font-mono font-bold text-success-400">{addedCount}</span> 条告警记录</p>
            </div>
          </div>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`card industrial-border cursor-pointer transition-all duration-200 ${
          isDragging 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'hover:border-primary-500/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isProcessing ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">正在解析文件...</p>
            <p className="text-sm text-dark-400 mt-1">{fileName}</p>
          </div>
        ) : importRecords.length === 0 ? (
          <div className="py-12 text-center">
            <div className={`w-20 h-20 mx-auto mb-4 flex items-center justify-center border-2 border-dashed transition-all ${
              isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-dark-500'
            }`}>
              <Upload className={`w-10 h-10 transition-all ${isDragging ? 'text-primary-400' : 'text-dark-400'}`} />
            </div>
            <p className="text-lg font-medium text-white mb-2">
              拖拽文件到此处，或点击选择文件
            </p>
            <p className="text-sm text-dark-400">
              支持 Excel (.xlsx, .xls) 和 CSV 格式
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-success-500/20 border-2 border-success-500 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-success-400" />
            </div>
            <p className="text-white font-medium">{fileName}</p>
            <p className="text-sm text-dark-300 mt-1">
              共解析到 <span className="font-mono font-bold text-primary-400">{stats.total}</span> 条记录
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              className="btn-secondary mt-4 inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重新选择文件
            </button>
          </div>
        )}
      </div>

      {importRecords.length > 0 && (
        <>
          <div className="grid grid-cols-5 gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const colorClass = {
                primary: 'border-primary-500 text-primary-400',
                success: 'border-success-500 text-success-400',
                warning: 'border-warning-500 text-warning-400',
                danger: 'border-danger-500 text-danger-400',
              }[tab.color];
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`card industrial-border text-left transition-all ${
                    activeTab === tab.key 
                      ? `border-l-4 ${colorClass} bg-dark-700/50`
                      : 'hover:border-dark-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center border-2 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-dark-300">{tab.label}</p>
                      <p className="font-mono text-2xl font-bold text-white">{tab.count}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="card industrial-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-dark-700 border-b border-dark-500">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-dark-400" />
                <span className="text-sm text-dark-300">
                  显示 {filteredRecords.length} 条记录
                </span>
              </div>
              <div className="flex items-center gap-3">
                {(stats.duplicate > 0 || stats.abnormal > 0 || stats.missingAttachments > 0) && (
                  <button
                    onClick={handleExportErrorReport}
                    className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    导出错误报告
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit(importRecords)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  提交导入
                </button>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-dark-700">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider w-12">状态</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">行号</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">主机编号</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">告警类型</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">等级</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">告警时间</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">参数</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">附件</th>
                    <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">错误信息</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.rowIndex}
                      className={`border-b border-dark-500 ${getRowClass(record.status)}`}
                    >
                      <td className="px-4 py-3">{getStatusIcon(record.status)}</td>
                      <td className="px-4 py-3 font-mono text-sm text-dark-200">{record.rowIndex + 2}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono text-sm text-white">{record.data.hostId}</p>
                          <p className="text-xs text-dark-400">{record.data.hostName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{record.data.alarmType}</td>
                      <td className="px-4 py-3">
                        {record.data.alarmLevel && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border-2 ${
                            record.data.alarmLevel === 'critical' 
                              ? 'bg-danger-500/20 text-danger-400 border-danger-500'
                              : record.data.alarmLevel === 'warning'
                              ? 'bg-warning-500/20 text-warning-400 border-warning-500'
                              : 'bg-primary-500/20 text-primary-400 border-primary-500'
                          }`}>
                            {levelTextMap[record.data.alarmLevel]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm text-white">
                          {record.data.alarmTime ? dayjs(record.data.alarmTime).format('MM-DD HH:mm') : '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-dark-200 space-y-0.5">
                          {record.data.params?.temperature !== undefined && (
                            <p>温度: {record.data.params.temperature}°C</p>
                          )}
                          {record.data.params?.pressure !== undefined && (
                            <p>压力: {record.data.params.pressure} MPa</p>
                          )}
                          {record.data.params?.voltage !== undefined && (
                            <p>电压: {record.data.params.voltage} V</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {record.data.attachments && record.data.attachments.length > 0 ? (
                          <div className="flex items-center gap-1 text-primary-400">
                            <Paperclip className="w-3 h-3" />
                            <span className="text-xs font-mono">{record.data.attachments.length}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-danger-400">缺失</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {record.errorMessage ? (
                          <p className="text-xs text-danger-400">{record.errorMessage}</p>
                        ) : (
                          <span className="text-xs text-success-400">正常</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-dark-600 border-2 border-dark-500">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-dark-200">
                <p className="font-medium text-white mb-1">导入说明</p>
                <ul className="space-y-1">
                  <li>• <span className="text-success-400">绿色</span>：数据正常，可导入</li>
                  <li>• <span className="text-warning-400">黄色/灰色</span>：重复记录，将被跳过</li>
                  <li>• <span className="text-danger-400">红色</span>：数据异常（数值超出阈值），需要修正</li>
                  <li>• <span className="text-warning-400">橙色边框</span>：缺少附件，严重和警告级别必须上传附件</li>
                  <li>• 系统基于「主机编号 + 告警时间」生成数据指纹，自动识别重复记录</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
