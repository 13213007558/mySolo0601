import { useState } from 'react';
import { Edit3, X, Send } from 'lucide-react';
import type { Cylinder, CylinderStatus } from '@/types';
import { statusLabels } from '@/types';
import { useCylinderStore } from '@/store/useCylinderStore';

interface StatusUpdateFormProps {
  cylinder: Cylinder;
  onClose: () => void;
}

const StatusUpdateForm = ({ cylinder, onClose }: StatusUpdateFormProps) => {
  const [newStatus, setNewStatus] = useState<CylinderStatus>(cylinder.currentStatus);
  const [reason, setReason] = useState('');
  const [remark, setRemark] = useState('');
  const [operator, setOperator] = useState('王主管');

  const updateCylinderStatus = useCylinderStore(state => state.updateCylinderStatus);

  const statusOptions: CylinderStatus[] = [
    'normal',
    'processing',
    'completed',
    'inspecting',
    'overdue',
    'repaired',
  ];

  const handleSubmit = () => {
    if (!newStatus || !reason.trim()) {
      alert('请选择新状态并填写处理原因');
      return;
    }

    if (newStatus === cylinder.currentStatus) {
      alert('新状态与当前状态相同，请选择不同的状态');
      return;
    }

    updateCylinderStatus(cylinder.id, newStatus, operator, reason.trim(), remark.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-industrial w-full max-w-lg p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-industrial-400" />
            修改气瓶状态
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-industrial-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-industrial-800/50 rounded-sm">
          <p className="text-sm text-industrial-400">气瓶编号</p>
          <p className="font-mono text-white">{cylinder.code}</p>
          <p className="text-xs text-industrial-500 mt-1">{cylinder.location}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label-text">当前状态</label>
            <div className="p-3 bg-industrial-800/50 rounded-sm text-white">
              {statusLabels[cylinder.currentStatus]}
            </div>
          </div>

          <div>
            <label className="label-text">新状态</label>
            <select
              className="input-field"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as CylinderStatus)}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">处理原因</label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="请输入处理原因..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <div>
            <label className="label-text">备注（可选）</label>
            <textarea
              className="input-field min-h-[60px]"
              placeholder="添加备注信息..."
              value={remark}
              onChange={e => setRemark(e.target.value)}
            />
          </div>

          <div>
            <label className="label-text">操作人</label>
            <input
              type="text"
              className="input-field"
              value={operator}
              onChange={e => setOperator(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
              <Send className="w-4 h-4" />
              确认修改
            </button>
            <button onClick={onClose} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateForm;
