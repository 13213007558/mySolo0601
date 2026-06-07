import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Baby,
  UserCircle,
  Phone,
  FileText,
  ShieldAlert,
  Eye,
  EyeOff,
  IdCard,
  Home as HomeIcon,
  FileSignature,
  CalendarDays,
  Clock,
  User,
  AlertTriangle,
  FileWarning,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import HistoryTimeline from '@/components/HistoryTimeline';
import { useAppStore } from '@/store/useAppStore';
import { desensitizeIdCard, desensitizePhone, desensitizeContact } from '@/utils';
import { MATERIAL_TYPE_LABEL, MATERIAL_STATUS_LABEL } from '@/types';
import type { MaterialStatus } from '@/types';

const materialStatusColors: Record<MaterialStatus, string> = {
  verified: 'bg-safety-50 text-safety-600 border-safety-200',
  pending: 'bg-warning-50 text-warning-600 border-warning-200',
  rejected: 'bg-danger-50 text-danger-600 border-danger-200',
};

const materialIcons: Record<string, any> = {
  id_card: IdCard,
  household: HomeIcon,
  authorization_letter: FileSignature,
  birth_certificate: FileText,
};

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPrivate, setShowPrivate] = useState(false);

  const record = useAppStore((s) => s.getRecordById(id || ''));
  const history = useAppStore((s) => s.getHistoryByRecordId(id || ''));
  const materials = useAppStore((s) => s.getMaterialsByRecordId(id || ''));
  const auditLogs = useAppStore((s) => s.getAuditByRecordId(id || ''));
  const addAuditLog = useAppStore((s) => s.addAuditLog);
  const currentUser = useAppStore((s) => s.currentUser);

  const handleTogglePrivate = () => {
    if (!showPrivate) {
      addAuditLog({
        recordId: id,
        actionType: 'access_privacy',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        containsPrivateData: true,
        desensitized: false,
        fieldsInvolved: ['babyIdCard', 'authorizerIdCard', 'emergencyContact', 'authorizerPhone'],
        ipAddress: '192.168.1.10',
      });
    }
    setShowPrivate((v) => !v);
  };

  const displayInfo = useMemo(() => {
    if (!record) return null;
    return {
      babyIdCard: showPrivate ? record.babyIdCard : desensitizeIdCard(record.babyIdCard),
      authorizerIdCard: showPrivate ? record.authorizerIdCard : desensitizeIdCard(record.authorizerIdCard),
      authorizerPhone: showPrivate ? record.authorizerPhone : desensitizePhone(record.authorizerPhone),
      emergencyContact: showPrivate ? record.emergencyContact : desensitizeContact(record.emergencyContact),
    };
  }, [record, showPrivate]);

  if (!record) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-16 text-center">
          <div className="text-5xl mb-3">😕</div>
          <p className="text-slate-500 mb-4">未找到该授权记录</p>
          <Link to="/" className="inline-flex items-center gap-2 text-medical-600 hover:text-medical-700">
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-sc text-2xl font-semibold text-slate-800">{record.nickname}</h1>
              {record.isSupplemented && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-violet-50 text-violet-600 border border-violet-200">
                  <Sparkles className="w-3 h-3" />
                  手工补录
                </span>
              )}
              {record.phoneValidationIssues?.length ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-warning-50 text-warning-600 border border-warning-200">
                  <AlertTriangle className="w-3 h-3" />
                  含格式异常
                </span>
              ) : null}
              <StatusBadge status={record.status} size="md" />
            </div>
            <p className="text-sm text-slate-500 mt-1">婴幼儿姓名：{record.babyName} · 出生日期：{record.babyBirthDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePrivate}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showPrivate
                ? 'bg-danger-50 border-danger-200 text-danger-600'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {showPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPrivate ? '隐藏隐私字段' : '查看隐私字段'}
          </button>
          <button
            onClick={() => navigate(`/record/${record.id}/edit`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-medical-600 hover:bg-medical-700 rounded-lg shadow-sm transition-colors"
          >
            <Pencil className="w-4 h-4" />
            复核编辑
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Baby className="w-4 h-4 text-medical-600" />
              婴幼儿信息
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={Baby} label="昵称" value={record.nickname} />
              <InfoRow icon={UserCircle} label="姓名" value={record.babyName} />
              <InfoRow icon={IdCard} label="身份证号" value={displayInfo!.babyIdCard} sensitive />
              <InfoRow icon={CalendarDays} label="出生日期" value={record.babyBirthDate} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-medical-600" />
              授权人信息
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={UserCircle} label="姓名" value={record.authorizerName} />
              <InfoRow icon={IdCard} label="身份证号" value={displayInfo!.authorizerIdCard} sensitive />
              <InfoRow icon={Phone} label="联系手机号" value={displayInfo!.authorizerPhone} sensitive hasIssue={!!record.phoneValidationIssues?.length} />
              <InfoRow icon={UserCircle} label="与婴幼儿关系" value={record.relationship} />
              <InfoRow icon={ShieldAlert} label="紧急联系人" value={displayInfo!.emergencyContact} sensitive full />
            </div>
            {record.phoneValidationIssues?.length ? (
              <div className="mt-4 bg-warning-50 border border-warning-200 rounded-lg p-3">
                <p className="text-xs font-medium text-warning-700 mb-1.5 flex items-center gap-1">
                  <FileWarning className="w-3.5 h-3.5" /> 手机号格式校正记录（部分成功）
                </p>
                <ul className="text-xs text-warning-600 space-y-0.5 pl-5 list-disc">
                  {record.phoneValidationIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-medical-600" />
              材料附件审核
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {materials.map((m) => {
                const Icon = materialIcons[m.materialType] || FileText;
                return (
                  <div key={m.id} className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-medical-50 text-medical-600 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{MATERIAL_TYPE_LABEL[m.materialType]}</p>
                      <p className="text-xs text-slate-400 truncate">{m.materialName}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${materialStatusColors[m.status]}`}>
                      {MATERIAL_STATUS_LABEL[m.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-medical-600" />
              历史变更记录（刷新页面可见最新记录）
            </h2>
            <HistoryTimeline history={history} desensitize={!showPrivate} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4">复核状态</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">当前状态</span>
                <StatusBadge status={record.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">处理护士</span>
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {record.handledByName}
                </span>
              </div>
              {record.reviewedByName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">复核人</span>
                  <span className="font-medium text-slate-700">{record.reviewedByName}</span>
                </div>
              )}
              {record.reviewTime && (
                <div className="flex justify-between">
                  <span className="text-slate-500">复核时间</span>
                  <span className="font-mono text-xs text-slate-600">{record.reviewTime}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">创建时间</span>
                <span className="font-mono text-xs text-slate-600">{record.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">更新时间</span>
                <span className="font-mono text-xs text-slate-600">{record.updatedAt}</span>
              </div>
            </div>
            {record.remark && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">备注说明</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2.5">{record.remark}</p>
              </div>
            )}
            {record.supplementSource && (
              <div className="mt-3 bg-violet-50 border border-violet-200 rounded-lg p-3">
                <p className="text-xs font-medium text-violet-700 mb-0.5">补录来源</p>
                <p className="text-xs text-violet-600">{record.supplementSource}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-medical-600" />
              审计日志
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">暂无审计记录</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border border-slate-100 rounded-lg p-3 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium bg-medical-50 text-medical-600">
                        {log.actionType === 'export' ? '导出' : log.actionType === 'edit' ? '编辑' : log.actionType === 'view' ? '查看' : '隐私访问'}
                        {log.exportFormat ? `(${log.exportFormat.toUpperCase()})` : ''}
                      </span>
                      <span className="text-slate-400 font-mono">{log.createdAt.slice(5, 16)}</span>
                    </div>
                    <p className="text-slate-600">操作人：{log.operatorName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {log.containsPrivateData && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${log.desensitized ? 'bg-safety-50 text-safety-600' : 'bg-danger-50 text-danger-600'}`}>
                          {log.desensitized ? '已脱敏' : '未脱敏⚠️'}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 truncate">涉及 {log.fieldsInvolved.length} 个字段</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-warning-50 to-danger-50 border border-warning-200 rounded-xl p-4">
            <h3 className="font-serif-sc text-sm font-semibold text-warning-700 mb-2">📌 店长复盘路径</h3>
            <ul className="text-xs text-warning-700/80 space-y-1.5">
              <li>• <strong>失败路径</strong>：查看「已驳回」状态记录及对应变更原因</li>
              <li>• <strong>人工更正路径</strong>：标记为「补录」或「部分通过」的记录</li>
              <li>• <strong>隐私审计</strong>：所有查看/导出隐私字段的行为均留痕</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, sensitive, full, hasIssue }: {
  icon: any;
  label: string;
  value: string;
  sensitive?: boolean;
  full?: boolean;
  hasIssue?: boolean;
}) {
  return (
    <div className={`${full ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
        {sensitive && <span className="text-[10px] text-danger-500">🔒隐私</span>}
      </div>
      <div className={`font-medium ${sensitive ? 'font-mono' : ''} ${hasIssue ? 'text-warning-600' : 'text-slate-700'}`}>
        {value || '—'}
      </div>
    </div>
  );
}
