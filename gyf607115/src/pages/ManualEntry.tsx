import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Camera,
  AlertCircle,
  CheckCircle2,
  User,
  FileText,
} from 'lucide-react';
import { useAlarmStore } from '../stores/useAlarmStore';
import { PhotoUploader } from '../components/PhotoUploader';
import { DiffViewer } from '../components/DiffViewer';
import { compareData, formatAmountDisplay, generateId, maskPhone } from '../utils/formatters';
import type { Alarm, AlarmLevel, AlarmStatus } from '../types';
import { ALARM_LEVEL_LABELS, ALARM_STATUS_LABELS } from '../types';
import { SITES, DEVICES } from '../utils/mockData';

export default function ManualEntry() {
  const navigate = useNavigate();
  const { addManualEntry, getAlarmById, alarms } = useAlarmStore();

  const [photoUrl, setPhotoUrl] = useState('');
  const [enteredBy, setEnteredBy] = useState('孟经理');
  const [entryNote, setEntryNote] = useState('');
  const [selectedAlarmId, setSelectedAlarmId] = useState('');
  const [isNewAlarm, setIsNewAlarm] = useState(true);

  const [formData, setFormData] = useState({
    alarmCode: '',
    siteName: SITES[0],
    deviceName: DEVICES[0],
    level: 'warning' as AlarmLevel,
    description: '',
    amount: 0,
    amountDisplay: '0.00',
    phone: '',
    phoneMasked: '',
    status: 'pending' as AlarmStatus,
  });

  const existingAlarm = selectedAlarmId ? getAlarmById(selectedAlarmId) : undefined;

  const diffData = useMemo(() => {
    if (!existingAlarm || isNewAlarm) return {};
    return compareData<Alarm>(existingAlarm, formData as Partial<Alarm>);
  }, [existingAlarm, formData, isNewAlarm]);

  const hasDiff = Object.keys(diffData).length > 0;

  const handleFormChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'amount') {
        updated.amountDisplay = formatAmountDisplay(Number(value));
      }
      if (field === 'phone') {
        updated.phoneMasked = maskPhone(String(value));
      }
      return updated;
    });
  };

  const handleSelectExistingAlarm = (alarmId: string) => {
    setSelectedAlarmId(alarmId);
    if (alarmId) {
      const alarm = getAlarmById(alarmId);
      if (alarm) {
        setIsNewAlarm(false);
        setFormData({
          alarmCode: alarm.alarmCode,
          siteName: alarm.siteName,
          deviceName: alarm.deviceName,
          level: alarm.level,
          description: alarm.description,
          amount: alarm.amount,
          amountDisplay: alarm.amountDisplay,
          phone: alarm.phone,
          phoneMasked: alarm.phoneMasked,
          status: alarm.status,
        });
      }
    } else {
      setIsNewAlarm(true);
    }
  };

  const handleSave = () => {
    if (!photoUrl) {
      alert('请上传BMS屏幕拍照');
      return;
    }
    if (!enteredBy) {
      alert('请填写操作人');
      return;
    }

    const newAlarmId = isNewAlarm ? generateId() : selectedAlarmId;

    addManualEntry({
      alarmId: newAlarmId,
      photoUrl,
      enteredBy,
      entryNote,
      alarmData: formData as Partial<Alarm>,
      diffData,
    });

    alert('补录成功！');
    navigate(`/alarm/${newAlarmId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-amber-600" />
                  手工补录BMS告警
                </h1>
                <p className="text-sm text-slate-500 mt-1">孟经理专用 - BMS屏幕拍照补录</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Save className="h-4 w-4" />
              保存补录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">补录说明</p>
              <p className="text-sm text-amber-700 mt-1">
                本页面用于现场发现BMS屏幕告警后，通过拍照方式手工补录系统中缺失的告警记录。
                系统将自动对比补录数据与现有数据的差异，并在导出时包含差异说明。
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                BMS 屏幕拍照
              </h3>
              <PhotoUploader
                value={photoUrl}
                onChange={setPhotoUrl}
                label="现场BMS屏幕拍照"
              />
              {!photoUrl && (
                <p className="mt-3 text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  请上传清晰的BMS屏幕告警照片
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                补录信息
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    操作人
                  </label>
                  <input
                    type="text"
                    value={enteredBy}
                    onChange={(e) => setEnteredBy(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    补录类型
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isNewAlarm}
                        onChange={() => {
                          setIsNewAlarm(true);
                          setSelectedAlarmId('');
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">新增告警</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isNewAlarm}
                        onChange={() => setIsNewAlarm(false)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">补充/修正现有告警</span>
                    </label>
                  </div>
                </div>

                {!isNewAlarm && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      选择现有告警
                    </label>
                    <select
                      value={selectedAlarmId}
                      onChange={(e) => handleSelectExistingAlarm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- 请选择告警 --</option>
                      {alarms.map((alarm) => (
                        <option key={alarm.id} value={alarm.id}>
                          {alarm.alarmCode} - {alarm.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    <FileText className="inline h-3 w-3 mr-1" />
                    补录备注
                  </label>
                  <textarea
                    value={entryNote}
                    onChange={(e) => setEntryNote(e.target.value)}
                    placeholder="请描述现场情况、发现问题、处理措施等..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">告警信息</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      告警编号
                    </label>
                    <input
                      type="text"
                      value={formData.alarmCode}
                      onChange={(e) => handleFormChange('alarmCode', e.target.value)}
                      placeholder="如：BMS-001"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      告警级别
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        handleFormChange('level', e.target.value as AlarmLevel)
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(Object.keys(ALARM_LEVEL_LABELS) as AlarmLevel[]).map((level) => (
                        <option key={level} value={level}>
                          {ALARM_LEVEL_LABELS[level]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      站点名称
                    </label>
                    <select
                      value={formData.siteName}
                      onChange={(e) => handleFormChange('siteName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SITES.map((site) => (
                        <option key={site} value={site}>
                          {site}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      设备名称
                    </label>
                    <select
                      value={formData.deviceName}
                      onChange={(e) => handleFormChange('deviceName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DEVICES.map((device) => (
                        <option key={device} value={device}>
                          {device}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    告警描述
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="描述告警的具体内容..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      涉及金额 (元)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        ¥
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      显示值: ¥{formData.amountDisplay}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      处理状态
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleFormChange('status', e.target.value as AlarmStatus)
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(Object.keys(ALARM_STATUS_LABELS) as AlarmStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {ALARM_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    联系电话
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="请输入11位手机号"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    脱敏后: {formData.phoneMasked || '-'}
                    {formData.phone && formData.phone.length === 11 && (
                      <span
                        className={`ml-2 ${
                          formData.phoneMasked.includes('****')
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formData.phoneMasked.includes('****') ? (
                          <CheckCircle2 className="inline h-3 w-3" />
                        ) : (
                          <AlertCircle className="inline h-3 w-3" />
                        )}
                        {formData.phoneMasked.includes('****') ? ' 已脱敏' : ' 未脱敏'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {!isNewAlarm && existingAlarm && (
              <div className="space-y-4">
                {hasDiff ? (
                  <DiffViewer diffData={diffData} title="检测到以下差异" />
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">
                      数据一致，未检测到差异
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">补录预览</h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <pre className="text-xs text-slate-600 overflow-auto font-mono whitespace-pre-wrap">
{JSON.stringify({
  photoUrl: photoUrl ? '[图片数据]' : '',
  enteredBy,
  entryNote,
  isNewAlarm,
  alarmId: isNewAlarm ? '[自动生成]' : selectedAlarmId,
  alarmData: formData,
  diffData: Object.keys(diffData).length > 0 ? diffData : '无差异',
}, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
