import { useState } from 'react';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useUserStore } from '@/store/useUserStore';
import {
  Upload,
  Filter,
  RotateCcw,
  Eye,
  Download,
  User,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { readFileAsText, parseJSON, parseCSV } from '@/utils/import';
import {
  validateExportConsistency,
  exportToJSON,
  exportToCSV,
  downloadFile,
} from '@/utils/export';
import type { Alarm } from '@/types';

interface OperationToolbarProps {
  onFilterClick: () => void;
}

export const OperationToolbar = ({ onFilterClick }: OperationToolbarProps) => {
  const {
    alarms,
    selectedIds,
    addAlarms,
    withdrawAlarm,
    reviewAlarm,
    stats,
    resetData,
  } = useAlarmStore();
  const { addHistory } = useHistoryStore();
  const { currentUser, canWithdraw, canReview, canExportRaw, users, switchUser } =
    useUserStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      let parsedAlarms: Alarm[];

      if (file.name.endsWith('.json')) {
        parsedAlarms = parseJSON(content);
      } else if (file.name.endsWith('.csv')) {
        parsedAlarms = parseCSV(content);
      } else {
        alert('不支持的文件格式，请上传 JSON 或 CSV 文件');
        return;
      }

      const result = addAlarms(parsedAlarms);

      parsedAlarms.forEach((alarm) => {
        addHistory({
          alarmId: alarm.id,
          operator: currentUser?.name || '未知',
          action: 'import',
          newRemark: `从文件 ${file.name} 导入`,
        });
      });

      if (result.conflicts.length > 0) {
        alert(
          `发现 ${result.conflicts.length} 个同名站点冲突，请在弹窗中处理。已安全导入 ${result.added.length} 条无冲突数据。`
        );
      } else {
        alert(`成功导入 ${parsedAlarms.length} 条告警数据`);
      }
    } catch (error) {
      alert(`导入失败：${(error as Error).message}`);
    }

    e.target.value = '';
  };

  const handleWithdraw = () => {
    if (!canWithdraw()) {
      alert('只有主管可以执行撤回操作');
      return;
    }
    if (selectedIds.length === 0) {
      alert('请先选择要撤回的告警');
      return;
    }
    const reason = prompt('请输入撤回理由：');
    if (!reason) return;

    selectedIds.forEach((id) => {
      const alarm = alarms.find((a) => a.id === id);
      if (alarm) {
        const oldReason = alarm.conclusion;
        withdrawAlarm(id, reason);
        addHistory({
          alarmId: id,
          operator: currentUser?.name || '未知',
          action: 'withdraw',
          oldReason,
          newRemark: reason,
        });
      }
    });
    alert(`已撤回 ${selectedIds.length} 条告警结论`);
  };

  const handleReview = () => {
    if (!canReview()) {
      alert('只有主管可以执行复核操作');
      return;
    }
    if (selectedIds.length === 0) {
      alert('请先选择要复核的告警');
      return;
    }
    const remark = prompt('请输入复核意见：');
    if (!remark) return;

    selectedIds.forEach((id) => {
      const alarm = alarms.find((a) => a.id === id);
      if (alarm) {
        reviewAlarm(id, remark);
        addHistory({
          alarmId: id,
          operator: currentUser?.name || '未知',
          action: 'review',
          oldReason: alarm.conclusion,
          newRemark: remark,
        });
      }
    });
    alert(`已复核 ${selectedIds.length} 条告警`);
  };

  const handleExport = (format: 'json' | 'csv') => {
    const dataToExport = selectedIds.length > 0
      ? alarms.filter((a) => selectedIds.includes(a.id))
      : alarms;

    if (dataToExport.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    const cardStats = stats;
    const validation = validateExportConsistency(dataToExport, cardStats);

    if (validation.warnings.length > 0) {
      const confirm = window.confirm(
        `导出数据存在不一致：\n${validation.warnings.join('\n')}\n\n是否继续导出？`
      );
      if (!confirm) return;
    }

    const config = {
      maskPhone: !canExportRaw(),
      includeHistory: true,
      includeSupplement: true,
    };

    const history = useHistoryStore.getState().history;
    const supplements = useAlarmStore.getState().supplements;
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      const content = exportToJSON(dataToExport, history, supplements, config);
      downloadFile(content, `告警数据_${timestamp}.json`, 'application/json');
    } else {
      const content = exportToCSV(dataToExport, config);
      downloadFile(content, `告警数据_${timestamp}.csv`, 'text/csv');
    }

    setShowExportMenu(false);
    alert(`成功导出 ${dataToExport.length} 条数据`);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
      resetData();
      useHistoryStore.getState().clearHistory();
      alert('数据已重置');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <label className="btn-industrial flex items-center gap-2 cursor-pointer">
        <Upload className="w-4 h-4" />
        导入
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleImport}
          className="hidden"
        />
      </label>

      <button
        className="btn-industrial flex items-center gap-2"
        onClick={onFilterClick}
      >
        <Filter className="w-4 h-4" />
        筛选
      </button>

      <button
        className="btn-danger flex items-center gap-2"
        onClick={handleWithdraw}
        disabled={!canWithdraw()}
      >
        <RotateCcw className="w-4 h-4" />
        撤回
      </button>

      <button
        className="btn-success flex items-center gap-2"
        onClick={handleReview}
        disabled={!canReview()}
      >
        <Eye className="w-4 h-4" />
        复核
      </button>

      <div className="relative">
        <button
          className="btn-warning flex items-center gap-2"
          onClick={() => setShowExportMenu(!showExportMenu)}
        >
          <Download className="w-4 h-4" />
          导出
          <ChevronDown className="w-4 h-4" />
        </button>
        {showExportMenu && (
          <div className="absolute top-full left-0 mt-1 bg-industrial-card border border-industrial-border rounded shadow-lg z-50 min-w-32">
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-industrial-bg transition-colors"
              onClick={() => handleExport('json')}
            >
              导出 JSON
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-industrial-bg transition-colors"
              onClick={() => handleExport('csv')}
            >
              导出 CSV
            </button>
          </div>
        )}
      </div>

      <button
        className="btn-industrial flex items-center gap-2 ml-auto"
        onClick={handleReset}
        title="重置所有数据"
      >
        <RefreshCw className="w-4 h-4" />
        重置
      </button>

      <div className="relative">
        <button
          className="btn-industrial flex items-center gap-2"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <User className="w-4 h-4" />
          {currentUser?.name}
          <span className="text-xs text-industrial-textMuted">
            ({currentUser?.role === 'supervisor' ? '主管' : '顾问'})
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
        {showUserMenu && (
          <div className="absolute top-full right-0 mt-1 bg-industrial-card border border-industrial-border rounded shadow-lg z-50 min-w-40">
            {users.map((user) => (
              <button
                key={user.id}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-industrial-bg transition-colors ${
                  currentUser?.id === user.id ? 'text-industrial-primaryLight' : ''
                }`}
                onClick={() => {
                  switchUser(user.id);
                  setShowUserMenu(false);
                }}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-industrial-textMuted">
                  {user.role === 'supervisor' ? '主管' : '顾问'}
                  {user.canExportRaw ? ' · 可导出原始数据' : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
