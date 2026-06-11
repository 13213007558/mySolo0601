import React, { useState, useRef } from 'react';
import { useStoneStore } from '@/store/useStoneStore';
import { FileWarning, Upload, X, AlertOctagon, Send, Camera, FileText, CheckCircle } from 'lucide-react';

interface ErratumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErratumModal: React.FC<ErratumModalProps> = ({ isOpen, onClose }) => {
  const { getCurrentStone, requestErratum } = useStoneStore();
  const [reason, setReason] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stone = getCurrentStone();

  if (!isOpen || !stone) return null;

  const presetReasons = [
    '内含物位置标记偏差',
    '内含物类型判断错误',
    '遗漏新增内含物特征',
    '原始照片不清晰需重拍',
    '国际报告字段值更新',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setPhotoUrl(url);
        setPreviewUrl(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!reason.trim() || !photoUrl.trim()) return;
    setStep('confirm');
  };

  const handleConfirm = () => {
    requestErratum(stone.id, reason, photoUrl || stone.imageUrl);
    setStep('success');
    setTimeout(() => {
      resetAndClose();
    }, 2500);
  };

  const resetAndClose = () => {
    setReason('');
    setPhotoUrl('');
    setPreviewUrl('');
    setStep('form');
    onClose();
  };

  const canSubmit = reason.trim().length >= 10 && (photoUrl.trim() || previewUrl);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        {step === 'form' && (
          <>
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                  <FileWarning size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-diamond-cream">勘误申请</h3>
                  <p className="text-xs text-slate-400">{stone.certificateNo} · {stone.carat}ct</p>
                </div>
              </div>
              <button
                onClick={resetAndClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                style={{ border: 'none', background: 'transparent' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertOctagon size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-0.5">合规约束说明</div>
                  <div className="text-red-300/80">已提交的对标报告进入只读锁定状态，修正必须走勘误流程并附新照片。审批通过后方可重新编辑。</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-400" />
                  勘误原因 <span className="text-red-400">*</span>
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {presetReasons.map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setReason(pr)}
                      className={`
                        px-2.5 py-1 rounded-full text-xs font-medium transition-all
                        ${reason === pr
                          ? 'bg-diamond-gold text-diamond-navy'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                        }
                      `}
                    >
                      {pr}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请详细描述勘误原因（至少10个字符）..."
                  rows={3}
                  className="bs-input resize-none"
                />
                <div className="mt-1 text-right text-xs text-slate-500">{reason.length}/500</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Camera size={14} className="text-slate-400" />
                  新钻石照片 <span className="text-red-400">*</span>
                </label>

                <div
                  className={`
                    relative rounded-xl border-2 border-dashed transition-all overflow-hidden
                    ${previewUrl
                      ? 'border-diamond-gold/40 bg-diamond-gold/5'
                      : 'border-slate-700/70 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer'
                    }
                  `}
                  style={{ minHeight: '160px' }}
                  onClick={() => !previewUrl && fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} alt="预览" className="w-full h-44 object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewUrl(''); setPhotoUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                        style={{ border: 'none' }}
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-xs text-white">
                        新照片预览
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-3">
                        <Upload size={24} className="text-slate-400" />
                      </div>
                      <div className="text-sm font-medium text-slate-300 mb-1">点击上传新照片</div>
                      <div className="text-xs text-slate-500">或粘贴图片URL · JPG/PNG · 清晰俯视照片</div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    value={photoUrl && !photoUrl.startsWith('data:') ? photoUrl : ''}
                    onChange={(e) => { setPhotoUrl(e.target.value); setPreviewUrl(e.target.value); }}
                    placeholder="或输入图片URL..."
                    className="bs-input text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between gap-3">
              <button
                onClick={resetAndClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                style={{ border: 'none', background: 'transparent' }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`
                  px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all
                  ${canSubmit
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:-translate-y-0.5'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                <Send size={14} />
                提交勘误申请
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-diamond-gold/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-diamond-gold/20 flex items-center justify-center border border-diamond-gold/40">
                  <AlertOctagon size={20} className="text-diamond-gold" />
                </div>
                <h3 className="font-display text-lg font-bold text-diamond-gold">请确认勘误信息</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1 font-medium">勘误原因</div>
                <div className="text-sm text-diamond-cream">{reason}</div>
              </div>

              {previewUrl && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-2 font-medium">新钻石照片</div>
                  <img src={previewUrl} alt="预览" className="w-full h-36 object-cover rounded-lg border border-slate-700" />
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <AlertOctagon size={12} className="mt-0.5 flex-shrink-0" />
                <span>提交后将进入主管审核流程，审核通过后方可重新编辑绘图板内容。</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setStep('form')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                style={{ border: 'none', background: 'transparent' }}
              >
                返回修改
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-diamond-gold to-yellow-600 text-diamond-navy shadow-lg shadow-diamond-gold/20 hover:-translate-y-0.5 transition-all"
              >
                <CheckCircle size={14} />
                确认提交
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="p-10 flex flex-col items-center justify-center text-center animate-pop-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-5 border-2 border-emerald-500/40 animate-pulse-slow">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <h3 className="font-display text-2xl font-bold text-diamond-cream mb-2">勘误申请已提交</h3>
            <p className="text-sm text-slate-400 mb-6">请等待质检主管审核，审核通过后将解锁编辑。</p>
            <div className="px-4 py-2 rounded-full bg-slate-800 text-xs text-slate-400">
              {stone.certificateNo}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
