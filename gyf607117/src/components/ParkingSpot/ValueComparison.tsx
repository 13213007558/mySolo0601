import { useState } from 'react';
import { AlertTriangle, CheckCircle, Edit3, Save, X } from 'lucide-react';
import type { ParkingSpot } from '../../types';
import { cn } from '../../utils/helpers';
import { useParkingStore } from '../../store/parkingStore';

interface ValueComparisonProps {
  spot: ParkingSpot;
}

const ValueComparison = ({ spot }: ValueComparisonProps) => {
  const { updateSpotValues } = useParkingStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editExportValue, setEditExportValue] = useState(spot.exportValue);
  const [editActualValue, setEditActualValue] = useState(spot.actualValue);
  const [editReason, setEditReason] = useState('');

  const isMismatch = spot.exportValue !== spot.actualValue;

  const handleSave = () => {
    if (!editReason.trim()) {
      alert('请填写修改原因');
      return;
    }
    updateSpotValues(spot.id, editExportValue, editActualValue, editReason);
    setIsEditing(false);
    setEditReason('');
  };

  const handleCancel = () => {
    setEditExportValue(spot.exportValue);
    setEditActualValue(spot.actualValue);
    setEditReason('');
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="card-industrial p-4 text-center">
          <div className="text-xs text-industrial-muted mb-2">系统导出值</div>
          {isEditing ? (
            <select
              value={editExportValue}
              onChange={(e) => setEditExportValue(Number(e.target.value))}
              className="w-full bg-industrial-bg border border-industrial-border rounded-sm px-3 py-2 font-mono-nums text-2xl font-bold text-center text-industrial-text"
            >
              <option value={0}>0 (空闲)</option>
              <option value={1}>1 (占用)</option>
            </select>
          ) : (
            <div className={cn(
              'font-mono-nums text-3xl font-bold',
              isMismatch ? 'text-alert-red' : 'text-industrial-text'
            )}>
              {spot.exportValue}
            </div>
          )}
          <div className="text-xs text-industrial-muted mt-1">
            {spot.exportValue === 1 ? '占用' : '空闲'}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            isMismatch ? 'bg-alert-red/20' : 'bg-alert-green/20'
          )}>
            {isMismatch ? (
              <AlertTriangle size={32} className="text-alert-red" />
            ) : (
              <CheckCircle size={32} className="text-alert-green" />
            )}
          </div>
        </div>

        <div className="card-industrial p-4 text-center">
          <div className="text-xs text-industrial-muted mb-2">实际状态值</div>
          {isEditing ? (
            <select
              value={editActualValue}
              onChange={(e) => setEditActualValue(Number(e.target.value))}
              className="w-full bg-industrial-bg border border-industrial-border rounded-sm px-3 py-2 font-mono-nums text-2xl font-bold text-center text-industrial-text"
            >
              <option value={0}>0 (空闲)</option>
              <option value={1}>1 (占用)</option>
            </select>
          ) : (
            <div className={cn(
              'font-mono-nums text-3xl font-bold',
              isMismatch ? 'text-alert-green' : 'text-industrial-text'
            )}>
              {spot.actualValue}
            </div>
          )}
          <div className="text-xs text-industrial-muted mt-1">
            {spot.actualValue === 1 ? '占用' : '空闲'}
          </div>
        </div>
      </div>

      {isMismatch && !isEditing && (
        <div className="bg-alert-red/10 border border-alert-red/30 p-3 rounded-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-alert-red flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-alert-red">数据不一致警告</div>
              <div className="text-sm text-industrial-muted mt-1">
                系统导出显示该车位为<span className="text-alert-red font-medium">{spot.exportValue === 1 ? '占用' : '空闲'}</span>，
                但实际核实为<span className="text-alert-green font-medium">{spot.actualValue === 1 ? '占用' : '空闲'}</span>。
                请检查截图确认后修正数据。
              </div>
            </div>
          </div>
        </div>
      )}

      {!isMismatch && !isEditing && (
        <div className="bg-alert-green/10 border border-alert-green/30 p-3 rounded-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-alert-green" />
            <span className="text-alert-green font-medium">数据已对齐，导出值与实际状态一致</span>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-industrial-muted block mb-1">修改原因 <span className="text-alert-red">*</span></label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="请详细说明修改原因，如：中午巡查发现、截图核实、系统异常等"
              className="w-full bg-industrial-bg border border-industrial-border rounded-sm px-3 py-2 text-industrial-text placeholder-industrial-muted/50 resize-none h-20"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className="btn-secondary flex items-center gap-2">
              <X size={16} />
              取消
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save size={16} />
              保存修改
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit3 size={16} />
            修正数据
          </button>
        </div>
      )}
    </div>
  );
};

export default ValueComparison;
