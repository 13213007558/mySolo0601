import { useState } from 'react';
import { X, Phone, UserCheck, Check, AlertTriangle } from 'lucide-react';
import { usePickupStore } from '@/store/pickupStore';
import type { PickupRecord, PhoneAuthInfo, TempAuntInfo } from '@/types';
import { nowISO } from '@/utils/report';

interface Props {
  record: PickupRecord;
  mode: 'phone' | 'aunt' | 'normal' | 'exception';
  onClose: () => void;
}

export function ActionModal({ record, mode, onClose }: Props) {
  const markNormalPicked = usePickupStore((s) => s.markNormalPicked);
  const markPhoneAuthorized = usePickupStore((s) => s.markPhoneAuthorized);
  const markTempAunt = usePickupStore((s) => s.markTempAunt);
  const markException = usePickupStore((s) => s.markException);

  const [pickupPerson, setPickupPerson] = useState(record.authorizedBy);
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [authContent, setAuthContent] = useState('');
  const [verified, setVerified] = useState(false);
  const [auntName, setAuntName] = useState('');
  const [auntId, setAuntId] = useState('');
  const [relationNote, setRelationNote] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [conflictNote, setConflictNote] = useState('');

  const submit = () => {
    if (mode === 'normal') {
      if (!pickupPerson.trim()) return;
      markNormalPicked(record.id, pickupPerson.trim());
    } else if (mode === 'phone') {
      if (!callerName.trim() || !callerPhone.trim() || !pickupPerson.trim()) return;
      const info: PhoneAuthInfo = {
        callerName: callerName.trim(),
        callerPhone: callerPhone.trim(),
        authTime: nowISO(),
        identityVerified: verified,
        authContent: authContent.trim() || '（未填写授权说明）',
      };
      markPhoneAuthorized(record.id, info, pickupPerson.trim());
    } else if (mode === 'aunt') {
      if (!auntName.trim() || !auntId.trim()) return;
      const info: TempAuntInfo = {
        auntName: auntName.trim(),
        auntId: auntId.trim(),
        verifiedAt: nowISO(),
        relationNote: relationNote.trim() || '临时接送阿姨',
      };
      markTempAunt(record.id, info);
    } else if (mode === 'exception') {
      if (!exceptionReason.trim()) return;
      markException(record.id, exceptionReason.trim(), conflictNote.trim() || undefined);
    }
    onClose();
  };

  const titleMap = {
    normal: '确认正常接送',
    phone: '登记电话授权接送',
    aunt: '登记临时阿姨接送',
    exception: '标记异常',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-night-700 border border-night-500 rounded-lg p-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'phone' && <Phone size={16} className="text-pickup-phone" />}
            {mode === 'aunt' && <UserCheck size={16} className="text-pickup-aunt" />}
            {mode === 'normal' && <Check size={16} className="text-pickup-normal" />}
            {mode === 'exception' && <AlertTriangle size={16} className="text-pickup-exception" />}
            <h3 className="font-display text-lg font-semibold text-night-50">{titleMap[mode]}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-night-300 hover:text-night-50 hover:bg-night-600">
            <X size={16} />
          </button>
        </div>
        <div className="mt-1 text-xs text-night-300 font-mono">
          {record.babyName} · {record.className} · {record.id}
        </div>

        <div className="mt-4 space-y-3">
          {mode === 'normal' && (
            <Field label="实际接走人姓名" required>
              <input
                value={pickupPerson}
                onChange={(e) => setPickupPerson(e.target.value)}
                placeholder="请填写与授权人一致（默认为授权人本人）"
                className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-normal/60"
              />
            </Field>
          )}

          {mode === 'phone' && (
            <>
              <Field label="来电人姓名" required>
                <input
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  placeholder="例如：王爸爸"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-phone/60"
                />
              </Field>
              <Field label="来电号码" required>
                <input
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  placeholder="138****5678"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-phone/60 font-mono"
                />
              </Field>
              <Field label="实际接走人" required>
                <input
                  value={pickupPerson}
                  onChange={(e) => setPickupPerson(e.target.value)}
                  placeholder="谁来接孩子？例如：王奶奶"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-phone/60"
                />
              </Field>
              <Field label="电话授权内容">
                <textarea
                  value={authContent}
                  onChange={(e) => setAuthContent(e.target.value)}
                  rows={2}
                  placeholder="家长在电话中的授权说明……"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-phone/60"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-night-200">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="w-4 h-4 rounded border-night-500 bg-night-800 text-pickup-normal focus:ring-pickup-normal/50"
                />
                已通过安全问题核验来电人身份（宝宝生日/注册信息等）
              </label>
              {!verified && (
                <div className="text-[11px] text-pickup-exception flex items-center gap-1">
                  <AlertTriangle size={12} /> 未核验身份将在导出报告中被标记为"未通过"，请优先核验
                </div>
              )}
            </>
          )}

          {mode === 'aunt' && (
            <>
              <Field label="临时阿姨姓名" required>
                <input
                  value={auntName}
                  onChange={(e) => setAuntName(e.target.value)}
                  placeholder="例如：刘桂芳"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-aunt/60"
                />
              </Field>
              <Field label="阿姨工号/证件号" required>
                <input
                  value={auntId}
                  onChange={(e) => setAuntId(e.target.value)}
                  placeholder="A-T2026-0087"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-aunt/60 font-mono"
                />
              </Field>
              <Field label="关系/备注">
                <input
                  value={relationNote}
                  onChange={(e) => setRelationNote(e.target.value)}
                  placeholder="家庭钟点工、邻居、亲戚……"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-aunt/60"
                />
              </Field>
            </>
          )}

          {mode === 'exception' && (
            <>
              <Field label="异常原因" required>
                <textarea
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  rows={3}
                  placeholder="详细描述异常情况……"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-exception/60"
                />
              </Field>
              <Field label="冲突/补充备注">
                <input
                  value={conflictNote}
                  onChange={(e) => setConflictNote(e.target.value)}
                  placeholder="与旧记录或补录的冲突说明"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-exception/60"
                />
              </Field>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-night-500 text-night-200 hover:bg-night-600"
          >
            取消
          </button>
          <button
            onClick={submit}
            className={
              'px-4 py-2 text-sm rounded-md text-white btn-glow ' +
              (mode === 'normal'
                ? 'bg-pickup-normal hover:bg-pickup-normal/90'
                : mode === 'phone'
                  ? 'bg-pickup-phone hover:bg-pickup-phone/90'
                  : mode === 'aunt'
                    ? 'bg-pickup-aunt hover:bg-pickup-aunt/90'
                    : 'bg-pickup-exception hover:bg-pickup-exception/90')
            }
          >
            确认登记
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-night-300 mb-1 block">
        {label} {required && <span className="text-pickup-withdrawn">*</span>}
      </label>
      {children}
    </div>
  );
}
