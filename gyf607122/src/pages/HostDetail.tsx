import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, MapPin, Thermometer, Gauge, Zap, Clock, History, Edit2, Save, X, AlertTriangle, AlertCircle, Info, CheckCircle, FileText, Paperclip, User } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import { statusTextMap, levelTextMap, hostStatusTextMap, AlarmStatus } from '@/types';
import type { AlarmRecord, StatusHistory } from '@/types';

export default function HostDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getHostById, getAlarmsByHostId, getAlarmById, updateAlarmStatus, currentUser, hasPermission } = useAppStore();

  const host = id ? getHostById(id) : undefined;
  const hostAlarms = id ? getAlarmsByHostId(id) : [];
  const alarmId = searchParams.get('alarmId');
  const selectedAlarm = alarmId ? getAlarmById(alarmId) : hostAlarms[0];

  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<AlarmStatus>('pending');
  const [editRemark, setEditRemark] = useState('');

  useEffect(() => {
    if (selectedAlarm) {
      setNewStatus(selectedAlarm.status);
    }
  }, [selectedAlarm]);

  if (!host) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-warning-400 mx-auto mb-3" />
          <p className="text-dark-300">未找到该空调主机信息</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            返回告警清单
          </button>
        </div>
      </div>
    );
  }

  const handleSaveStatus = () => {
    if (!selectedAlarm || !hasPermission('alarm:process')) return;
    
    const success = updateAlarmStatus(selectedAlarm.id, newStatus, editRemark);
    if (success) {
      setIsEditingStatus(false);
      setEditRemark('');
    }
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

  const getHostStatusBadgeClass = (status: 'running' | 'stopped' | 'error') => {
    const baseClass = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-2';
    switch (status) {
      case 'running': return `${baseClass} bg-success-500/20 text-success-400 border-success-500`;
      case 'stopped': return `${baseClass} bg-dark-500/20 text-dark-300 border-dark-500`;
      case 'error': return `${baseClass} bg-danger-500/20 text-danger-400 border-danger-500`;
    }
  };

  const getTimelineDotClass = (status: AlarmStatus) => {
    switch (status) {
      case 'pending': return 'bg-warning-500 border-warning-300';
      case 'processing': return 'bg-primary-500 border-primary-300';
      case 'completed': return 'bg-success-500 border-success-300';
      case 'abnormal': return 'bg-danger-500 border-danger-300';
    }
  };

  const getLevelIcon = (level: 'critical' | 'warning' | 'info') => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-danger-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-warning-400" />;
      case 'info': return <Info className="w-5 h-5 text-primary-400" />;
    }
  };

  const getAllHistory = (alarm: AlarmRecord | undefined): StatusHistory[] => {
    if (!alarm) return [];
    const history = alarm.history || [];
    const initialEntry: StatusHistory = {
      id: 'initial',
      status: 'pending',
      operator: 'system',
      operatorName: '系统自动',
      time: alarm.alarmTime,
      remark: '告警自动触发',
    };
    return [initialEntry, ...history];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3 py-2 text-dark-200 hover:text-white hover:bg-dark-600 border-2 border-transparent hover:border-dark-500 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          返回清单
        </button>
        <div>
          <h3 className="text-xl font-bold text-white font-mono flex items-center gap-3">
            <Cpu className="w-6 h-6 text-primary-400" />
            {host.name}
            <span className="font-normal text-sm text-dark-400 font-sans">({host.id})</span>
          </h3>
        </div>
        <span className={getHostStatusBadgeClass(host.status)}>
          <span className={`w-2 h-2 rounded-full ${host.status === 'running' ? 'bg-success-400 animate-pulse' : host.status === 'error' ? 'bg-danger-400' : 'bg-dark-400'}`} />
          {hostStatusTextMap[host.status]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="card industrial-border">
            <h4 className="font-semibold text-white mb-4 pb-3 border-b border-dark-500 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-400" />
              主机信息
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-dark-400 mb-1">型号</p>
                <p className="font-mono text-white">{host.model}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">位置</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white">{host.location.area}</p>
                    {host.location.detail && (
                      <p className="text-sm text-dark-300">{host.location.detail}</p>
                    )}
                    {host.location.coordinates && (
                      <p className="text-xs text-dark-400 font-mono mt-1">
                        {host.location.coordinates.lat}, {host.location.coordinates.lng}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">上次维护</p>
                <p className="font-mono text-white">{dayjs(host.lastMaintenance).format('YYYY-MM-DD')}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">额定功率</p>
                <p className="font-mono text-white">{host.params.ratedPower} kW</p>
              </div>
            </div>
          </div>

          <div className="card industrial-border">
            <h4 className="font-semibold text-white mb-4 pb-3 border-b border-dark-500 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary-400" />
              运行参数
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-700 p-3 border border-dark-500">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-4 h-4 text-danger-400" />
                  <span className="text-xs text-dark-400">供电温度</span>
                </div>
                <p className="font-mono text-xl font-bold text-white">{host.params.supplyTemp}°C</p>
              </div>
              <div className="bg-dark-700 p-3 border border-dark-500">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-4 h-4 text-warning-400" />
                  <span className="text-xs text-dark-400">回水温度</span>
                </div>
                <p className="font-mono text-xl font-bold text-white">{host.params.returnTemp}°C</p>
              </div>
              <div className="bg-dark-700 p-3 border border-dark-500">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-primary-400" />
                  <span className="text-xs text-dark-400">压力</span>
                </div>
                <p className="font-mono text-xl font-bold text-white">{host.params.pressure} MPa</p>
              </div>
              <div className="bg-dark-700 p-3 border border-dark-500">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-success-400" />
                  <span className="text-xs text-dark-400">当前功率</span>
                </div>
                <p className="font-mono text-xl font-bold text-white">{host.params.currentPower} kW</p>
              </div>
            </div>
          </div>

          <div className="card industrial-border">
            <h4 className="font-semibold text-white mb-4 pb-3 border-b border-dark-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-400" />
              告警历史记录
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {hostAlarms.map((alarm) => (
                <div
                  key={alarm.id}
                  onClick={() => navigate(`/host/${host.id}?alarmId=${alarm.id}`)}
                  className={`p-3 border-2 cursor-pointer transition-all ${
                    selectedAlarm?.id === alarm.id
                      ? 'bg-primary-500/20 border-primary-500'
                      : 'bg-dark-700 border-dark-500 hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5">
                      {getLevelIcon(alarm.alarmLevel)}
                      <span className="text-sm text-white">{alarm.alarmType}</span>
                    </span>
                    <span className={getStatusBadgeClass(alarm.status)}>
                      {statusTextMap[alarm.status]}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 font-mono">
                    {dayjs(alarm.alarmTime).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          {selectedAlarm ? (
            <>
              <div className="card industrial-border">
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-dark-500">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getLevelIcon(selectedAlarm.alarmLevel)}
                      <h4 className="text-lg font-semibold text-white">{selectedAlarm.alarmType}</h4>
                      <span className={getStatusBadgeClass(selectedAlarm.status)}>
                        {statusTextMap[selectedAlarm.status]}
                      </span>
                    </div>
                    <p className="text-sm text-dark-300">
                      告警时间：{dayjs(selectedAlarm.alarmTime).format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                  </div>
                  {hasPermission('alarm:process') && !isEditingStatus && (
                    <button
                      onClick={() => setIsEditingStatus(true)}
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      修改状态
                    </button>
                  )}
                </div>

                {isEditingStatus && (
                  <div className="mb-6 p-4 bg-dark-700 border-2 border-primary-500 animate-fade-in">
                    <h5 className="font-medium text-white mb-4">修改告警状态</h5>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-dark-300 mb-2">新状态</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as AlarmStatus)}
                          className="input-field"
                        >
                          <option value="pending">待处理</option>
                          <option value="processing">处理中</option>
                          <option value="completed">已完成</option>
                          <option value="abnormal">异常</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-dark-300 mb-2">处理人</label>
                        <div className="flex items-center gap-2 h-10 px-3 bg-dark-800 border-2 border-dark-500">
                          <User className="w-4 h-4 text-primary-400" />
                          <span className="text-white">{currentUser?.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm text-dark-300 mb-2">处理备注</label>
                      <textarea
                        value={editRemark}
                        onChange={(e) => setEditRemark(e.target.value)}
                        placeholder="请输入处理备注..."
                        className="input-field min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handleSaveStatus} className="btn-success inline-flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        保存变更
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingStatus(false);
                          setEditRemark('');
                          setNewStatus(selectedAlarm.status);
                        }}
                        className="btn-secondary inline-flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-dark-400 mb-1">告警等级</p>
                    <p className={`font-medium ${
                      selectedAlarm.alarmLevel === 'critical' ? 'text-danger-400' :
                      selectedAlarm.alarmLevel === 'warning' ? 'text-warning-400' : 'text-primary-400'
                    }`}>
                      {levelTextMap[selectedAlarm.alarmLevel]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-1">告警参数</p>
                    <div className="space-y-1 text-sm text-white">
                      {selectedAlarm.params.temperature !== undefined && (
                        <p>温度: {selectedAlarm.params.temperature}°C</p>
                      )}
                      {selectedAlarm.params.pressure !== undefined && (
                        <p>压力: {selectedAlarm.params.pressure} MPa</p>
                      )}
                      {selectedAlarm.params.voltage !== undefined && (
                        <p>电压: {selectedAlarm.params.voltage} V</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-1">附件</p>
                    {selectedAlarm.attachments && selectedAlarm.attachments.length > 0 ? (
                      <div className="space-y-1">
                        {selectedAlarm.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-primary-400">
                            <Paperclip className="w-3 h-3" />
                            <span>{file}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-dark-400">无附件</p>
                    )}
                  </div>
                </div>

                {selectedAlarm.remark && (
                  <div className="p-3 bg-dark-700 border border-dark-500">
                    <p className="text-xs text-dark-400 mb-1">处理备注</p>
                    <p className="text-sm text-white">{selectedAlarm.remark}</p>
                  </div>
                )}
              </div>

              <div className="card industrial-border">
                <h4 className="font-semibold text-white mb-6 pb-4 border-b border-dark-500 flex items-center gap-2">
                  <History className="w-4 h-4 text-primary-400" />
                  状态变更历史
                </h4>
                <div className="relative pl-8">
                  {getAllHistory(selectedAlarm).map((item, index, arr) => (
                    <div key={item.id} className="relative pb-8 last:pb-0">
                      {index < arr.length - 1 && <div className="timeline-line" />}
                      <div className={`timeline-dot ${getTimelineDotClass(item.status)} -left-2`} />
                      <div className="bg-dark-700 border border-dark-500 p-4 ml-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={getStatusBadgeClass(item.status)}>
                            {statusTextMap[item.status]}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-dark-400">
                            <User className="w-3 h-3" />
                            {item.operatorName}
                          </div>
                        </div>
                        <p className="text-sm text-white mb-1">{item.remark}</p>
                        <p className="text-xs text-dark-400 font-mono">
                          {dayjs(item.time).format('YYYY-MM-DD HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card industrial-border flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="w-12 h-12 text-dark-500 mx-auto mb-3" />
                <p className="text-dark-300">请选择左侧告警记录查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
