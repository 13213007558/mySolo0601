import { AlertTriangle, Clock, CheckCircle, Activity, Zap, Info } from 'lucide-react';
import { useAlarmStore } from '@/store/useAlarmStore';
import { StatCard } from '@/components/StatCard';
import { StatusFilter } from '@/components/StatusFilter';
import { ActionBar } from '@/components/ActionBar';
import { AlarmList } from '@/components/AlarmList';
import { DetailModal } from '@/components/DetailModal';
import { PhotoCompare } from '@/components/PhotoCompare';

export default function AlarmWall() {
  const { getStats, alarms, selectedAlarmId, setSelectedAlarm, showPhotoCompare, comparePhotoIds, setShowPhotoCompare } = useAlarmStore();
  const stats = getStats();

  const selectedAlarm = alarms.find((a) => a.id === selectedAlarmId);

  const beforePhoto = comparePhotoIds
    ? alarms.flatMap((a) => a.inspectionPhotos).find((p) => p.id === comparePhotoIds.before)
    : null;

  const afterPhoto = comparePhotoIds
    ? alarms.flatMap((a) => a.manualPhotos).find((p) => p.id === comparePhotoIds.after)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-mono text-xl font-bold text-gray-900">能源汇流箱熔丝告警墙</h1>
                <p className="text-xs text-gray-500">从客户邮件附件到处理结果 · 全流程可追溯</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Info className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                数据自动保存至本地 · 刷新不丢失
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 via-amber-50 to-emerald-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-500 p-1.5 text-white">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-800">功能验证说明</h2>
              <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600 md:grid-cols-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                  <span><strong>可展开区域：</strong>点击卡片底部"展开查看照片和历史"按钮</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
                  <span><strong>异常值保留：</strong>异常时原始值显示删除线，保留原值</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-600" />
                  <span><strong>附件丢失保护：</strong>ID为FUSE-ATTACHMENT-LOST的记录</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-600" />
                  <span><strong>撤回/重新提交：</strong>ID为FUSE-WITHDRAW-SAMPLE的记录</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-pink-600" />
                  <span><strong>叶师傅补录：</strong>紫色标签卡片，点击"查看差异"按钮</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-600" />
                  <span><strong>人工补录样例：</strong>蓝色标签卡片，ID固定MANUAL-SAMPLE-001</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="告警总数"
            value={stats.total}
            icon={<Activity className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="异常告警"
            value={stats.abnormal}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
          />
          <StatCard
            title="待处理"
            value={stats.pending}
            icon={<Clock className="h-6 w-6" />}
            color="orange"
          />
          <StatCard
            title="已完成"
            value={stats.completed}
            icon={<CheckCircle className="h-6 w-6" />}
            color="green"
          />
        </div>

        <div className="mb-4">
          <StatusFilter />
        </div>

        <div className="mb-4">
          <ActionBar />
        </div>

        <AlarmList />
      </main>

      {selectedAlarm && (
        <DetailModal alarm={selectedAlarm} onClose={() => setSelectedAlarm(null)} />
      )}

      {showPhotoCompare && beforePhoto && afterPhoto && (
        <PhotoCompare
          beforePhoto={beforePhoto}
          afterPhoto={afterPhoto}
          onClose={() => setShowPhotoCompare(false)}
        />
      )}
    </div>
  );
}
