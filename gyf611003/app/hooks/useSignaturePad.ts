import { useEffect, useRef } from "react";

export function useSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDrawnRef = useRef(false);

  const setupCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    canvasRef.current = canvas;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#00E5FF";
  };

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPosRef.current = getPos(e);
    hasDrawnRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
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
    hasDrawnRef.current = false;
  };

  const toDataURL = () => {
    return canvasRef.current?.toDataURL("image/png") || "";
  };

  const isEmpty = () => !hasDrawnRef.current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => setupCanvas(canvas));
    ro.observe(canvas);
    setupCanvas(canvas);
    return () => ro.disconnect();
  }, []);

  return {
    canvasRef,
    setupCanvas,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
    clear,
    toDataURL,
    isEmpty,
  };
}
