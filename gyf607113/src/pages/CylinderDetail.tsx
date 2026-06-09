import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Gauge,
  User,
  Phone,
  Edit3,
  Image as ImageIcon,
  FileText,
  Clock,
  AlertTriangle,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useCylinderStore } from '@/store/useCylinderStore';
import StatusBadge from '@/components/common/StatusBadge';
import Timeline from '@/components/common/Timeline';
import AnomalyCard from '@/components/anomaly/AnomalyCard';
import ApprovalPanel from '@/components/approval/ApprovalPanel';
import SupplementPanel from '@/components/supplement/SupplementPanel';
import StatusUpdateForm from '@/components/cylinder/StatusUpdateForm';
import { formatDate, formatDateShort } from '@/utils/storage';
import { statusLabels } from '@/types';

const CylinderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'photos' | 'approval' | 'supplement'>('info');
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const {
    getCylinderById,
    getStatusHistoriesByCylinderId,
    getPhotosByCylinderId,
    getApprovalsByCylinderId,
    getSupplementsByCylinderId,
    getAnomaliesByCylinderId,
    isInitialized,
    initializeData,
  } = useCylinderStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, initializeData]);

  const cylinder = id ? getCylinderById(id) : undefined;
  const histories = id ? getStatusHistoriesByCylinderId(id) : [];
  const photos = id ? getPhotosByCylinderId(id) : [];
  const approvals = id ? getApprovalsByCylinderId(id) : [];
  const supplements = id ? getSupplementsByCylinderId(id) : [];
  const anomalies = id ? getAnomaliesByCylinderId(id) : [];

  const phoneAnomaly = anomalies.find((a) => a.type === 'permission_phone_leak');
  const photoAnomalies = anomalies.filter((a) => a.type === 'photo_missing_direction');

  const maskPhone = (phone: string) => {
    if (showPhone) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  const tabs = [
    { key: 'info', label: '基本信息', icon: FileText },
    { key: 'history', label: '状态历史', icon: Clock },
    { key: 'photos', label: '巡检照片', icon: ImageIcon },
    { key: 'approval', label: '审批记录', icon: FileText },
    { key: 'supplement', label: '补录管理', icon: FileText },
  ];

  if (!cylinder) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-industrial-400 mb-4">未找到该气瓶信息</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showStatusForm && (
        <StatusUpdateForm cylinder={cylinder} onClose={() => setShowStatusForm(false)} />
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-industrial-400 hover:text-white hover:bg-industrial-800/50 rounded-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{cylinder.code}</h1>
            <StatusBadge status={cylinder.currentStatus} />
            {cylinder.supplementId && (
              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-sm font-mono">
                补录ID: {cylinder.supplementId}
              </span>
            )}
          </div>
          <p className="text-industrial-400 text-sm">
            {cylinder.type} · {cylinder.location}
          </p>
        </div>
        <button
          onClick={() => setShowStatusForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          修改状态
        </button>
      </div>

      <div className="card-industrial p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div>
            <div className="flex items-center gap-2 text-industrial-400 text-sm mb-1">
              <MapPin className="w-4 h-4" />
              位置
            </div>
            <p className="text-white font-medium">{cylinder.location}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-industrial-400 text-sm mb-1">
              <Gauge className="w-4 h-4" />
              压力值
            </div>
            <p className="text-white font-mono font-medium">{cylinder.pressure}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-industrial-400 text-sm mb-1">
              <User className="w-4 h-4" />
              巡检人员
            </div>
            <p className="text-white font-medium">{cylinder.inspector}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-industrial-400 text-sm mb-1">
              <Phone className="w-4 h-4" />
              联系电话
            </div>
            <div className="flex items-center gap-2">
              <p className="text-white font-mono font-medium">
                {maskPhone(cylinder.phone)}
              </p>
              <button
                onClick={() => setShowPhone(!showPhone)}
                className="text-industrial-400 hover:text-white transition-colors"
              >
                {showPhone ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            {phoneAnomaly && !phoneAnomaly.resolved && (
              <div className="mt-1">
                <span className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  手机号泄露异常
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-industrial-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              上次检查
            </div>
            <p className="text-white font-medium">{formatDateShort(cylinder.lastCheckDate)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-industrial-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              下次检查
            </div>
            <p className="text-white font-medium">{formatDateShort(cylinder.nextCheckDate)}</p>
          </div>
        </div>
      </div>

      {phoneAnomaly && !phoneAnomaly.resolved && (
        <div className="card-industrial p-4 border-red-500/30 border">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/10 rounded-sm">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 font-medium">权限视图异常</span>
                <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-sm">
                  手机号泄露风险
                </span>
              </div>
              <p className="text-sm text-industrial-300 mb-2">{phoneAnomaly.readableReason}</p>
              <p className="text-xs text-industrial-500">
                检测时间: {formatDate(phoneAnomaly.detectedAt)}
              </p>
              <div className="mt-3 p-3 bg-industrial-950/50 rounded-sm">
                <p className="text-xs text-industrial-400 mb-1">技术详情:</p>
                <p className="font-mono text-xs text-industrial-300">
                  {phoneAnomaly.technicalDetails}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs text-industrial-400">
                <CheckCircle className="w-3 h-3" />
                可读原因已提供
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-industrial-700/50 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all ${
              activeTab === tab.key
                ? 'bg-industrial-600 text-white'
                : 'text-industrial-300 hover:bg-industrial-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="card-industrial p-5">
            <h3 className="section-title">
              <FileText className="w-5 h-5 text-industrial-400" />
              气瓶详情
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="data-label">气瓶编号</p>
                <p className="data-value text-lg">{cylinder.code}</p>
              </div>
              <div>
                <p className="data-label">气瓶类型</p>
                <p className="data-value">{cylinder.type}</p>
              </div>
              <div>
                <p className="data-label">安装位置</p>
                <p className="data-value">{cylinder.location}</p>
              </div>
              <div>
                <p className="data-label">当前状态</p>
                <p className="data-value">{statusLabels[cylinder.currentStatus]}</p>
              </div>
              <div>
                <p className="data-label">压力值</p>
                <p className="data-value">{cylinder.pressure}</p>
              </div>
              <div>
                <p className="data-label">巡检人员</p>
                <p className="data-value">{cylinder.inspector}</p>
              </div>
              <div>
                <p className="data-label">联系电话</p>
                <p className="data-value">{maskPhone(cylinder.phone)}</p>
              </div>
              <div>
                <p className="data-label">创建时间</p>
                <p className="data-value">{formatDate(cylinder.createdAt)}</p>
              </div>
              <div>
                <p className="data-label">更新时间</p>
                <p className="data-value">{formatDate(cylinder.updatedAt)}</p>
              </div>
              <div>
                <p className="data-label">系统ID</p>
                <p className="data-value font-mono">{cylinder.id}</p>
              </div>
              {cylinder.supplementId && (
                <div>
                  <p className="data-label">补录ID</p>
                  <p className="data-value font-mono">{cylinder.supplementId}</p>
                </div>
              )}
            </div>
          </div>

          {anomalies.length > 0 && (
            <div className="card-industrial p-5">
              <h3 className="section-title">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                异常记录
              </h3>
              <div className="space-y-3">
                {anomalies.map((anomaly) => (
                  <AnomalyCard
                    key={anomaly.id}
                    anomaly={anomaly}
                    cylinderCode={cylinder.code}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card-industrial p-5">
          <h3 className="section-title">
            <Clock className="w-5 h-5 text-industrial-400" />
            状态变更历史
          </h3>
          <p className="text-xs text-industrial-500 mb-4">
            所有状态变更记录均保存在LocalStorage，刷新浏览器不丢失
          </p>
          {histories.length > 0 ? (
            <div className="max-h-[500px] overflow-y-auto pr-2">
              <Timeline histories={histories} />
            </div>
          ) : (
            <p className="text-industrial-500 text-center py-8">暂无状态变更记录</p>
          )}
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-6">
          {photoAnomalies.length > 0 && (
            <div className="card-industrial p-4 border-amber-500/30 border">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-sm">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 font-medium">照片缺少方向说明</span>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-sm">
                      班组误判风险
                    </span>
                  </div>
                  <p className="text-sm text-industrial-300">
                    {photoAnomalies[0].readableReason}
                  </p>
                  <div className="mt-3 p-3 bg-industrial-950/50 rounded-sm">
                    <p className="text-xs text-industrial-400 mb-1">技术详情:</p>
                    <p className="font-mono text-xs text-industrial-300">
                      {photoAnomalies[0].technicalDetails}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-industrial-500">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">可读原因已提供</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card-industrial p-5">
            <h3 className="section-title">
              <ImageIcon className="w-5 h-5 text-industrial-400" />
              巡检照片
            </h3>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className={`relative group animate-fade-in-up`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="aspect-square rounded-sm overflow-hidden border border-industrial-700/50">
                      <img
                        src={photo.url}
                        alt="巡检照片"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {photo.hasDirection ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {photo.direction}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          缺少方向说明
                        </span>
                      )}
                      <span className="text-xs text-industrial-500">
                        {formatDateShort(photo.uploadTime)}
                      </span>
                    </div>
                    {!photo.hasDirection && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <p className="text-xs text-white">{photo.missingReason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-industrial-500 text-center py-8">暂无巡检照片</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="card-industrial p-5">
          <h3 className="section-title">
            <FileText className="w-5 h-5 text-industrial-400" />
            审批记录
          </h3>
          <p className="text-xs text-industrial-500 mb-4">
            主管可撤回结论后重新提交，旧理由将被保留，新备注追加显示
          </p>
          {approvals.length > 0 ? (
            <ApprovalPanel cylinder={cylinder} approvals={approvals} />
          ) : (
            <p className="text-industrial-500 text-center py-8">暂无审批记录</p>
          )}
        </div>
      )}

      {activeTab === 'supplement' && (
        <div className="card-industrial p-5">
          <h3 className="section-title">
            <FileText className="w-5 h-5 text-industrial-400" />
            补录管理
          </h3>
          <p className="text-xs text-industrial-500 mb-4">
            小秦手工补录气瓶压力贴纸，支持补录前后差异对比和导出读回验证
          </p>
          <SupplementPanel cylinder={cylinder} supplements={supplements} />
        </div>
      )}
    </div>
  );
};

export default CylinderDetail;
