import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Grid3X3, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { usePreferences } from '../../store/usePreferences';

interface Props {
  lowBlueMode?: boolean;
  lowBlueIntensity?: number;
  angle?: number;
}

export function CameraPreview({
  lowBlueMode: propLowBlue,
  lowBlueIntensity: propIntensity,
  angle = 0,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefs = usePreferences();
  const lowBlue = propLowBlue ?? prefs.lowBlueMode;
  const intensity = propIntensity ?? prefs.lowBlueIntensity;
  const showGrid = prefs.showGrid;

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isOn, setIsOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulate, setSimulate] = useState(false);

  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('浏览器不支持摄像头');
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setStream(s);
      setIsOn(true);
      setHasCamera(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '无法访问摄像头';
      setError(msg);
      setHasCamera(false);
      setSimulate(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsOn(false);
  };

  const captureFrame = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      try {
        if (simulate || !videoRef.current || !isOn) {
          canvas.width = 1280;
          canvas.height = 960;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas不可用'));
          drawSimulatedDocument(ctx, canvas.width, canvas.height, angle);
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Blob失败'))),
            'image/jpeg',
            0.92
          );
          return;
        }
        const v = videoRef.current;
        canvas.width = v.videoWidth || 1280;
        canvas.height = v.videoHeight || 960;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas不可用'));
        if (lowBlue) applyLowBlue(ctx, canvas.width, canvas.height, intensity);
        ctx.drawImage(v, 0, 0);
        if (lowBlue) applyLowBlueOverlay(ctx, canvas.width, canvas.height, intensity);
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Blob失败'))),
          'image/jpeg',
          0.92
        );
      } catch (e) {
        reject(e);
      }
    });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filter = lowBlue
    ? `sepia(${intensity * 0.25}%) saturate(${100 - intensity * 0.5}%) brightness(${
        100 - intensity * 0.1
      }%) hue-rotate(${intensity * 0.4}deg)`
    : 'none';

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border-2 shadow-lg"
      style={{
        aspectRatio: '4 / 3',
        borderColor: '#8B6B3D',
        background: '#1a1610',
      }}
    >
      {simulate ? (
        <SimulatedDocument angle={angle} lowBlue={lowBlue} intensity={intensity} />
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ filter, transform: 'scaleX(-1)' }}
          muted
          playsInline
        />
      )}

      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/3 top-0 bottom-0"
            style={{ width: 1, background: 'rgba(212,175,55,0.35)' }}
          />
          <div
            className="absolute left-2/3 top-0 bottom-0"
            style={{ width: 1, background: 'rgba(212,175,55,0.35)' }}
          />
          <div
            className="absolute top-1/3 left-0 right-0"
            style={{ height: 1, background: 'rgba(212,175,55,0.35)' }}
          />
          <div
            className="absolute top-2/3 left-0 right-0"
            style={{ height: 1, background: 'rgba(212,175,55,0.35)' }}
          />
          <div
            className="absolute inset-4 rounded-lg"
            style={{ border: '1px dashed rgba(212,175,55,0.4)' }}
          />
        </div>
      )}

      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
        <StatusChip
          icon={isOn ? <Camera size={14} /> : <CameraOff size={14} />}
          label={isOn ? '摄像头' : '待机'}
          tone={isOn ? 'ok' : 'idle'}
        />
        {lowBlue && (
          <StatusChip icon={<Eye size={14} />} label={`低蓝光 ${intensity}%`} tone="warm" />
        )}
        {showGrid && (
          <StatusChip icon={<Grid3X3 size={14} />} label="对齐网格" tone="idle" />
        )}
      </div>

      {error && (
        <div className="absolute top-3 right-3 max-w-[260px] bg-[#B23A48]/95 text-white text-xs rounded-lg px-3 py-2 flex items-start gap-2 backdrop-blur">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-bold mb-0.5">未检测到摄像头</div>
            <div className="opacity-90 leading-relaxed">已启用模拟手稿模式供演示</div>
            <button
              onClick={() => setSimulate(true)}
              className="mt-1 underline opacity-90 hover:opacity-100"
            >
              保持模拟
            </button>
          </div>
        </div>
      )}

      {simulate && hasCamera === false && (
        <button
          onClick={startCamera}
          className="absolute bottom-3 right-3 bg-[#2D5A7B] text-white text-xs rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-[#244b66] transition"
        >
          <CameraOff size={14} /> 重试摄像头
        </button>
      )}

      <CameraPreviewCapture capture={captureFrame} />
    </div>
  );
}

function StatusChip({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'ok' | 'warm' | 'idle';
}) {
  const colors = {
    ok: 'bg-[#2D5A7B]/90 text-white',
    warm: 'bg-[#8B6B3D]/90 text-white',
    idle: 'bg-[#3B2F2F]/80 text-[#FDF8EC]',
  } as const;
  return (
    <div
      className={`text-[11px] rounded-full px-2.5 py-1 flex items-center gap-1.5 backdrop-blur ${colors[tone]}`}
    >
      {icon}
      {label}
    </div>
  );
}

function applyLowBlue(_ctx: CanvasRenderingContext2D, _w: number, _h: number, _i: number) {
  // placeholder; actual filtering is via CSS + overlay to avoid performance hits
}
function applyLowBlueOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(255, ${230 + intensity * 0.25}, ${180 + intensity * 0.5}, ${
    intensity / 300
  })`;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawSimulatedDocument(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  angleDeg: number
) {
  ctx.fillStyle = '#1a1610';
  ctx.fillRect(0, 0, w, h);

  const pw = w * 0.7;
  const ph = h * 0.82;
  const px = (w - pw) / 2;
  const py = (h - ph) / 2;

  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2);
  ctx.rotate(((angleDeg - 90) * Math.PI) / 180 / 8);
  ctx.translate(-(px + pw / 2), -(py + ph / 2));

  const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
  grad.addColorStop(0, '#F1E6CC');
  grad.addColorStop(0.5, '#E8D8B4');
  grad.addColorStop(1, '#D8C496');
  ctx.fillStyle = grad;
  roundRect(ctx, px, py, pw, ph, 6);
  ctx.fill();

  ctx.strokeStyle = 'rgba(92,69,34,0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, px + 12, py + 12, pw - 24, ph - 24, 3);
  ctx.stroke();

  const fiberAngleRad = (angleDeg * Math.PI) / 180;
  ctx.strokeStyle = 'rgba(139,107,61,0.28)';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 180; i++) {
    const fx = px + Math.random() * pw;
    const fy = py + Math.random() * ph;
    const fl = 18 + Math.random() * 54;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(fiberAngleRad) * fl, fy + Math.sin(fiberAngleRad) * fl);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(178,58,72,0.18)';
  ctx.beginPath();
  ctx.ellipse(px + pw * 0.28, py + ph * 0.36, 28, 42, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(178,58,72,0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(45,90,123,0.14)';
  ctx.beginPath();
  ctx.moveTo(px + pw * 0.6, py + ph * 0.55);
  ctx.lineTo(px + pw * 0.72, py + ph * 0.5);
  ctx.lineTo(px + pw * 0.78, py + ph * 0.62);
  ctx.lineTo(px + pw * 0.68, py + ph * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(45,90,123,0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#3B2F2F';
  ctx.font = `bold ${Math.round(pw * 0.032)}px "Source Han Serif", "Noto Serif SC", serif`;
  ctx.textBaseline = 'top';
  const lines = ['永乐大典卷之二千三百四十七', '洪武大典編纂官臣等奉勑', '三才定位萬物彙分'];
  lines.forEach((ln, i) => {
    const x = px + pw * 0.09;
    const y = py + ph * 0.12 + i * pw * 0.05;
    for (let j = 0; j < ln.length; j++) {
      ctx.fillText(ln[j], x + j * pw * 0.034, y);
    }
  });
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function SimulatedDocument({
  angle,
  lowBlue,
  intensity,
}: {
  angle: number;
  lowBlue: boolean;
  intensity: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    drawSimulatedDocument(ctx, w, h, angle);
    if (lowBlue) applyLowBlueOverlay(ctx, w, h, intensity);
  }, [angle, lowBlue, intensity]);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={960}
      className="w-full h-full object-cover"
    />
  );
}

const captureRef: { current?: () => Promise<Blob> } = {};

function CameraPreviewCapture({ capture }: { capture: () => Promise<Blob> }) {
  useEffect(() => {
    captureRef.current = capture;
    return () => {
      if (captureRef.current === capture) captureRef.current = undefined;
    };
  }, [capture]);
  return null;
}

export const captureCurrentFrame = async (): Promise<Blob> => {
  if (!captureRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas不可用');
    drawSimulatedDocument(ctx, canvas.width, canvas.height, 45);
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob失败'))), 'image/jpeg', 0.92)
    );
  }
  return captureRef.current();
};
