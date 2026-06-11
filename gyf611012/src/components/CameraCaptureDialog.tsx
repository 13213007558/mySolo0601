import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, FocusTrap } from '@headlessui/react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface CameraCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export default function CameraCaptureDialog({
  open,
  onClose,
  onCapture,
}: CameraCaptureDialogProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashVisible, setFlashVisible] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCapturedDataUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraError(t('inspection.camera_error'));
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedDataUrl(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 150);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedDataUrl(dataUrl);
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
  };

  const handleUsePhoto = () => {
    if (capturedDataUrl) {
      onCapture(capturedDataUrl);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      as="div"
      className="relative z-50"
      open={open}
      onClose={handleClose}
    >
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <FocusTrap>
            <Dialog.Panel className="relative w-full max-w-2xl panel p-0 overflow-hidden">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-gold-500" />
                  <Dialog.Title className="panel-title text-base">
                    {t('inspection.photo_title')}
                  </Dialog.Title>
                </div>
                <button
                  onClick={handleClose}
                  className="text-ink-400 hover:text-ink-100 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative bg-ink-950 aspect-video">
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-saffron-900/50 border border-saffron-600 flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-saffron-400" />
                    </div>
                    <p className="text-saffron-300 font-mono text-sm text-center max-w-md">
                      {cameraError}
                    </p>
                  </div>
                ) : capturedDataUrl ? (
                  <img
                    src={capturedDataUrl}
                    alt="Captured"
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover bg-black"
                      playsInline
                      muted
                    />
                    <div className="target-corner left-4 top-4 border-l-2 border-t-2" />
                    <div className="target-corner right-4 top-4 border-r-2 border-t-2" />
                    <div className="target-corner left-4 bottom-4 border-l-2 border-b-2" />
                    <div className="target-corner right-4 bottom-4 border-r-2 border-b-2" />

                    <div className="absolute left-4 right-4 top-0 h-1 overflow-hidden pointer-events-none">
                      <div className="h-1 w-1/3 bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_12px_4px_rgba(212,175,55,0.7)] animate-scan-line" />
                    </div>
                  </>
                )}

                {flashVisible && (
                  <div className="absolute inset-0 bg-white/80 animate-pulse pointer-events-none" />
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="p-5 border-t border-ink-700 flex items-center justify-between gap-4">
                {!cameraError && !capturedDataUrl && (
                  <div className="flex-1 flex justify-center">
                    <button
                      onClick={handleCapture}
                      className="group relative w-20 h-20 rounded-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                      aria-label={t('inspection.capture')}
                    >
                      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-saffron-500 via-saffron-700 to-saffron-900 shadow-[0_0_24px_rgba(220,20,60,0.45)] group-hover:shadow-[0_0_32px_rgba(220,20,60,0.65)] transition-shadow" />
                      <span className="absolute inset-1.5 rounded-full border-4 border-white/80" />
                      <span className="absolute inset-3 rounded-full bg-white/10 group-active:bg-white/30 transition-colors" />
                    </button>
                  </div>
                )}

                {capturedDataUrl && (
                  <div className="flex-1 flex items-center justify-center gap-4">
                    <button
                      onClick={handleRetake}
                      className="btn-hard-ghost !px-4 !py-2.5 gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t('inspection.retake')}
                    </button>
                    <button
                      onClick={handleUsePhoto}
                      className="btn-hard-success !px-6 !py-2.5 gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {t('inspection.use_photo')}
                    </button>
                  </div>
                )}

                {cameraError && (
                  <div className="flex-1 flex justify-center">
                    <button
                      onClick={startCamera}
                      className="btn-hard-gold !px-5 !py-2.5 gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t('common.refresh')}
                    </button>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className="btn-hard-ghost !px-4 !py-2.5 gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('common.cancel')}
                </button>
              </div>
            </Dialog.Panel>
          </FocusTrap>
        </div>
      </div>
    </Dialog>
  );
}
