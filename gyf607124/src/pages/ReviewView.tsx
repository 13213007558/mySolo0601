import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AuditTimeline from '@/components/AuditTimeline';
import UndoModal from '@/components/UndoModal';
import AnomalyFeedback from '@/components/AnomalyFeedback';
import { useViewStore } from '@/store/viewStore';
import { useAuditStore } from '@/store/auditStore';

export default function ReviewView() {
  const { anomalyState } = useViewStore();
  const { showUndoModal } = useAuditStore();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="px-6 py-6">
        <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {anomalyState === 'undo_reason_override' && (
            <div className="mb-4">
              <AnomalyFeedback type="undo_reason_override" />
            </div>
          )}

          <div className="mb-4 p-4 bg-primary-500/5 border border-primary-500/20 rounded-lg">
            <h3 className="font-medium text-primary-700 mb-1">🔍 复盘视图</h3>
            <p className="text-sm text-gray-600">
              此视图用于查看所有操作的审计痕迹，支持按操作类型筛选和搜索。主管角色可执行撤回操作。
              点击记录卡片可展开查看详细修改历史和变更对比。
            </p>
          </div>

          <AuditTimeline />
        </div>
      </main>

      {showUndoModal && <UndoModal />}
    </div>
  );
}
