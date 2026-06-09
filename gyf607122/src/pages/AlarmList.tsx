import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RotateCcw, Download, AlertTriangle, AlertCircle, Info, Clock, CheckCircle, ChevronRight, FileText, Paperclip } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import { statusTextMap, levelTextMap } from '@/types';
import { exportToExcel, downloadFile, generateFileName } from '@/utils/exportSecurity';
import type { AlarmStatus, AlarmLevel, AlarmRecord } from '@/types';

export default function AlarmList() {
  const navigate = useNavigate();
  const { currentUser, getFilteredAlarms, filters, setFilters, resetFilters, hosts, hasPermission } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState<AlarmStatus | ''>('');
  const [selectedLevel, setSelectedLevel] = useState<AlarmLevel | ''>('');
  const [selectedHost, setSelectedHost] = useState('');
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredAlarms = useMemo(() => {
    const newFilters = {
      keyword: keyword || undefined,
      status: selectedStatus || undefined,
      level: selectedLevel || undefined,
      hostId: selectedHost || undefined,
      startTime: startDate ? dayjs(startDate).startOf('day').toISOString() : undefined,
      endTime: endDate ? dayjs(endDate).endOf('day').toISOString() : undefined,
    };
    setFilters(newFilters);
    return getFilteredAlarms();
  }, [keyword, selectedStatus, selectedLevel, selectedHost, startDate, endDate, setFilters, getFilteredAlarms]);

  const stats = useMemo(() => {
    const allAlarms = getFilteredAlarms();
    return {
      pending: allAlarms.filter(a => a.status === 'pending').length,
      processing: allAlarms.filter(a => a.status === 'processing').length,
      completed: allAlarms.filter(a => a.status === 'completed').length,
      abnormal: allAlarms.filter(a => a.status === 'abnormal').length,
    };
  }, [getFilteredAlarms]);

  const handleReset = () => {
    setKeyword('');
    setSelectedStatus('');
    setSelectedLevel('');
    setSelectedHost('');
    setStartDate('');
    setEndDate('');
    resetFilters();
  };

  const handleExport = () => {
    if (!currentUser || !hasPermission('data:export')) return;
    const blob = exportToExcel(filteredAlarms, currentUser, { sheetName: '告警记录' });
    downloadFile(blob, generateFileName('告警记录'));
  };

  const getStatusBadgeClass = (status: AlarmStatus) => {
    const baseClass = 'status-badge';
    switch (status) {
      case 'pending': return `${baseClass} status-pending`;
      case 'processing': return `${baseClass} status-processing`;
      case 'completed': return `${baseClass} status-completed`;
      case 'abnormal': return `${baseClass} status-abnormal`;
    }
  };

  const getLevelIcon = (level: AlarmLevel) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-danger-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-warning-400" />;
      case 'info': return <Info className="w-4 h-4 text-primary-400" />;
    }
  };

  const getLevelBadgeClass = (level: AlarmLevel) => {
    const baseClass = 'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border-2';
    switch (level) {
      case 'critical': return `${baseClass} bg-danger-500/20 text-danger-400 border-danger-500`;
      case 'warning': return `${baseClass} bg-warning-500/20 text-warning-400 border-warning-500`;
      case 'info': return `${baseClass} bg-primary-500/20 text-primary-400 border-primary-500`;
    }
  };

  const getRowClass = (alarm: AlarmRecord) => {
    if (alarm.status === 'abnormal') return 'table-row-danger';
    return 'table-row table-row-alternate';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white font-mono">空调主机告警清单</h3>
          <p className="text-sm text-dark-300 mt-1">
            共 <span className="font-mono text-primary-400 font-bold">{filteredAlarms.length}</span> 条告警记录
          </p>
        </div>
        {hasPermission('data:export') && (
          <button onClick={handleExport} className="btn-secondary inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出Excel
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card-glow industrial-border border-l-4 border-l-warning-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">待处理</p>
              <p className="font-mono text-3xl font-bold text-warning-400 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-warning-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-400" />
            </div>
          </div>
        </div>

        <div className="card-glow industrial-border border-l-4 border-l-primary-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">处理中</p>
              <p className="font-mono text-3xl font-bold text-primary-400 mt-1">{stats.processing}</p>
            </div>
            <div className="w-10 h-10 bg-primary-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card-glow industrial-border border-l-4 border-l-success-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">已完成</p>
              <p className="font-mono text-3xl font-bold text-success-400 mt-1">{stats.completed}</p>
            </div>
            <div className="w-10 h-10 bg-success-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-400" />
            </div>
          </div>
        </div>

        <div className="card-glow industrial-border border-l-4 border-l-danger-500 animate-pulse-slow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">异常</p>
              <p className="font-mono text-3xl font-bold text-danger-400 mt-1">{stats.abnormal}</p>
            </div>
            <div className="w-10 h-10 bg-danger-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="card industrial-border">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-dark-500">
          <Filter className="w-5 h-5 text-primary-400" />
          <h4 className="font-semibold text-white">筛选条件</h4>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">关键词搜索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="主机编号/名称/告警类型"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">处理状态</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AlarmStatus | '')}
              className="input-field"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="abnormal">异常</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">告警等级</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as AlarmLevel | '')}
              className="input-field"
            >
              <option value="">全部等级</option>
              <option value="critical">严重</option>
              <option value="warning">警告</option>
              <option value="info">提示</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">空调主机</label>
            <select
              value={selectedHost}
              onChange={(e) => setSelectedHost(e.target.value)}
              className="input-field"
            >
              <option value="">全部主机</option>
              {hosts.map((host) => (
                <option key={host.id} value={host.id}>
                  {host.id} - {host.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex items-end gap-2 col-span-2">
            <button
              onClick={handleReset}
              className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重置筛选
            </button>
          </div>
        </div>
      </div>

      <div className="card industrial-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">主机信息</th>
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">告警类型</th>
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">等级</th>
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">告警时间</th>
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">位置</th>
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">处理人</th>
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider">附件</th>
                <th className="px-4 py-3 text-xs font-semibold text-dark-200 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlarms.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <FileText className="w-12 h-12 text-dark-500 mx-auto mb-3" />
                    <p className="text-dark-300">暂无符合条件的告警记录</p>
                  </td>
                </tr>
              ) : (
                filteredAlarms.map((alarm) => (
                  <tr
                    key={alarm.id}
                    className={getRowClass(alarm)}
                    onClick={() => navigate(`/host/${alarm.hostId}?alarmId=${alarm.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          alarm.status === 'abnormal' ? 'bg-danger-500 animate-pulse' :
                          alarm.status === 'completed' ? 'bg-success-500' : 'bg-dark-400'
                        }`} />
                        <div>
                          <p className="font-mono text-sm font-medium text-white">{alarm.hostId}</p>
                          <p className="text-xs text-dark-300">{alarm.hostName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getLevelBadgeClass(alarm.alarmLevel)}>
                        {getLevelIcon(alarm.alarmLevel)}
                        {alarm.alarmType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        alarm.alarmLevel === 'critical' ? 'text-danger-400' :
                        alarm.alarmLevel === 'warning' ? 'text-warning-400' : 'text-primary-400'
                      }`}>
                        {levelTextMap[alarm.alarmLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm text-white">
                        {dayjs(alarm.alarmTime).format('MM-DD HH:mm')}
                      </p>
                      <p className="text-xs text-dark-400">
                        {dayjs(alarm.alarmTime).fromNow()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{alarm.location.area}</p>
                      {alarm.location.detail && (
                        <p className="text-xs text-dark-400">{alarm.location.detail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadgeClass(alarm.status)}>
                        {statusTextMap[alarm.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {alarm.processorName ? (
                        <span className="text-sm text-white">{alarm.processorName}</span>
                      ) : (
                        <span className="text-xs text-dark-400">未分配</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {alarm.attachments && alarm.attachments.length > 0 ? (
                        <div className="flex items-center gap-1 text-primary-400">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-xs font-mono">{alarm.attachments.length}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-dark-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-400 hover:bg-primary-500/10 border border-transparent hover:border-primary-500/50 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/host/${alarm.hostId}?alarmId=${alarm.id}`);
                        }}
                      >
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
