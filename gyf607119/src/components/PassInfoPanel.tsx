import { useState } from 'react';
import { FileText, User, Clock, Plus, Check, Shield } from 'lucide-react';
import { useGateStore } from '../store/useGateStore';
import { maskPhoneNumber } from '../utils/storage';
import { cn } from '@/lib/utils';

export function PassInfoPanel() {
  const { gates, updatePassDescription, setSelectedGateId, setShowDiffViewer } = useGateStore();
  const [selectedGateForEdit, setSelectedGateForEdit] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const gatesWithPassInfo = gates.filter((g) => g.passDescription);
  const manuallyEnteredGates = gates.filter((g) => g.isManualEntry);

  const handleSubmit = (gateId: string) => {
    if (!newDescription.trim()) return;
    
    updatePassDescription(gateId, newDescription, '小乔');
    setNewDescription('');
    setSelectedGateForEdit(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleViewDiff = (gateId: string) => {
    setSelectedGateId(gateId);
    setShowDiffViewer(true);
  };

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="bg-industrial-green-50 border-2 border-industrial-green-300 p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-industrial-green-600" />
          <span className="text-industrial-green-700 font-medium">
            放行说明补录成功！数据已自动保存。
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="industrial-card p-4 border-2 bg-industrial-blue-50 border-industrial-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-industrial-blue-100 rounded">
              <FileText className="w-5 h-5 text-industrial-blue-600" />
            </div>
            <div>
              <p className="text-sm text-industrial-blue-600">已有放行说明</p>
              <p className="text-2xl font-bold font-mono text-industrial-blue-700">
                {gatesWithPassInfo.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="industrial-card p-4 border-2 bg-industrial-green-50 border-industrial-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-industrial-green-100 rounded">
              <User className="w-5 h-5 text-industrial-green-600" />
            </div>
            <div>
              <p className="text-sm text-industrial-green-600">小乔手工补录</p>
              <p className="text-2xl font-bold font-mono text-industrial-green-700">
                {manuallyEnteredGates.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="industrial-card p-4 border-2 bg-industrial-orange-50 border-industrial-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-industrial-orange-100 rounded">
              <Shield className="w-5 h-5 text-industrial-orange-600" />
            </div>
            <div>
              <p className="text-sm text-industrial-orange-600">隐私保护</p>
              <p className="text-2xl font-bold font-mono text-industrial-orange-700">
                已启用
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="industrial-card border-2">
        <div className="px-6 py-4 bg-industrial-gray-50 border-b border-industrial-gray-200 flex items-center justify-between">
          <h3 className="panel-title">道闸放行说明列表</h3>
          <p className="text-sm text-industrial-gray-500">
            所有手机号已自动脱敏处理（如 138****1234）
          </p>
        </div>
        
        <div className="divide-y divide-industrial-gray-200">
          {gates.map((gate) => (
            <div key={gate.id} className="p-4 hover:bg-industrial-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-bold text-industrial-gray-800">
                      {gate.gateNo}
                    </span>
                    <span className="text-industrial-gray-500">{gate.location}</span>
                    {gate.isManualEntry && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-industrial-blue-100 text-industrial-blue-600 text-xs font-medium rounded">
                        <User className="w-3 h-3" />
                        小乔补录
                      </span>
                    )}
                  </div>
                  
                  {gate.passDescription ? (
                    <p className="text-industrial-gray-700 leading-relaxed">
                      {maskPhoneNumber(gate.passDescription)}
                    </p>
                  ) : (
                    <p className="text-industrial-gray-400 italic">暂无放行说明</p>
                  )}
                  
                  {gate.manualEntryTime && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-industrial-gray-500">
                      <Clock className="w-3 h-3" />
                      补录时间：{gate.manualEntryTime}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  {gate.isManualEntry && gate.originalPassDescription && (
                    <button
                      onClick={() => handleViewDiff(gate.id)}
                      className="industrial-btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
                    >
                      查看差异
                    </button>
                  )}
                  
                  {selectedGateForEdit === gate.id ? (
                    <button
                      onClick={() => setSelectedGateForEdit(null)}
                      className="industrial-btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
                    >
                      取消
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedGateForEdit(gate.id);
                        setNewDescription(gate.passDescription || '');
                      }}
                      className="industrial-btn-primary text-xs py-1.5 px-3 whitespace-nowrap inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {gate.passDescription ? '编辑' : '补录'}
                    </button>
                  )}
                </div>
              </div>
              
              {selectedGateForEdit === gate.id && (
                <div className="mt-4 p-4 bg-industrial-blue-50 border-2 border-industrial-blue-200">
                  <p className="text-sm text-industrial-blue-700 font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    小乔补录道闸放行说明
                  </p>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="请输入道闸放行说明，包括放行原因、车辆信息、预计恢复时间等..."
                    className="input-field w-full h-24 mb-3 resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-industrial-gray-500">
                      提示：系统会自动对手机号进行脱敏处理，保护隐私安全
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedGateForEdit(null)}
                        className="industrial-btn-secondary text-sm py-1.5 px-4"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSubmit(gate.id)}
                        disabled={!newDescription.trim()}
                        className={cn(
                          'industrial-btn-primary text-sm py-1.5 px-4',
                          !newDescription.trim() && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        确认补录
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="industrial-card p-4 border-2 bg-industrial-gray-50">
        <h4 className="font-semibold text-industrial-gray-800 mb-2">💡 使用说明</h4>
        <ul className="text-sm text-industrial-gray-600 space-y-1 list-disc list-inside">
          <li>点击「补录」按钮可以为道闸添加或编辑放行说明</li>
          <li>补录人固定为「小乔」，系统会自动记录补录时间</li>
          <li>所有手机号在显示时会自动脱敏（如 13812345678 → 138****5678）</li>
          <li>补录数据会自动保存到本地，刷新页面不会丢失</li>
          <li>使用「导出 JSON」可以备份数据，「导入 JSON」可以恢复数据</li>
        </ul>
      </div>
    </div>
  );
}
