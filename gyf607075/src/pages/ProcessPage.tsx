import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ShieldCheck,
  FileCheck2,
  Phone,
  Banknote,
  Store,
  Calendar,
  Info,
} from 'lucide-react';
import {
  STATUS_LABEL,
  CATEGORY_EMOJI,
  type ExpenseCategory,
} from '../../shared/types';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { PhoneValidationResult } from '../utils/helpers';

const STEPS = [
  { id: 1, name: '核对信息', icon: <FileCheck2 className="w-5 h-5" /> },
  { id: 2, name: '校验手机号', icon: <Phone className="w-5 h-5" /> },
  { id: 3, name: '确认金额', icon: <Banknote className="w-5 h-5" /> },
  { id: 4, name: '确认核销', icon: <ShieldCheck className="w-5 h-5" /> },
  { id: 5, name: '完成', icon: <CheckCircle2 className="w-5 h-5" /> },
];

export default function ProcessPage() {
  const navigate = useNavigate();
  const { recordId } = useParams<{ recordId: string }>();
  const {
    records,
    updateRecord,
    updateRecordStatus,
    validatePhone,
    currentUserName,
  } = useAppStore();

  const record = records.find((r) => r.id === recordId);
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneInput, setPhoneInput] = useState(record?.phone || '');
  const [phoneValidation, setPhoneValidation] =
    useState<PhoneValidationResult | null>(null);
  const [showPartialSuccess, setShowPartialSuccess] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState(false);
  const [finalNote, setFinalNote] = useState('');

  if (!record) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-gray-500">记录不存在</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary mt-4"
        >
          返回
        </button>
      </div>
    );
  }

  const canGoNext = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) {
      return (
        phoneValidation &&
        (phoneValidation.allValid || phoneValidation.partialSuccess)
      );
    }
    if (currentStep === 3) return confirmAmount;
    if (currentStep === 4) return true;
    return true;
  };

  const handleValidatePhone = () => {
    const result = validatePhone(phoneInput);
    setPhoneValidation(result);
    if (result.partialSuccess) {
      setShowPartialSuccess(true);
    }
  };

  const handleUseValidOnly = () => {
    if (phoneValidation) {
      setPhoneInput(phoneValidation.valid.join(', '));
      setShowPartialSuccess(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && phoneValidation?.valid.length) {
      updateRecord(record.id, { phone: phoneValidation.valid[0] });
    }
    if (currentStep === 4) {
      updateRecordStatus(record.id, 'verified', currentUserName);
      if (finalNote.trim()) {
        updateRecord(record.id, {
          [`note_${Date.now()}`]: finalNote,
        } as Partial<typeof record>);
      }
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6 max-w-3xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost mb-5 -ml-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          返回提醒墙
        </button>

        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center text-2xl">
              {CATEGORY_EMOJI[record.category as ExpenseCategory]}
            </div>
            <div>
              <h2 className="font-display text-2xl text-gray-800">
                {record.category}核销流程
              </h2>
              <p className="text-sm text-gray-500">
                金额 {formatCurrency(record.amount)} · 商家 {record.merchant}
              </p>
            </div>
            <span className="ml-auto badge bg-amber-100 text-amber-700 border border-amber-200">
              {STATUS_LABEL[record.status]}
            </span>
          </div>

          <div className="card !p-4 animate-fade-in-up animate-delay-50">
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin pb-2">
              {STEPS.map((step, idx) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <div
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all
                      ${
                        currentStep > step.id
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : currentStep === step.id
                            ? 'bg-warm-orange text-white shadow-card'
                            : 'bg-cream-50 text-gray-400 border border-cream-200'
                      }
                    `}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      step.icon
                    )}
                    <span className="text-sm font-medium whitespace-nowrap">
                      {step.id}. {step.name}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card animate-scale-in">
          {currentStep === 1 && (
            <div>
              <h3 className="font-display text-lg text-gray-800 mb-4 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-warm-orange" />
                第一步：核对基础信息
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                请仔细核对以下信息，确保和您手上的票据/小票一致。有问题可随时联系爸妈。
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50">
                  <Store className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">商家</div>
                    <div className="font-medium text-gray-800">
                      {record.merchant}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50">
                  <Banknote className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">金额</div>
                    <div className="font-display text-xl text-warm-orange">
                      {formatCurrency(record.amount)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">到期日</div>
                    <div className="font-medium text-gray-800">
                      {formatDate(record.dueDate)}
                    </div>
                  </div>
                </div>
                {record.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">预留手机号</div>
                      <div className="font-medium text-gray-800 font-mono">
                        {record.phone}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  如果信息和票据对不上，请先联系主管或爸妈，不要强行核销，避免月底余额突然变负。
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="font-display text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-warm-orange" />
                第二步：校验联系手机号
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                输入商家或客户的手机号。支持批量输入（用逗号、空格或换行分隔），格式不对会自动提示。
              </p>
              <div>
                <label className="label-field">手机号</label>
                <textarea
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="例如：13812345678, 13987654321"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <button
                onClick={handleValidatePhone}
                className="btn-secondary mt-3"
              >
                <ShieldCheck className="w-4 h-4" />
                校验格式
              </button>

              {phoneValidation && !showPartialSuccess && (
                <div className="mt-4 space-y-2">
                  {phoneValidation.allValid && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-700">
                        全部 {phoneValidation.valid.length} 个手机号格式正确 ✅
                      </p>
                    </div>
                  )}
                  {phoneValidation.allInvalid && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-rose-700">
                        <p className="font-medium">全部格式错误</p>
                        <p className="text-rose-600 mt-1">
                          请检查：{phoneValidation.invalid.join('、')}
                        </p>
                        <p className="text-rose-500 mt-1 text-xs">
                          中国大陆手机号应为 1 开头，共 11 位数字
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showPartialSuccess && phoneValidation?.partialSuccess && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 animate-scale-in">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800">
                        部分手机号格式有误
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        有效 {phoneValidation.valid.length} 个，无效{' '}
                        {phoneValidation.invalid.length} 个
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3 text-sm">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-emerald-700 font-medium mb-1">
                        ✅ 有效：
                      </div>
                      <div className="font-mono text-emerald-600 break-all">
                        {phoneValidation.valid.join(', ')}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                      <div className="text-rose-700 font-medium mb-1">
                        ❌ 无效：
                      </div>
                      <div className="font-mono text-rose-600 break-all">
                        {phoneValidation.invalid.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleUseValidOnly}
                      className="btn-primary !py-1.5 !px-3 text-sm"
                    >
                      仅使用有效号码继续
                    </button>
                    <button
                      onClick={() => setShowPartialSuccess(false)}
                      className="btn-secondary !py-1.5 !px-3 text-sm"
                    >
                      返回修改
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="font-display text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-warm-orange" />
                第三步：确认金额与余额
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                最后一次确认金额，避免月底余额突然变负。
              </p>
              <div className="p-5 rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 border border-cream-200 text-center mb-5">
                <div className="text-xs text-gray-500 mb-1">本次核销金额</div>
                <div className="font-display text-4xl text-warm-orange">
                  {formatCurrency(record.amount)}
                </div>
              </div>
              <label className="inline-flex items-start gap-2 p-3 rounded-xl bg-cream-50 border border-cream-200 cursor-pointer hover:border-warm-orange/40 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmAmount}
                  onChange={(e) => setConfirmAmount(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-warm-orange"
                />
                <span className="text-sm text-gray-700">
                  我已核对票据，确认金额为 {formatCurrency(record.amount)}
                  ，不会造成月底余额异常
                </span>
              </label>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h3 className="font-display text-lg text-gray-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-warm-orange" />
                第四步：最终确认核销
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                可以写一个简短备注（可选），然后点击提交完成核销。
              </p>
              <div>
                <label className="label-field">备注（可选）</label>
                <textarea
                  value={finalNote}
                  onChange={(e) => setFinalNote(e.target.value)}
                  placeholder="例如：已和店长确认，票据齐全"
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
              <div className="mt-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-700">
                  ✅ 信息核对完毕，手机号已校验，金额已确认。
                </p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-5 animate-scale-in">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="font-display text-2xl text-gray-800 mb-2">
                核销完成 🎉
              </h3>
              <p className="text-gray-500 mb-6">
                {record.category} {formatCurrency(record.amount)} 已成功核销
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                回到提醒墙
              </button>
            </div>
          )}

          {currentStep < 5 && (
            <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-cream-100">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {currentStep === 4 ? '提交核销' : '下一步'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
