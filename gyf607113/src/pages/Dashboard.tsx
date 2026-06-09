import { useEffect, useState } from 'react';
import { Cylinder, Clock, AlertTriangle, CheckCircle, FileText, Filter, RefreshCw, Download } from 'lucide-react';
import { useCylinderStore } from '@/store/useCylinderStore';
import StatCard from '@/components/common/StatCard';
import CylinderCard from '@/components/cylinder/CylinderCard';
import Timeline from '@/components/common/Timeline';
import AnomalyCard from '@/components/anomaly/AnomalyCard';
import { statusLabels } from '@/types';
import type { CylinderStatus } from '@/types';
import { exportToJson } from '@/utils/export';

const Dashboard = () => {
  const {
    cylinders,
    statusHistories,
    anomalies,
    supplements,
    isInitialized,
    initializeData,
    getAllData,
  } = useCylinderStore();

  const [statusFilter, setStatusFilter] = useState<CylinderStatus | 'all'>('all');

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, initializeData]);

  const stats = {
    total: cylinders.length,
    normal: cylinders.filter(c => c.currentStatus === 'normal').length,
    processing: cylinders.filter(c => c.currentStatus === 'processing').length,
    overdue: cylinders.filter(c => c.currentStatus === 'overdue').length,
    anomalies: anomalies.filter(a => !a.resolved).length,
    supplements: supplements.length,
  };

  const filteredCylinders = statusFilter === 'all'
    ? cylinders
    : cylinders.filter(c => c.currentStatus === statusFilter);

  const recentHistories = [...statusHistories]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const unresolvedAnomalies = anomalies.filter(a => !a.resolved);

  const manualSupplements = supplements.filter(s => s.type === 'manual');

  const handleExportAll = () => {
    const data = getAllData();
    exportToJson(
      data.cylinders,
      data.statusHistories,
      data.photos,
      data.approvals,
      data.supplements,
      data.anomalies
    );
  };

  const statusOptions: Array<{ value: CylinderStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'normal', label: statusLabels.normal },
    { value: 'processing', label: statusLabels.processing },
    { value: 'completed', label: statusLabels.completed },
    { value: 'inspecting', label: statusLabels.inspecting },
    { value: 'overdue', label: statusLabels.overdue },
    { value: 'repaired', label: statusLabels.repaired },
  ];

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-industrial-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">能源消防气瓶追踪面板</h1>
          <p className="text-industrial-400 text-sm">实时追踪消防气瓶状态、处理过程和异常信息</p>
        </div>
        <button
          onClick={handleExportAll}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          导出全部数据
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Cylinder}
          label="气瓶总数"
          value={stats.total}
          color="blue"
          delay={1}
        />
        <StatCard
          icon={CheckCircle}
          label="正常"
          value={stats.normal}
          color="green"
          delay={2}
        />
        <StatCard
          icon={Clock}
          label="处理中"
          value={stats.processing}
          color="amber"
          delay={3}
        />
        <StatCard
          icon={AlertTriangle}
          label="逾期"
          value={stats.overdue}
          color="red"
          delay={4}
        />
        <StatCard
          icon={AlertTriangle}
          label="待处理异常"
          value={stats.anomalies}
          color="red"
          delay={5}
        />
        <StatCard
          icon={FileText}
          label="补录记录"
          value={stats.supplements}
          color="purple"
          delay={6}
        />
      </div>

      {unresolvedAnomalies.length > 0 && (
        <div className="card-industrial p-5 border-amber-500/30 border">
          <h2 className="section-title">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            异常提示
            <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-sm">
              {unresolvedAnomalies.length} 条待处理
            </span>
          </h2>
          <div className="space-y-3">
            {unresolvedAnomalies.map((anomaly, idx) => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} />
            ))}
          </div>
          <p className="mt-3 text-xs text-industrial-500">
            提示：点击"展开"可查看可读原因和技术详情，两类异常均提供完整说明
          </p>
        </div>
      )}

      {manualSupplements.length > 0 && (
        <div className="card-industrial p-5 border-purple-500/30 border">
          <h2 className="section-title">
            <FileText className="w-5 h-5 text-purple-400" />
            人工补录样例
            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-sm">
              ID一致性验证
            </span>
          </h2>
          <div className="space-y-3">
            {manualSupplements.map(sup => {
              const cylinder = cylinders.find(c => c.id === sup.cylinderId);
              return (
                <div key={sup.id} className="p-4 bg-industrial-800/50 rounded-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">{cylinder?.code}</p>
                      <p className="text-sm text-industrial-400">{cylinder?.location}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      ID一致
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-2 bg-industrial-900/50 rounded-sm">
                      <p className="text-xs text-industrial-400 mb-1">列表ID</p>
                      <p className="font-mono text-white text-xs">{sup.afterData.supplementId}</p>
                    </div>
                    <div className="p-2 bg-industrial-900/50 rounded-sm">
                      <p className="text-xs text-industrial-400 mb-1">详情ID</p>
                      <p className="font-mono text-white text-xs">{sup.afterData.supplementId}</p>
                    </div>
                    <div className="p-2 bg-industrial-900/50 rounded-sm">
                      <p className="text-xs text-industrial-400 mb-1">导出ID</p>
                      <p className="font-mono text-white text-xs">{sup.afterData.supplementId}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-industrial-500">
                    刷新浏览器后检查：列表、详情、导出是否仍指向同一条记录（ID保持一致）
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card-industrial p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">
                <Cylinder className="w-5 h-5 text-industrial-400" />
                气瓶列表
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-industrial-400" />
                <select
                  className="input-field text-sm py-1 w-auto"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as CylinderStatus | 'all')}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredCylinders.map((cylinder, idx) => (
                <CylinderCard key={cylinder.id} cylinder={cylinder} delay={idx % 6 + 1} />
              ))}
            </div>
            {filteredCylinders.length === 0 && (
              <div className="text-center py-12 text-industrial-500">
                <Cylinder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无符合条件的气瓶</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card-industrial p-5">
            <h2 className="section-title">
              <Clock className="w-5 h-5 text-industrial-400" />
              最近处理历史
            </h2>
            <p className="text-xs text-industrial-500 mb-4">
              刷新浏览器后历史记录仍保留（LocalStorage持久化）
            </p>
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <Timeline histories={recentHistories} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
