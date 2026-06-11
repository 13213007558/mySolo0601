import { useRef, useState, useEffect, useCallback } from "react";
import { useGradingStore } from "@/store/gradingStore";
import type { Point, Annotation } from "@/types";
import {
  getAnnotationColor,
  getAnnotationFillColor,
  getAnnotationTypeName,
} from "@/utils";

export function AnnotationCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [imageNatural, setImageNatural] = useState({ w: 0, h: 0 });

  const currentSlice = useGradingStore((s) => s.currentSlice);
  const annotations = useGradingStore((s) => s.annotations);
  const selectedAnnotationId = useGradingStore((s) => s.selectedAnnotationId);
  const drawingPoints = useGradingStore((s) => s.drawingPoints);
  const isDrawing = useGradingStore((s) => s.isDrawing);
  const toolMode = useGradingStore((s) => s.toolMode);
  const transform = useGradingStore((s) => s.transform);
  const lightIntensity = useGradingStore((s) => s.lightIntensity);
  const showGrid = useGradingStore((s) => s.showGrid);
  const showMeasurements = useGradingStore((s) => s.showMeasurements);
  const standardSamples = useGradingStore((s) => s.standardSamples);

  const setTransform = useGradingStore((s) => s.setTransform);
  const startDrawing = useGradingStore((s) => s.startDrawing);
  const addDrawingPoint = useGradingStore((s) => s.addDrawingPoint);
  const finishDrawing = useGradingStore((s) => s.finishDrawing);
  const cancelDrawing = useGradingStore((s) => s.cancelDrawing);
  const selectAnnotation = useGradingStore((s) => s.selectAnnotation);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    setImageNatural({ w: img.naturalWidth, h: img.naturalHeight });
  };
  img.src = currentSlice.imageUrl;

  const screenToImage = useCallback(
    (sx: number, sy: number): Point => {
      const { w: cw, h: ch } = containerSize;
      const scale = transform.scale;
      const offsetX = transform.x;
      const offsetY = transform.y;

      let dispW = cw;
      let dispH = ch;
      if (imageNatural.w && imageNatural.h) {
        const ratio = imageNatural.w / imageNatural.h;
        if (cw / ch > ratio) {
          dispW = ch * ratio;
        } else {
          dispH = cw / ratio;
        }
      }
      dispW *= scale;
      dispH *= scale;

      const cx = (cw - dispW) / 2 + offsetX;
      const cy = (ch - dispH) / 2 + offsetY;

      const ix = ((sx - cx) / dispW) * (imageNatural.w || cw);
      const iy = ((sy - cy) / dispH) * (imageNatural.h || ch);
      return { x: ix, y: iy };
    },
    [containerSize, transform, imageNatural]
  );

  const imageToScreen = useCallback(
    (ix: number, iy: number): Point => {
      const { w: cw, h: ch } = containerSize;
      const scale = transform.scale;
      const offsetX = transform.x;
      const offsetY = transform.y;

      let dispW = cw;
      let dispH = ch;
      if (imageNatural.w && imageNatural.h) {
        const ratio = imageNatural.w / imageNatural.h;
        if (cw / ch > ratio) {
          dispW = ch * ratio;
        } else {
          dispH = cw / ratio;
        }
      }
      dispW *= scale;
      dispH *= scale;

      const cx = (cw - dispW) / 2 + offsetX;
      const cy = (ch - dispH) / 2 + offsetY;

      const sx = (ix / (imageNatural.w || cw)) * dispW + cx;
      const sy = (iy / (imageNatural.h || ch)) * dispH + cy;
      return { x: sx, y: sy };
    },
    [containerSize, transform, imageNatural]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (toolMode === "pan") {
      setIsPanning(true);
      setPanStart({ x: sx - transform.x, y: sy - transform.y });
    } else if (
      toolMode === "annotate_crack" ||
      toolMode === "annotate_impurity" ||
      toolMode === "annotate_inclusion"
    ) {
      const pt = screenToImage(sx, sy);
      if (!isDrawing) {
        startDrawing(pt);
      } else {
        addDrawingPoint(pt);
      }
    } else if (toolMode === "select") {
      selectAnnotation(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning && panStart) {
      setTransform({
        x: sx - panStart.x,
        y: sy - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  const handleDoubleClick = () => {
    if (isDrawing) {
      finishDrawing();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setTransform({
      scale: Math.max(0.2, Math.min(5, transform.scale + delta)),
    });
  };

  const renderAnnotation = (ann: Annotation, isPreview = false) => {
    if (ann.points.length < 2) return null;
    const screenPts = ann.points.map((p) => imageToScreen(p.x, p.y));
    const path = screenPts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ") + (ann.points.length > 2 ? " Z" : "");

    const lastPt = screenPts[screenPts.length - 1];
    const firstPt = screenPts[0];
    const labelPt = {
      x: (firstPt.x + lastPt.x) / 2,
      y: (firstPt.y + lastPt.y) / 2 - 8,
    };
    const isSelected = selectedAnnotationId === ann.id && !isPreview;

    return (
      <g
        key={ann.id}
        style={{ cursor: toolMode === "select" ? "pointer" : "default" }}
        onClick={(e) => {
          if (toolMode === "select" && !isPreview) {
            e.stopPropagation();
            selectAnnotation(ann.id);
          }
        }}
      >
        <path
          d={path}
          fill={getAnnotationFillColor(ann.type)}
          stroke={getAnnotationColor(ann.type)}
          strokeWidth={isSelected ? 3 : 2}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            filter: isSelected
              ? `drop-shadow(0 0 4px ${getAnnotationColor(ann.type)})`
              : "none",
          }}
        />
        {ann.points.map((_, i) => {
          const sp = screenPts[i];
          return (
            <circle
              key={i}
              cx={sp.x}
              cy={sp.y}
              r={isSelected ? 4 : 2.5}
              fill={getAnnotationColor(ann.type)}
              stroke="white"
              strokeWidth={1}
            />
          );
        })}
        {!isPreview && (
          <g>
            <rect
              x={labelPt.x - 26}
              y={labelPt.y - 16}
              width={52}
              height={18}
              rx={4}
              fill={getAnnotationColor(ann.type)}
              opacity={0.95}
            />
            <text
              x={labelPt.x}
              y={labelPt.y - 3}
              textAnchor="middle"
              fill="white"
              fontSize={10}
              fontWeight={600}
            >
              {ann.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderDrawing = () => {
    if (!isDrawing || drawingPoints.length < 1) return null;
    const screenPts = drawingPoints.map((p) => imageToScreen(p.x, p.y));
    const type =
      toolMode === "annotate_crack"
        ? "crack"
        : toolMode === "annotate_impurity"
        ? "impurity"
        : toolMode === "annotate_inclusion"
        ? "inclusion"
        : "crack";

    return (
      <g pointerEvents="none">
        {screenPts.length > 1 && (
          <path
            d={
              screenPts
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                .join(" ") + (screenPts.length > 2 ? " Z" : "")
            }
            fill={getAnnotationFillColor(type)}
            stroke={getAnnotationColor(type)}
            strokeWidth={2}
            strokeDasharray="6 3"
          />
        )}
        {screenPts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={getAnnotationColor(type)}
            stroke="white"
            strokeWidth={1.5}
          />
        ))}
      </g>
    );
  };

  const isAnnotating =
    toolMode === "annotate_crack" ||
    toolMode === "annotate_impurity" ||
    toolMode === "annotate_inclusion";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl backlight-effect grain-overlay"
      style={{
        filter: `brightness(${lightIntensity})`,
        cursor: isPanning
          ? "grabbing"
          : toolMode === "pan"
          ? "grab"
          : isAnnotating
          ? "crosshair"
          : toolMode === "select"
          ? "pointer"
          : "default",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onContextMenu={(e) => {
        e.preventDefault();
        if (isDrawing) cancelDrawing();
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
          transformOrigin: "center center",
          transition: isPanning ? "none" : "transform 0.15s ease-out",
        }}
      >
        <div className="relative max-w-[85%] max-h-[85%] shadow-2xl rounded-lg overflow-hidden">
          <img
            src={currentSlice.imageUrl}
            alt={currentSlice.name}
            className="block max-w-full max-h-[70vh] object-contain bg-white/40"
            draggable={false}
            style={{ mixBlendMode: "normal" }}
          />
          {standardSamples
            .filter((s) => s.visible)
            .map((sample) => (
              <img
                key={sample.id}
                src={sample.imageUrl}
                alt={sample.name}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  opacity: sample.opacity,
                  mixBlendMode: "multiply",
                }}
              />
            ))}
        </div>
      </div>

      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(13, 148, 136, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(13, 148, 136, 0.1) 1px, transparent 1px)`,
            backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
        />
      )}

      {showMeasurements && imageNatural.w && (
        <>
          <div className="absolute top-2 left-2 right-2 h-5 flex items-end pointer-events-none">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-end">
                <div className="w-px h-3 bg-jade-700/50"></div>
                <span className="text-[9px] text-jade-800 font-medium -mt-1">
                  {i * 10}%
                </span>
              </div>
            ))}
          </div>
          <div className="absolute left-2 top-8 bottom-2 w-5 flex items-start pointer-events-none">
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="h-[10%] flex items-start justify-end w-full"
              >
                <div className="h-px w-3 bg-jade-700/50"></div>
                <span className="text-[9px] text-jade-800 font-medium -mr-0.5">
                  {i * 10}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <g style={{ pointerEvents: toolMode === "select" ? "auto" : "none" }}>
          {annotations.map((a) => renderAnnotation(a))}
        </g>
        {renderDrawing()}
      </svg>

      {isAnnotating && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-gray-900/80 text-white text-xs backdrop-blur-md flex items-center gap-3">
          <span className="font-medium">
            正在标注：
            <span
              className={
                toolMode === "annotate_crack"
                  ? "text-red-400"
                  : toolMode === "annotate_impurity"
                  ? "text-amber-400"
                  : "text-blue-400"
              }
            >
              {getAnnotationTypeName(
                toolMode === "annotate_crack"
                  ? "crack"
                  : toolMode === "annotate_impurity"
                  ? "impurity"
                  : "inclusion"
              )}
            </span>
          </span>
          <span className="text-gray-400">|</span>
          <span>左键添加点 · 双击完成 · 右键取消</span>
          <span className="text-gray-400">|</span>
          <span className="text-jade-300">
            已添加 {drawingPoints.length} 个点
          </span>
        </div>
      )}

      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-md border border-jade-100 text-[11px] text-gray-600 space-y-0.5">
        <div>
          <span className="text-gray-400">尺寸：</span>
          {currentSlice.width}×{currentSlice.height}×{currentSlice.thickness} mm
        </div>
        <div>
          <span className="text-gray-400">重量：</span>
          {currentSlice.weight} ct
        </div>
      </div>
    </div>
  );
}
