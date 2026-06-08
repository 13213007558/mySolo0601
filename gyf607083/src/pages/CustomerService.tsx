import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Headphones, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Plus,
  FileText,
  RefreshCw,
  Check,
  X,
  Baby,
  AlertCircle,
  Info,
  Clock
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { 
  RecordStatus, 
  STATUS_LABELS, 
  ITEM_TYPE_LABELS, 
  HandleExceptionRequest,
  CreateManualRecordRequest,
  ItemType,
  SupplyRecord
} from '../../shared/types';

interface HandleModalProps {
  record: SupplyRecord;
  onClose: () => void;
  onSubmit: (action: 'approve' | 'reject' | 'reissue' | 'close', reason: string) => void;
  loading: boolean;
}

const HandleModal: React.FC<HandleModalProps> = ({ record, onClose, onSubmit, loading }) => {
  const [action, setAction] = useState<'approve' | 'reject' | 'reissue' | 'close'>('reject');
  const [reason, setReason] = useState('');

  const actionOptions = [
    { value: 'approve', label: '通过', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'reject', label: '拒绝', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'reissue', label: '补发', icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'close', label: '关闭', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">处理异常记录</h3>
          <p className="text-sm text-gray-500 mt-1">{record.babyName} - {record.itemName}</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">当前状态</span>
              <StatusBadge status={record.status} showManualTag isManual={record.isManual} />
            </div>
            {record.remark && (
              <p className="text-sm text-gray-600 bg-white p-2 rounded">
                备注：{record.remark}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择处理方式</label>
            <div className="grid grid-cols-2 gap-3">
              {actionOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setAction(option.value as any)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      action === option.value
                        ? `border-current ${option.color} ${option.bg}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} className={action === option.value ? option.color : 'text-gray-400'} />
                    <span className={action === option.value ? 'font-medium' : 'text-gray-600'}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">处理原因</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请详细说明处理原因..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              required
            />
          </div>

          {record.statusHistory.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">历史变更</label>
              <div className="max-h-48 overflow-y-auto">
                <StatusTimeline statusHistory={record.statusHistory} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit(action, reason)}
            disabled={loading || !reason.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : '确认处理'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ManualModalProps {
  onClose: () => void;
  onSubmit: (data: CreateManualRecordRequest) => void;
  loading: boolean;
  babies: { id: string; name: string }[];
}

const ManualModal: React.FC<ManualModalProps> = ({ onClose, onSubmit, loading, babies }) => {
  const [babyId, setBabyId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<ItemType>('other');
  const [remark, setRemark] = useState('');

  const itemTypeOptions: { value: ItemType; label: string }[] = [
    { value: 'bottle', label: '奶瓶' },
    { value: 'towel', label: '毛巾' },
    { value: 'clothes', label: '衣物' },
    { value: 'other', label: '其他' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">手工补录</h3>
          <p className="text-sm text-gray-500 mt-1">手动添加用品发放记录</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择宝宝</label>
            <select
              value={babyId}
              onChange={(e) => setBabyId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">请选择宝宝</option>
              {babies.map(baby => (
                <option key={baby.id} value={baby.id}>{baby.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">物品名称</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="例如：备用奶瓶"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">物品类型</label>
            <div className="grid grid-cols-4 gap-2">
              {itemTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setItemType(option.value)}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    itemType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">补录说明</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请说明补录原因..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              required
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit({ babyId, itemName, itemType, remark })}
            disabled={loading || !babyId || !itemName.trim() || !remark.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : '确认补录'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CustomerService: React.FC = () => {
  const { 
    supplyRecords, 
    babies,
    loading, 
    loadExceptionRecords, 
    loadBabies,
    handleException,
    createManualRecord,
    refreshKey,
    currentUserId
  } = useStore();

  const [selectedRecord, setSelectedRecord] = useState<SupplyRecord | null>(null);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    loadExceptionRecords();
    loadBabies();
  }, [refreshKey]);

  const exceptionRecords = supplyRecords.filter(
    r => r.status === 'pending' || r.status === 'rejected'
  );

  const handleSubmit = async (action: 'approve' | 'reject' | 'reissue' | 'close', reason: string) => {
    if (!selectedRecord) return;

    try {
      let items;
      if (selectedRecord.status === 'closed' && selectedItems.length > 0) {
        items = selectedItems.map(id => ({ itemId: id, action }));
      }

      const result = await handleException({
        recordId: selectedRecord.id,
        action,
        reason,
        operatorId: currentUserId,
        items
      });

      setNotification({
        type: result.partialSuccess ? 'warning' : (result.success ? 'success' : 'error'),
        message: result.message
      });

      setTimeout(() => setNotification(null), 3000);
      setShowHandleModal(false);
      setSelectedRecord(null);
      setSelectedItems([]);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || '操作失败' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleManualSubmit = async (data: CreateManualRecordRequest) => {
    try {
      const result = await createManualRecord({
        ...data,
        operatorId: currentUserId
      });

      setNotification({
        type: 'success',
        message: result.message
      });

      setTimeout(() => setNotification(null), 3000);
      setShowManualModal(false);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || '操作失败' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div>
      {notification && (
        <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
        } text-white animate-pulse`}>
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'warning' && <AlertTriangle size={20} />}
          {notification.type === 'error' && <XCircle size={20} />}
          {notification.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">客服处理中心</h2>
          <p className="text-gray-500">处理用品发放异常记录</p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all"
        >
          <Plus size={20} />
          手工补录
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{exceptionRecords.length}</p>
              <p className="text-sm text-gray-500">待处理异常</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {exceptionRecords.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500">待审核</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {exceptionRecords.filter(r => r.status === 'rejected').length}
              </p>
              <p className="text-sm text-gray-500">已拒绝</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {supplyRecords.filter(r => r.isManual).length}
              </p>
              <p className="text-sm text-gray-500">手工补录</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">操作说明</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>处理异常后，班级页、宝宝详情、后台接口和导出清单会自动同步更新</li>
              <li>已关闭记录追加材料时支持部分成功，返回成功/失败明细</li>
              <li>处理人信息缺失时，审计日志仍会保留记录，方便主管复查</li>
              <li>导出清单中可查看完整状态变更历史，包括拒绝转补发的过程</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          异常记录列表
        </h3>

        {loading.exceptionRecords ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : exceptionRecords.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无异常记录，做得好！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exceptionRecords.map(record => (
              <div
                key={record.id}
                className={`p-4 border rounded-xl transition-all ${
                  record.id === 'record1'
                    ? 'border-orange-300 bg-orange-50/50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-medium">
                      {record.babyName?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/baby/${record.babyId}`} className="font-medium text-gray-800 hover:text-blue-600">
                          {record.babyName}
                        </Link>
                        <StatusBadge status={record.status} showManualTag isManual={record.isManual} />
                        {record.id === 'record1' && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                            小满那条记录
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {record.itemName} · {ITEM_TYPE_LABELS[record.itemType]} · {record.className}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${record.sterilized ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {record.sterilized ? '已消毒' : '未消毒'}
                    </span>
                  </div>
                </div>

                {record.remark && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg mb-3">
                    <span className="font-medium">备注：</span>{record.remark}
                  </p>
                )}

                {record.statusHistory.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">状态变更历史（共 {record.statusHistory.length} 次）：</p>
                    <div className="flex flex-wrap gap-2">
                      {record.statusHistory.map((change, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                          {STATUS_LABELS[change.fromStatus]} → {STATUS_LABELS[change.toStatus]}
                          {change.operatorName ? ` (${change.operatorName})` : ' (处理人缺失)'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Baby size={12} />
                    <span>创建于 {new Date(record.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.status === 'closed' && (
                      <div className="flex items-center gap-2 mr-4">
                        <label className="flex items-center gap-1 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(record.id)}
                            onChange={() => toggleItemSelection(record.id)}
                            className="rounded text-blue-500"
                          />
                          追加材料（部分成功测试）
                        </label>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowHandleModal(true);
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:shadow-md hover:shadow-blue-200 transition-all text-sm font-medium"
                    >
                      <Headphones size={16} />
                      处理
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showHandleModal && selectedRecord && (
        <HandleModal
          record={selectedRecord}
          onClose={() => {
            setShowHandleModal(false);
            setSelectedRecord(null);
            setSelectedItems([]);
          }}
          onSubmit={handleSubmit}
          loading={loading.handleException}
        />
      )}

      {showManualModal && (
        <ManualModal
          onClose={() => setShowManualModal(false)}
          onSubmit={handleManualSubmit}
          loading={loading.createManual}
          babies={babies.map(b => ({ id: b.id, name: b.name }))}
        />
      )}
    </div>
  );
};

export default CustomerService;
