import React from 'react';
import { Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface SubmitButtonProps {
  onSubmit?: () => void;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ onSubmit }) => {
  const { getValidationResult, submitRecord, mode } = useAppStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const validation = getValidationResult();
  const canSubmit = validation.isValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const record = submitRecord();
    
    setIsSubmitting(false);
    
    if (record) {
      setSubmitSuccess(true);
      onSubmit?.();
      setTimeout(() => setSubmitSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {validation.errors.map((error, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-xs text-danger-400 bg-danger-500/10 p-2 rounded"
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ))}
        
        {validation.warnings.map((warning, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-xs text-warning-400 bg-warning-500/10 p-2 rounded"
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        ))}

        {validation.isValid && (
          <div className="flex items-center gap-2 text-xs text-safety-400 bg-safety-500/10 p-2 rounded">
            <CheckCircle size={14} />
            <span>所有校验通过，可以提交</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-3.5 rounded-lg font-medium flex items-center justify-center gap-2 text-base transition-all ${
          canSubmit
            ? submitSuccess
              ? 'bg-safety-500 text-white shadow-lg shadow-safety-500/30'
              : mode === 'real'
                ? 'bg-warning-500 hover:bg-warning-600 text-white shadow-lg shadow-warning-500/30 active:scale-[0.98]'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-[0.98]'
            : 'bg-dark-700 text-dark-500 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>提交中...</span>
          </>
        ) : submitSuccess ? (
          <>
            <CheckCircle size={18} />
            <span>提交成功</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>
              {mode === 'real' ? '提交实盘记录' : '提交演练记录'}
            </span>
          </>
        )}
      </button>

      {mode === 'drill' && (
        <p className="text-xs text-center text-dark-500">
          演练数据仅保存在本地，不写入监管正式库
        </p>
      )}
    </div>
  );
};
