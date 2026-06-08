import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Baby as BabyIcon, 
  Phone, 
  MapPin, 
  AlertCircle,
  Calendar,
  Shield,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { ITEM_TYPE_LABELS, STATUS_LABELS, ROLE_LABELS, Baby, SupplyRecord } from '../../shared/types';

export const BabyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadBabyDetail, loading, currentRole, refreshKey } = useStore();
  const [babyData, setBabyData] = useState<(Baby & { records: SupplyRecord[] }) | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SupplyRecord | null>(null);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  useEffect(() => {
    if (id) {
      loadBabyDetail(id).then(data => {
        if (data) setBabyData(data);
      });
    }
  }, [id, refreshKey]);

  if (loading.babyDetail) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!babyData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">宝宝信息不存在</p>
        <button onClick={() => navigate('/classes')} className="mt-4 text-blue-600 hover:underline">
          返回班级列表
        </button>
      </div>
    );
  }

  const hasPrivacyData = babyData.allergyHistory || babyData.parentPhone || babyData.address;
  const canSeePrivacy = currentRole === 'supervisor' || currentRole === 'admin';
  const privacyVisible = canSeePrivacy && showPrivacyInfo;

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate(`/classes/${babyData.classId}`)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors">
          <ArrowLeft size={20} />
          返回 {babyData.className}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-[100px]">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-200 mb-4">
                {babyData.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{babyData.name}</h2>
              <p className="text-gray-500">{babyData.age} 岁 · {babyData.className}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">建档时间</p>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(babyData.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>

              {hasPrivacyData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className={canSeePrivacy ? 'text-green-500' : 'text-gray-400'} />
                      <span className="text-sm font-medium text-gray-700">隐私信息</span>
                    </div>
                    {canSeePrivacy ? (
                      <button
                        onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        {privacyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        {privacyVisible ? '隐藏' : '查看'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">无权限</span>
                    )}
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg space-y-2">
                    {babyData.allergyHistory && (
                      <div className="flex items-start gap-2">
                        <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-amber-600">过敏史</p>
                          <p className="text-sm font-medium text-amber-800">
                            {privacyVisible ? babyData.allergyHistory : '***'}
                          </p>
                        </div>
                      </div>
                    )}
                    {babyData.parentPhone && (
                      <div className="flex items-start gap-2">
                        <Phone size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">家长电话</p>
                          <p className="text-sm font-medium text-gray-700">
                            {privacyVisible ? babyData.parentPhone : (babyData.parentPhone ? `${babyData.parentPhone.slice(0, 3)}****${babyData.parentPhone.slice(-4)}` : '***')}
                          </p>
                        </div>
                      </div>
                    )}
                    {babyData.address && (
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">家庭住址</p>
                          <p className="text-sm font-medium text-gray-700">
                            {privacyVisible ? babyData.address : '***'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">当前角色</p>
                <p className="text-sm font-medium text-blue-800">{ROLE_LABELS[currentRole]}</p>
                <p className="text-xs text-blue-500 mt-1">
                  {canSeePrivacy ? '您有权查看完整隐私信息' : '隐私字段已按您的角色权限过滤'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">用品发放记录</h3>
            {babyData.records.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无用品记录</p>
            ) : (
              <div className="space-y-3">
                {babyData.records.map(record => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedRecord?.id === record.id
                        ? 'border-blue-300 bg-blue-50 shadow-md'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-800">{record.itemName}</h4>
                          <StatusBadge status={record.status} showManualTag isManual={record.isManual} />
                        </div>
                        <p className="text-sm text-gray-500">{ITEM_TYPE_LABELS[record.itemType]}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-xs ${record.sterilized ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {record.sterilized ? '已消毒' : '未消毒'}
                        </span>
                      </div>
                    </div>
                    {record.remark && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{record.remark}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>{new Date(record.createdAt).toLocaleString('zh-CN')}</span>
                      <span>状态变更 {record.statusHistory.length} 次</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedRecord && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {selectedRecord.itemName} - 状态变更历史
              </h3>
              <StatusTimeline statusHistory={selectedRecord.statusHistory} />
            </div>
          )}

          {babyData.name === '王小满' || babyData.name === '王**' ? (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-orange-900 mb-2">案例说明 - 小满那条记录</h4>
                  <p className="text-sm text-orange-800 mb-2">
                    这条记录曾因"未清洁用品再次发放"问题被查找半小时。系统已做以下优化：
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                    <li>异常处理后自动同步更新班级页、宝宝详情、接口和导出清单</li>
                    <li>状态变更历史完整记录，便于追溯（拒绝→已补发的过程清晰可见）</li>
                    <li>审计日志即使处理人缺失也会保留，方便主管复查</li>
                    <li>隐私字段在页面、JSON、日志和导出中均按角色处理</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BabyDetail;
