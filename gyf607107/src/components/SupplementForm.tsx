import { useState } from 'react';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useUserStore } from '@/store/useUserStore';
import { computeDiff, formatDiffAsText } from '@/utils/diff';
import type { Alarm } from '@/types';
import { FilePlus, X, AlertTriangle } from 'lucide-react';

interface SupplementFormProps {
  alarm: Alarm;
  onClose: () => void;
}

export const SupplementForm = ({ alarm, onClose }: SupplementFormProps) => {
  const { addSupplement, updateAlarm } = useAlarmStore();
  const { addHistory } = useHistoryStore();
  const { currentUser } = useUserStore();

  const [formData, setFormData] = useState({
    defectType: alarm.defectType,
    severity: alarm.severity,
    conclusion: alarm.conclusion,
    content: '',
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      alert('请输入补录内容');
      return;
    }

    const beforeData = {
      defectType: alarm.defectType,
      severity: alarm.severity,
      conclusion: alarm.conclusion,
    };

    const afterData = {
      defectType: formData.defectType,
      severity: formData.severity,
      conclusion: formData.conclusion,
    };

    const diffs = computeDiff(beforeData, afterData);
    const beforeText = formatDiffAsText(diffs.map((d) => ({ ...d, newValue: d.oldValue, oldValue: d.newValue })));
    const afterText = formatDiffAsText(diffs);

    addSupplement({
      alarmId: alarm.id,
      author: currentUser?.name || '周顾问',
      content: formData.content,
      beforeData: beforeText || JSON.stringify(beforeData),
      afterData: afterText || JSON.stringify(afterData),
    });

    updateAlarm(alarm.id, {
      defectType: formData.defectType,
      severity: formData.severity,
      conclusion: formData.conclusion,
    });

    addHistory({
      alarmId: alarm.id,
      operator: currentUser?.name || '周顾问',
      action: 'supplement',
      oldReason: beforeText || JSON.stringify(beforeData),
      newRemark: `${formData.content}\n${afterText}`,
    });

    alert('补录标注已保存');
    onClose();
  };

  const diffs = computeDiff(
    {
      defectType: alarm.defectType,
      severity: alarm.severity,
      conclusion: alarm.conclusion,
    },
    {
      defectType: formData.defectType,
      severity: formData.severity,
      conclusion: formData.conclusion,
    }
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-industrial-card border border-industrial-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-industrial-border">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-industrial-warning" />
            <h3 className="text-lg font-semibold text-industrial-text">周顾问手工补录标注</h3>
          </div>
          <button
            onClick={onClose}
            className="text-industrial-textMuted hover:text-industrial-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-industrial-warning/10 border-b border-industrial-warning/30">
          <div className="flex items-center gap-2 text-industrial-warning">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">正在补录：{alarm.siteName} - {alarm.bladeNo}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[60vh] scrollbar-thin">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-industrial-textMuted mb-1">缺陷类型</label>
              <input
                type="text"
                className="input-industrial"
                value={formData.defectType}
                onChange={(e) => handleChange('defectType', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-industrial-textMuted mb-1">严重程度</label>
              <select
                className="input-industrial"
                value={formData.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="critical">严重</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-industrial-textMuted mb-1">处理结论</label>
              <textarea
                className="input-industrial min-h-24"
                value={formData.conclusion}
                onChange={(e) => handleChange('conclusion', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-industrial-textMuted mb-1">补录说明 *</label>
              <textarea
                className="input-industrial min-h-24"
                placeholder="请详细描述补录的叶片裂纹标注信息..."
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPreview"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                className="w-4 h-4 rounded border-industrial-border bg-industrial-bg text-industrial-primary focus:ring-industrial-primary"
              />
              <label htmlFor="showPreview" className="text-sm text-industrial-textMuted">
                显示补录前后差异对比
              </label>
            </div>

            {showPreview && diffs.length > 0 && (
              <div className="p-4 bg-industrial-bg rounded border border-industrial-border">
                <h4 className="text-sm font-medium text-industrial-text mb-3">补录前后差异</h4>
                <div className="space-y-2">
                  {diffs.map((diff, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        diff.type === 'modified'
                          ? 'bg-yellow-900/20 border border-yellow-700/50'
                          : 'bg-industrial-card'
                      }`}
                    >
                      <div className="font-medium text-industrial-text">{diff.field}</div>
                      <div className="text-red-400 line-through">旧: "{diff.oldValue}"</div>
                      <div className="text-green-400">新: "{diff.newValue}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-industrial-border">
            <button
              type="button"
              className="btn-industrial"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-warning"
            >
              保存补录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
