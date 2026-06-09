import { useState } from 'react';
import { X, Upload, Camera, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import type { ParkingSpot } from '../../types';
import { useParkingStore } from '../../store/parkingStore';
import { cn } from '../../utils/helpers';

interface ManualEntryModalProps {
  spot: ParkingSpot;
  onClose: () => void;
}

const quickReasons = [
  '中午巡查发现异常',
  '早班语音转写提及',
  '系统导出与实际不符',
  '交接班核实',
  '用户投诉核实',
  '设备离线人工确认',
];

const ManualEntryModal = ({ spot, onClose }: ManualEntryModalProps) => {
  const { manualEntry, currentUser } = useParkingStore();
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [actualValue, setActualValue] = useState(spot.actualValue);
  const [exportValue, setExportValue] = useState(spot.exportValue);
  const [reason, setReason] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMismatch = exportValue !== actualValue;
  const canSubmit = screenshotUrl.trim() && reason.trim();

  const generateSampleScreenshot = () => {
    const status = actualValue === 1 ? 'occupied' : 'available';
    const prompt = status === 'occupied'
      ? `parking%20space%20${spot.spotNumber.replace('-', '')}%20with%20electric%20vehicle%20parked%2C%20manual%20screenshot%20from%20mobile%20phone%2C%20indoor%20parking%20garage%2C%20timestamp%20overlay`
      : `empty%20parking%20space%20${spot.spotNumber.replace('-', '')}%20with%20charging%20station%2C%20manual%20screenshot%20from%20mobile%20phone%2C%20indoor%20parking%20garage`;
    const url = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=landscape_16_9`;
    setScreenshotUrl(url);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    setTimeout(() => {
      manualEntry(
        spot.id,
        {
          exportValue,
          actualValue,
        },
        screenshotUrl,
        reason
      );
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  const lastScreenshot = spot.screenshots[spot.screenshots.length - 1];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-industrial-card border border-industrial-border rounded-sm w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideIn">
        <div className="p-4 border-b border-industrial-border flex items-center justify-between sticky top-0 bg-industrial-card z-10">
          <div>
            <h2 className="text-lg font-semibold text-industrial-text flex items-center gap-2">
              <Camera size={20} className="text-primary" />
              手工补录 - 车位 {spot.spotNumber}
            </h2>
            <p className="text-sm text-industrial-muted mt-0.5">
              操作人：{currentUser.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-industrial-border rounded-sm transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {lastScreenshot && (
            <div className="card-industrial p-4">
              <div className="text-sm font-medium text-industrial-text mb-3">当前最新截图（补录前）</div>
              <div className="aspect-video bg-industrial-bg rounded-sm overflow-hidden relative">
                <img
                  src={lastScreenshot.url}
                  alt="当前截图"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="text-xs text-white/80">
                    {lastScreenshot.source === 'manual' ? '手工补录' : '系统截图'} · {lastScreenshot.uploadedBy || '系统'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-industrial-text block mb-2">
                系统导出值
              </label>
              <select
                value={exportValue}
                onChange={(e) => setExportValue(Number(e.target.value))}
                className="w-full bg-industrial-bg border border-industrial-border rounded-sm px-4 py-3 text-industrial-text font-mono-nums text-lg"
              >
                <option value={0}>0 - 空闲</option>
                <option value={1}>1 - 占用</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-industrial-text block mb-2">
                实际状态值 <span className="text-alert-red">*</span>
              </label>
              <select
                value={actualValue}
                onChange={(e) => setActualValue(Number(e.target.value))}
                className="w-full bg-industrial-bg border border-industrial-border rounded-sm px-4 py-3 text-industrial-text font-mono-nums text-lg"
              >
                <option value={0}>0 - 空闲</option>
                <option value={1}>1 - 占用</option>
              </select>
            </div>
          </div>

          {isMismatch && (
            <div className="bg-alert-orange/10 border border-alert-orange/30 p-3 rounded-sm flex items-start gap-2">
              <AlertTriangle size={18} className="text-alert-orange flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-alert-orange">数据将被标记为不一致</div>
                <div className="text-sm text-industrial-muted">
                  导出值({exportValue})与实际值({actualValue})不一致，系统将记录此差异
                </div>
              </div>
            </div>
          )}

          {!isMismatch && (
            <div className="bg-alert-green/10 border border-alert-green/30 p-3 rounded-sm flex items-start gap-2">
              <CheckCircle size={18} className="text-alert-green flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-alert-green">数据将保持一致</div>
                <div className="text-sm text-industrial-muted">
                  导出值与实际值一致，系统将更新为正常状态
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-industrial-text block mb-2">
              补录截图 <span className="text-alert-red">*</span>
            </label>
            {!screenshotUrl ? (
              <div className="border-2 border-dashed border-industrial-border rounded-sm p-8 text-center hover:border-primary/50 transition-colors">
                <Camera size={48} className="mx-auto text-industrial-muted mb-3" />
                <p className="text-industrial-muted mb-4">上传车位现场照片或生成模拟截图</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={generateSampleScreenshot}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Eye size={16} />
                    生成模拟截图
                  </button>
                  <button
                    onClick={generateSampleScreenshot}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Upload size={16} />
                    上传图片
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="aspect-video bg-industrial-bg rounded-sm overflow-hidden">
                  <img
                    src={screenshotUrl}
                    alt="补录截图"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-sm">
                    新补录
                  </div>
                </div>
                <button
                  onClick={() => { setScreenshotUrl(''); setShowPreview(false); }}
                  className="mt-2 text-sm text-alert-red hover:underline"
                >
                  重新上传
                </button>
              </div>
            )}
          </div>

          {lastScreenshot && screenshotUrl && showPreview && (
            <div className="card-industrial p-4">
              <div className="text-sm font-medium text-industrial-text mb-3 flex items-center gap-2">
                <Eye size={16} className="text-primary" />
                补录前后差异预览
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-industrial-muted mb-2 text-center">补录前</div>
                  <div className="aspect-video bg-industrial-bg rounded-sm overflow-hidden relative">
                    <img src={lastScreenshot.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-industrial-bg/90 text-white text-xs px-2 py-0.5 rounded-sm">
                      之前
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-industrial-muted mb-2 text-center">补录后</div>
                  <div className="aspect-video bg-industrial-bg rounded-sm overflow-hidden relative">
                    <img src={screenshotUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-primary/90 text-white text-xs px-2 py-0.5 rounded-sm">
                      现在
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-industrial-text block mb-2">
              补录原因 <span className="text-alert-red">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {quickReasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-sm border transition-all',
                    reason === r
                      ? 'bg-primary border-primary text-white'
                      : 'bg-industrial-bg border-industrial-border text-industrial-muted hover:border-primary/50 hover:text-industrial-text'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请详细说明补录原因，如：中午巡查发现A01车位系统导出为空但实际有车占用..."
              className="w-full bg-industrial-bg border border-industrial-border rounded-sm px-4 py-3 text-industrial-text placeholder-industrial-muted/50 resize-none h-24"
            />
            <div className="text-xs text-industrial-muted mt-1">
              此原因将记录在操作历史中，可供后续追溯
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-industrial-border flex items-center justify-between sticky bottom-0 bg-industrial-card">
          <div className="text-xs text-industrial-muted">
            <AlertTriangle size={12} className="inline mr-1" />
            提交后将自动记录操作历史，不可撤销
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={cn(
                'btn-primary flex items-center gap-2',
                (!canSubmit || isSubmitting) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  确认补录
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryModal;
