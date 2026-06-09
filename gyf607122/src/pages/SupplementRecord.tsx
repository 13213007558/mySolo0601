import { useState, useMemo } from 'react';
import { Plus, Clock, Save, FileDown, Upload, AlertCircle, CheckCircle, XCircle, ArrowRight, RotateCcw, Search, History, Zap } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import { compareData, formatValue, createSupplementRecordWithDiff } from '@/utils/diff';
import { exportToExcel, readExcelFile, downloadFile, generateFileName } from '@/utils/exportSecurity';
import { hostStatusTextMap } from '@/types';
import type { SupplementRecord, DiffResult } from '@/types';

type HostStatus = 'running' | 'stopped' | 'maintenance' | 'error';
type OperationType = 'start' | 'stop';

const fieldNameMap: Record<string, string> = {
  operationType: '操作类型',
  reason: '原因说明',
  startTime: '开始时间',
  endTime: '结束时间',
};

export default function SupplementRecord() {
  const { currentUser, hosts, supplements, addSupplement, getSupplementsByHostId } = useAppStore();
  const [selectedHostId, setSelectedHostId] = useState(hosts[0]?.id || '');
  const [showForm, setShowForm] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message: string; original?: any; imported?: any; diff?: DiffResult[] } | null>(null);
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [formData, setFormData] = useState({
    startTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'),
    endTime: dayjs().format('YYYY-MM-DDTHH:mm'),
    operationType: 'start' as OperationType,
    operatorName: '叶师傅',
    reason: '',
  });
  const [savedRecord, setSavedRecord] = useState<SupplementRecord | null>(null);

  const selectedHost = hosts.find(h => h.id === selectedHostId);
  const hostSupplements = getSupplementsByHostId(selectedHostId);

  const currentStatus = useMemo(() => {
    if (!selectedHost) return null;
    const lastSupplement = hostSupplements[0];
    return lastSupplement?.operationType || (selectedHost.status === 'stopped' ? 'stop' : 'start');
  }, [selectedHost, hostSupplements]);

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreviewDiff = () => {
    if (!currentStatus) return;
    
    const oldData = {
      operationType: currentStatus,
    };
    const newData = {
      operationType: formData.operationType,
    };
    
    const diff = compareData(oldData, newData, fieldNameMap);
    setDiffResults(diff);
    setShowDiff(true);
  };

  const handleSubmit = () => {
    if (!selectedHost || !currentUser) return;

    const oldData = currentStatus ? {
      operationType: currentStatus,
    } : undefined;

    const supplementData: Omit<SupplementRecord, 'id' | 'createTime' | 'operator' | 'operatorName'> = {
      hostId: selectedHost.id,
      hostName: selectedHost.name,
      startTime: dayjs(formData.startTime).toISOString(),
      endTime: dayjs(formData.endTime).toISOString(),
      operationType: formData.operationType,
      reason: formData.reason,
    };

    const saved = addSupplement(supplementData);
    
    const savedWithDiff: SupplementRecord = {
      ...saved,
      originalData: oldData,
      diffFields: diffResults.length > 0 ? diffResults.map(d => d.field) : undefined,
    };
    
    setSavedRecord(savedWithDiff);
    setShowForm(false);
    setShowDiff(false);
  };

  const handleExport = (record: SupplementRecord) => {
    if (!currentUser) return;
    
    const exportData = [{
      '记录编号': record.id,
      '主机编号': record.hostId,
      '主机名称': record.hostName,
      '开始时间': dayjs(record.startTime).format('YYYY-MM-DD HH:mm:ss'),
      '结束时间': dayjs(record.endTime).format('YYYY-MM-DD HH:mm:ss'),
      '操作类型': record.operationType === 'start' ? '启动' : '停止',
      '操作员': record.operatorName,
      '原因说明': record.reason,
    }];

    const blob = exportToExcel(exportData, currentUser, { 
      sheetName: '补录记录',
      addWatermark: true 
    });
    downloadFile(blob, generateFileName(`补录记录_${record.hostId}`));
  };

  const handleImportVerify = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      const data = await readExcelFile(file);
      const importedRecord = data[0];
      
      const recordId = importedRecord['记录编号'] as string;
      const originalRecord = supplements.find(s => s.id === recordId);

      if (!originalRecord) {
        setVerifyResult({ valid: false, message: '未找到对应的原始记录' });
        setShowVerify(true);
        return;
      }

      const originalData = {
        id: originalRecord.id,
        hostId: originalRecord.hostId,
        hostName: originalRecord.hostName,
        startTime: dayjs(originalRecord.startTime).format('YYYY-MM-DD HH:mm:ss'),
        endTime: dayjs(originalRecord.endTime).format('YYYY-MM-DD HH:mm:ss'),
        operationType: originalRecord.operationType === 'start' ? '启动' : '停止',
        operator: originalRecord.operatorName,
        reason: originalRecord.reason,
      };

      const importedData = {
        id: importedRecord['记录编号'],
        hostId: importedRecord['主机编号'],
        hostName: importedRecord['主机名称'],
        startTime: importedRecord['开始时间'],
        endTime: importedRecord['结束时间'],
        operationType: importedRecord['操作类型'],
        operator: importedRecord['操作员'],
        reason: importedRecord['原因说明'],
      };

      const diff = compareData(originalData, importedData, fieldNameMap);
      
      if (diff.length === 0) {
        setVerifyResult({
          valid: true,
          message: '验证通过，数据一致',
          original: originalData,
          imported: importedData,
          diff,
        });
      } else {
        setVerifyResult({
          valid: false,
          message: `发现 ${diff.length} 处数据差异`,
          original: originalData,
          imported: importedData,
          diff,
        });
      }
      setShowVerify(true);
    } catch (error) {
      setVerifyResult({ valid: false, message: '文件解析失败' });
      setShowVerify(true);
    }
  };

  const getStatusBadgeClass = (status: HostStatus | OperationType) => {
    if (status === 'running' || status === 'start') return 'bg-success-500/20 text-success-400 border-success-500';
    if (status === 'stopped' || status === 'stop') return 'bg-danger-500/20 text-danger-400 border-danger-500';
    if (status === 'maintenance') return 'bg-warning-500/20 text-warning-400 border-warning-500';
    return 'bg-danger-500/30 text-danger-400 border-danger-500';
  };

  const getDiffIcon = (diff: DiffResult) => {
    if (diff.changeType === 'add') return <Plus className="w-4 h-4 text-success-400" />;
    if (diff.changeType === 'delete') return <XCircle className="w-4 h-4 text-danger-400" />;
    return <ArrowRight className="w-4 h-4 text-primary-400" />;
  };

  const getDiffRowClass = (diff: DiffResult) => {
    if (diff.changeType === 'add') return 'bg-success-500/10 border-success-500/30';
    if (diff.changeType === 'delete') return 'bg-danger-500/10 border-danger-500/30';
    return 'bg-primary-500/10 border-primary-500/30';
  };

  const getDiffDescription = (diff: DiffResult) => {
    return diff.fieldName;
  };

  const durationMinutes = dayjs(formData.endTime).diff(dayjs(formData.startTime), 'minute');
  const durationHours = (durationMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white font-mono">启停时段补录</h3>
          <p className="text-sm text-dark-300 mt-1">叶师傅专属 - 手工补录空调主机启停时段，支持差异对比和导出验证</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            导入验证
            <input type="file" accept=".xlsx,.xls" onChange={handleImportVerify} className="hidden" />
          </label>
          <button onClick={() => { setShowForm(true); setSavedRecord(null); }} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增补录
          </button>
        </div>
      </div>

      {savedRecord && (
        <div className="p-4 bg-success-500/20 border-2 border-success-500 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-success-400" />
              <div>
                <p className="font-medium text-success-400">补录成功</p>
                <p className="text-sm text-dark-200">
                  记录编号: <span className="font-mono">{savedRecord.id}</span> · 
                  {savedRecord.hostName} · 
                  {dayjs(savedRecord.startTime).format('MM-DD HH:mm')} ~ {dayjs(savedRecord.endTime).format('HH:mm')}
                </p>
              </div>
            </div>
            <button onClick={() => handleExport(savedRecord)} className="btn-secondary inline-flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              导出记录
            </button>
          </div>
        </div>
      )}

      {showVerify && verifyResult && (
        <div className={`p-4 border-2 animate-fade-in ${
          verifyResult.valid 
            ? 'bg-success-500/20 border-success-500' 
            : 'bg-danger-500/20 border-danger-500'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {verifyResult.valid ? (
                <CheckCircle className="w-6 h-6 text-success-400 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-danger-400 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${verifyResult.valid ? 'text-success-400' : 'text-danger-400'}`}>
                  {verifyResult.valid ? '验证通过' : '验证失败'}
                </p>
                <p className="text-sm text-dark-200">{verifyResult.message}</p>
                {verifyResult.diff && verifyResult.diff.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {verifyResult.diff.map((d, i) => (
                      <div key={i} className={`p-2 text-sm border-l-2 ${getDiffRowClass(d)}`}>
                        <div className="flex items-center gap-2">
                          {getDiffIcon(d)}
                          <span className="font-mono text-xs">{d.field}</span>
                          <ArrowRight className="w-3 h-3 text-dark-400" />
                          <span className="text-dark-300">{formatValue(d.oldValue)}</span>
                          <span className="text-primary-400">→ {formatValue(d.newValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setShowVerify(false)} className="text-dark-400 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="card industrial-border">
            <div className="px-4 py-3 border-b border-dark-500">
              <h4 className="font-medium text-white">选择主机</h4>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-thin">
              {hosts.map((host) => (
                <button
                  key={host.id}
                  onClick={() => setSelectedHostId(host.id)}
                  className={`w-full p-3 text-left border-2 transition-all ${
                    selectedHostId === host.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-transparent hover:border-dark-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-white">{host.id}</p>
                      <p className="text-xs text-dark-300">{host.name}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border-2 ${getStatusBadgeClass(host.status)}`}>
                      {hostStatusTextMap[host.status]}
                    </span>
                  </div>
                  {host.location && (
                    <p className="text-xs text-dark-400 mt-1">{host.location.area}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedHost && currentStatus !== null && (
            <div className="card industrial-border">
              <div className="px-4 py-3 border-b border-dark-500">
                <h4 className="font-medium text-white">当前状态</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">上次操作</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border-2 ${getStatusBadgeClass(currentStatus)}`}>
                    {currentStatus === 'start' ? '启动' : '停止'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-dark-700">
                    <p className="font-mono text-lg text-white">{selectedHost.params.supplyTemp || '-'}</p>
                    <p className="text-xs text-dark-400">供温°C</p>
                  </div>
                  <div className="p-2 bg-dark-700">
                    <p className="font-mono text-lg text-white">{selectedHost.params.returnTemp || '-'}</p>
                    <p className="text-xs text-dark-400">回温°C</p>
                  </div>
                  <div className="p-2 bg-dark-700">
                    <p className="font-mono text-lg text-white">{selectedHost.params.pressure || '-'}</p>
                    <p className="text-xs text-dark-400">MPa</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          {showForm ? (
            <div className="card industrial-border animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-500">
                <h4 className="font-medium text-white inline-flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning-400" />
                  新增补录记录
                </h4>
                <button onClick={() => { setShowForm(false); setShowDiff(false); }} className="text-dark-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">主机</label>
                    <div className="p-3 bg-dark-700 border-2 border-dark-500">
                      <p className="font-mono text-white">{selectedHost?.id}</p>
                      <p className="text-xs text-dark-400">{selectedHost?.name}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">操作员</label>
                    <input
                      type="text"
                      value={formData.operatorName}
                      onChange={(e) => handleFormChange('operatorName', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">开始时间</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => handleFormChange('startTime', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">结束时间</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => handleFormChange('endTime', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="p-3 bg-primary-500/10 border-2 border-primary-500/30">
                  <div className="flex items-center gap-2 text-primary-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      时长: <span className="font-mono font-bold">{durationHours} 小时</span> ({durationMinutes} 分钟)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-1">操作类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['start', 'stop'] as OperationType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleFormChange('operationType', type)}
                        className={`p-3 text-sm border-2 transition-all ${
                          formData.operationType === type
                            ? getStatusBadgeClass(type) + ' border-2'
                            : 'border-dark-500 text-dark-300 hover:border-dark-400'
                        }`}
                      >
                        {type === 'start' ? '启动主机' : '停止主机'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-1">原因说明</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="请输入补录原因..."
                    className="input-field min-h-[80px]"
                  />
                </div>

                {showDiff && diffResults.length > 0 && (
                  <div className="p-4 bg-dark-600 border-2 border-dark-500">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-warning-400" />
                      <span className="font-medium text-white">变更差异预览</span>
                    </div>
                    <div className="space-y-2">
                      {diffResults.map((diff, i) => (
                        <div key={i} className={`p-3 border-l-2 ${getDiffRowClass(diff)}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getDiffIcon(diff)}
                              <span className="text-sm text-white font-medium">{getDiffDescription(diff)}</span>
                            </div>
                            <div className="text-xs font-mono">
                              {diff.changeType !== 'add' && (
                                <span className="text-dark-400 line-through mr-2">{formatValue(diff.oldValue)}</span>
                              )}
                              {diff.changeType !== 'delete' && (
                                <span className="text-primary-400">{formatValue(diff.newValue)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showDiff && diffResults.length === 0 && (
                  <div className="p-4 bg-success-500/10 border-2 border-success-500/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success-400" />
                      <span className="text-sm text-success-400">无数据变更，与当前状态一致</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button onClick={handlePreviewDiff} className="btn-secondary inline-flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    预览差异
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowForm(false)} className="btn-secondary">
                      取消
                    </button>
                    <button onClick={handleSubmit} className="btn-primary inline-flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      保存记录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card industrial-border">
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-500">
                <h4 className="font-medium text-white inline-flex items-center gap-2">
                  <History className="w-4 h-4 text-primary-400" />
                  历史补录记录
                  <span className="text-xs font-normal text-dark-400">({hostSupplements.length} 条)</span>
                </h4>
                {hostSupplements.length > 0 && selectedHost && currentUser && (
                  <button
                    onClick={() => {
                      const exportData = hostSupplements.map(record => ({
                        '记录编号': record.id,
                        '主机编号': record.hostId,
                        '主机名称': record.hostName,
                        '开始时间': dayjs(record.startTime).format('YYYY-MM-DD HH:mm:ss'),
                        '结束时间': dayjs(record.endTime).format('YYYY-MM-DD HH:mm:ss'),
                        '操作类型': record.operationType === 'start' ? '启动' : '停止',
                        '操作员': record.operatorName,
                        '原因说明': record.reason,
                      }));
                      const blob = exportToExcel(exportData, currentUser!, { sheetName: '补录记录', addWatermark: true });
                      downloadFile(blob, generateFileName(`补录记录_${selectedHost.id}`));
                    }}
                    className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                  >
                    <FileDown className="w-3 h-3" />
                    导出全部
                  </button>
                )}
              </div>
              <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                {hostSupplements.length === 0 ? (
                  <div className="p-12 text-center">
                    <RotateCcw className="w-12 h-12 text-dark-500 mx-auto mb-3" />
                    <p className="text-dark-300">暂无补录记录</p>
                    <p className="text-sm text-dark-500 mt-1">点击"新增补录"创建第一条记录</p>
                  </div>
                ) : (
                  <div className="divide-y divide-dark-500">
                    {hostSupplements.map((record) => (
                      <div key={record.id} className="p-4 hover:bg-dark-700/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border-2 ${getStatusBadgeClass(record.operationType)}`}>
                                {record.operationType === 'start' ? '启动' : '停止'}
                              </span>
                              <span className="font-mono text-xs text-dark-400">#{record.id}</span>
                              <span className="text-sm text-white">
                                {dayjs(record.startTime).format('MM-DD HH:mm')}
                                <ArrowRight className="w-3 h-3 inline mx-1 text-dark-400" />
                                {dayjs(record.endTime).format('HH:mm')}
                              </span>
                              <span className="text-xs text-dark-400">
                                ({dayjs(record.endTime).diff(dayjs(record.startTime), 'minute')} 分钟)
                              </span>
                            </div>
                            {record.reason && (
                              <p className="text-xs text-dark-400">原因: {record.reason}</p>
                            )}
                            {record.diffFields && record.diffFields.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-dark-500">
                                <p className="text-xs text-primary-400 mb-1">变更记录:</p>
                                <div className="flex flex-wrap gap-2">
                                  {record.diffFields.map((field, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 border border-primary-500/30 bg-primary-500/10 text-primary-400">
                                      {fieldNameMap[field] || field}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleExport(record)}
                              className="p-2 border-2 border-dark-500 hover:border-primary-500 text-dark-300 hover:text-primary-400 transition-colors"
                              title="导出记录"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-warning-500/10 border-2 border-warning-500/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-dark-200">
            <p className="font-medium text-warning-400 mb-1">补录说明</p>
            <ul className="space-y-1">
              <li>• 补录操作仅限叶师傅权限，用于修正主机启停时段和运行参数</li>
              <li>• 系统自动对比补录前后数据差异，并永久记录变更历史</li>
              <li>• 每条补录记录可单独导出，支持导出后重新导入验证数据完整性</li>
              <li>• 导出文件包含水印信息（导出人、时间、权限等级），防止篡改</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
