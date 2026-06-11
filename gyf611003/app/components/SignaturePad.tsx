import { useEffect, useRef } from "react";
import { Eraser } from "lucide-react";

interface Props {
  onReady?: (api: SignaturePadApi) => void;
  height?: number;
  placeholder?: string;
  accentColor?: "cyan" | "green" | "amber";
  readOnlyPreview?: string; // base64
}

export interface SignaturePadApi {
  clear: () => void;
  toDataURL: () => string;
  isEmpty: () => boolean;
}

export default function SignaturePad({
  onReady,
  height = 110,
  placeholder = "请在此区域签署姓名",
  accentColor = "cyan",
  readOnlyPreview,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDrawnRef = useRef(false);
  const readOnlyImgRef = useRef<HTMLImageElement | null>(null);

  const accent = {
    cyan: { stroke: "#00E5FF", border: "border-indicator-cyan/50", glow: "shadow-led-cyan/20", btn: "text-indicator-cyan" },
    green: { stroke: "#30D158", border: "border-indicator-green/50", glow: "shadow-led-green/20", btn: "text-indicator-green" },
    amber: { stroke: "#FFB020", border: "border-indicator-amber/50", glow: "shadow-led-amber/20", btn: "text-indicator-amber" },
  }[accentColor];

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width) * dpr;
    canvas.height = Math.max(1, rect.height) * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = accent.stroke;

    if (readOnlyPreview) {
      const img = new Image();
      img.onload = () => {
        const cw = rect.width;
        const ch = rect.height;
        const iw = img.width;
        const ih = img.height;
        const scale = Math.min(cw / iw, ch / ih) * 0.95;
        const dw = iw * scale;
        const dh = ih * scale;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      };
      img.src = readOnlyPreview;
      readOnlyImgRef.current = img;
      hasDrawnRef.current = true;
    }
  };

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnlyPreview) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPosRef.current = getPos(e);
    hasDrawnRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || readOnlyPreview) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPosRef.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    drawingRef.current = false;
    lastPosRef.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setupCanvas();
    hasDrawnRef.current = !!readOnlyPreview;
  };

  const toDataURL = () => canvasRef.current?.toDataURL("image/png") || "";
  const isEmpty = () => !hasDrawnRef.current;

  useEffect(() => {
    onReady?.({ clear, toDataURL, isEmpty });
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => setupCanvas());
    ro.observe(canvas);
    const id = requestAnimationFrame(setupCanvas);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(id);
    };
  }, [readOnlyPreview]);

  return (
    <div
      className={`relative rounded-sm border-2 ${accent.border} bg-nautical-900/80 overflow-hidden ${
        !readOnlyPreview ? `hover:${accent.border.replace("/50", "/80")}` : "opacity-90"
      }`}
      style={{ height }}
    >
      {!readOnlyPreview && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity">
          <span className="text-slate-600 text-sm italic tracking-wide">{placeholder}</span>
        </div>
      )}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {!readOnlyPreview && (
        <button
          type="button"
          onClick={clear}
          className={`absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-sm bg-nautical-800/80 border ${accent.border} ${accent.btn} hover:bg-nautical-700 transition-all`}
          title="清除签名"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

declare module "react" {
  interface CSSProperties {
    [key: `--tw-${string}`]: string | number;
  }
}
