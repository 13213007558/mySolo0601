import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MousePointer2,
  ArrowUpRight,
  Pentagon,
  Eraser,
  Layers,
  X,
  Trash2,
  CornerDownLeft,
} from 'lucide-react';
import {
  AnnotationLayer,
  FiberArrow,
  RepairPolygon,
  RepairType,
  REPAIR_TYPES,
} from '../../types';
import { angleService } from '../../services/angleService';
import { genId } from '../../services/storageService';
import { usePreferences } from '../../store/usePreferences';

export type Tool = 'select' | 'arrow' | 'polygon' | 'eraser';

interface Props {
  imageUrl: string;
  captureId: string;
  initial?: AnnotationLayer;
  onChange?: (layer: AnnotationLayer) => void;
  readOnly?: boolean;
}

interface PolygonDraft {
  points: Array<{ x: number; y: number }>;
}

export function AnnotationCanvas({
  imageUrl,
  captureId,
  initial,
  onChange,
  readOnly = false,
}: Props) {
  const snapTo15 = usePreferences((s) => s.snapTo15);
  const [tool, setTool] = useState<Tool>('arrow');
  const [layer, setLayer] = useState<AnnotationLayer>(
    initial ?? {
      captureId,
      arrows: [],
      polygons: [],
      updatedAt: Date.now(),
      updatedBy: usePreferences.getState().operatorId,
    }
  );
  const [draftArrow, setDraftArrow] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [draftPolygon, setDraftPolygon] = useState<PolygonDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{
    polygon: RepairPolygon;
    mode: 'create' | 'edit';
  } | null>(null);

  const [showArrows, setShowArrows] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const newPolygonRef = useRef<RepairPolygon | null>(null);

  const updateLayer = useCallback(
    (next: AnnotationLayer) => {
      setLayer(next);
      onChange?.(next);
    },
    [onChange]
  );

  const getCanvasPoint = (e: React.PointerEvent | PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = 'clientX' in e ? e.clientX : 0;
    const clientY = 'clientY' in e ? e.clientY : 0;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    const p = getCanvasPoint(e);
    if (tool === 'arrow') {
      setDraftArrow({ startX: p.x, startY: p.y, endX: p.x, endY: p.y });
      (e.target as Element).setPointerCapture(e.pointerId);
    } else if (tool === 'polygon') {
      setDraftPolygon((prev) => {
        if (!prev) return { points: [p] };
        return { points: [...prev.points, p] };
      });
    } else if (tool === 'eraser') {
      // find closest arrow/polygon
      const hit = findHit(p, layer, 0.02);
      if (hit) deleteItem(hit);
    } else if (tool === 'select') {
      const hit = findHit(p, layer, 0.03);
      setSelectedId(hit ?? null);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draftArrow) return;
    const p = getCanvasPoint(e);
    setDraftArrow({ ...draftArrow, endX: p.x, endY: p.y });
  };

  const onPointerUp = () => {
    if (draftArrow) {
      const { startX, startY, endX, endY } = draftArrow;
      const dist = Math.hypot(endX - startX, endY - startY);
      if (dist > 0.02) {
        let ang = angleService.vectorToAngle(endX - startX, endY - startY);
        const snapped = snapTo15 ? angleService.snapTo15(ang) : ang;
        if (snapTo15) ang = snapped;
        const arrow: FiberArrow = {
          id: genId(),
          captureId,
          startX,
          startY,
          endX,
          endY,
          angle: ang,
          snappedTo15: snapTo15,
          color: '#3B2F2F',
        };
        updateLayer({ ...layer, arrows: [...layer.arrows, arrow] });
      }
      setDraftArrow(null);
    }
  };

  const closePolygon = () => {
    if (!draftPolygon || draftPolygon.points.length < 3) {
      setDraftPolygon(null);
      return;
    }
    const poly: RepairPolygon = {
      id: genId(),
      captureId,
      points: draftPolygon.points,
      note: '',
      repairType: '补缺',
    };
    newPolygonRef.current = poly;
    updateLayer({ ...layer, polygons: [...layer.polygons, poly] });
    setDraftPolygon(null);
    setNoteModal({ polygon: poly, mode: 'create' });
  };

  const deleteItem = (id: string) => {
    updateLayer({
      ...layer,
      arrows: layer.arrows.filter((a) => a.id !== id),
      polygons: layer.polygons.filter((p) => p.id !== id),
    });
    if (selectedId === id) setSelectedId(null);
  };

  const updatePolygon = (updated: RepairPolygon) => {
    updateLayer({
      ...layer,
      polygons: layer.polygons.map((p) => (p.id === updated.id ? updated : p)),
    });
  };

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDraftArrow(null);
        setDraftPolygon(null);
        setSelectedId(null);
      } else if (e.key === 'Enter' && draftPolygon && draftPolygon.points.length >= 3) {
        e.preventDefault();
        closePolygon();
      } else if (e.key === 'Backspace' && selectedId) {
        deleteItem(selectedId);
      } else if (e.key === '1') setTool('arrow');
      else if (e.key === '2') setTool('polygon');
      else if (e.key === '3') setTool('eraser');
      else if (e.key === 'v' || e.key === 'V') setTool('select');
    },
    [draftPolygon, selectedId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const tools: { id: Tool; icon: React.ReactNode; label: string; hotkey: string }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: '选择', hotkey: 'V' },
    { id: 'arrow', icon: <ArrowUpRight size={20} />, label: '纤维箭头', hotkey: '1' },
    { id: 'polygon', icon: <Pentagon size={20} />, label: '修补圈选', hotkey: '2' },
    { id: 'eraser', icon: <Eraser size={20} />, label: '擦除', hotkey: '3' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: '#8B6B3D55', background: 'rgba(253,248,236,0.5)' }}>
          {tools.map((t) => (
            <button
              key={t.id}
              disabled={readOnly}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition ${
                tool === t.id
                  ? 'text-white shadow-md'
                  : 'text-[#3B2F2F] hover:bg-[#EFE5CF]'
              }`}
              style={tool === t.id ? { background: '#2D5A7B' } : {}}
              title={`${t.label} (${t.hotkey})`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              <kbd
                className={`text-[10px] px-1 rounded ${
                  tool === t.id ? 'bg-white/20' : 'bg-[#EFE5CF]'
                }`}
              >
                {t.hotkey}
              </kbd>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LayerToggle
            icon={<ArrowUpRight size={14} />}
            label="纤维走向"
            count={layer.arrows.length}
            on={showArrows}
            onToggle={() => setShowArrows(!showArrows)}
          />
          <LayerToggle
            icon={<Pentagon size={14} />}
            label="修补区"
            count={layer.polygons.length}
            on={showPolygons}
            onToggle={() => setShowPolygons(!showPolygons)}
          />
          <Layers size={16} className="text-[#8B6B3D] ml-1" />
        </div>
      </div>

      <div
        ref={canvasWrapRef}
        className="relative flex-1 rounded-xl overflow-hidden min-h-[400px] border-2 shadow-inner"
        style={{
          borderColor: '#8B6B3D',
          background: `repeating-linear-gradient(45deg, #f5efe0 0 20px, #f0e7d2 20px 40px)`,
        }}
      >
        <img
          src={imageUrl}
          alt="手稿"
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={(e) => {
            const el = e.target as HTMLImageElement;
            setImgSize({ w: el.naturalWidth, h: el.naturalHeight });
            setImgLoaded(true);
          }}
          draggable={false}
        />

        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full touch-none"
          viewBox={`0 0 1000 ${imgSize.h ? (1000 * imgSize.h) / imgSize.w : 750}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            setDraftArrow(null);
          }}
          style={{
            cursor:
              tool === 'arrow'
                ? 'crosshair'
                : tool === 'polygon'
                ? 'cell'
                : tool === 'eraser'
                ? 'not-allowed'
                : 'default',
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B2F2F" />
            </marker>
            <marker
              id="arrowhead-selected"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#B23A48" />
            </marker>
          </defs>

          {showArrows &&
            layer.arrows.map((a) => (
              <ArrowRender
                key={a.id}
                arrow={a}
                selected={selectedId === a.id}
                onClick={() => !readOnly && setSelectedId(a.id)}
              />
            ))}

          {showPolygons &&
            layer.polygons.map((p) => (
              <PolygonRender
                key={p.id}
                polygon={p}
                selected={selectedId === p.id}
                onClick={() => {
                  if (readOnly) return;
                  setSelectedId(p.id);
                  if (tool === 'polygon' || tool === 'select') {
                    setNoteModal({ polygon: p, mode: 'edit' });
                  }
                }}
              />
            ))}

          {draftArrow && (
            <line
              x1={draftArrow.startX * 1000}
              y1={
                draftArrow.startY *
                (imgSize.h ? (1000 * imgSize.h) / imgSize.w : 750)
              }
              x2={draftArrow.endX * 1000}
              y2={
                draftArrow.endY *
                (imgSize.h ? (1000 * imgSize.h) / imgSize.w : 750)
              }
              stroke="#2D5A7B"
              strokeWidth={3}
              strokeDasharray="6 4"
              markerEnd="url(#arrowhead)"
            />
          )}

          {draftPolygon && (
            <PolygonDraftRender
              points={draftPolygon.points}
              viewBoxH={imgSize.h ? (1000 * imgSize.h) / imgSize.w : 750}
            />
          )}
        </svg>

        {tool === 'polygon' && draftPolygon && draftPolygon.points.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#3B2F2F]/90 text-[#FDF8EC] rounded-lg px-4 py-2 flex items-center gap-3 backdrop-blur text-sm">
            <span>
              已选择 <b>{draftPolygon.points.length}</b> 个顶点
              {draftPolygon.points.length >= 3 ? '，可闭合选区' : ''}
            </span>
            <button
              onClick={() =>
                setDraftPolygon({
                  points: draftPolygon.points.slice(0, -1),
                })
              }
              disabled={draftPolygon.points.length === 0}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs disabled:opacity-30"
            >
              撤销顶点
            </button>
            <button
              onClick={closePolygon}
              disabled={draftPolygon.points.length < 3}
              className="px-3 py-1 rounded bg-[#2D5A7B] hover:bg-[#244b66] text-xs disabled:opacity-30 flex items-center gap-1"
            >
              <CornerDownLeft size={12} /> 闭合 (Enter)
            </button>
            <button
              onClick={() => setDraftPolygon(null)}
              className="px-2 py-1 rounded bg-white/10 hover:bg-[#B23A48] text-xs flex items-center gap-1"
            >
              <X size={12} /> 取消 (Esc)
            </button>
          </div>
        )}

        {tool === 'polygon' && (!draftPolygon || draftPolygon.points.length === 0) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#2D5A7B]/90 text-white text-xs rounded-lg px-4 py-2 backdrop-blur">
            🔸 点击依次放置顶点 · Enter 闭合选区 · Esc 取消
          </div>
        )}

        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-[#8B6B3D]">
            <div className="animate-pulse">加载手稿图像…</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-[#5C4522]">
        <div className="flex items-center gap-3 flex-wrap">
          <span>当前工具：<b style={{ color: '#2D5A7B' }}>
            {tools.find((t) => t.id === tool)?.label}
          </b></span>
          <span>纤维走向：<b>{layer.arrows.length}</b> 条</span>
          <span>修补区域：<b>{layer.polygons.length}</b> 处</span>
        </div>
        {selectedId && !readOnly && (
          <button
            onClick={() => deleteItem(selectedId)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#B23A48]/10 text-[#B23A48] hover:bg-[#B23A48]/20"
          >
            <Trash2 size={12} /> 删除所选
          </button>
        )}
      </div>

      {noteModal && (
        <RepairNoteModal
          polygon={noteModal.polygon}
          mode={noteModal.mode}
          onCancel={() => {
            if (noteModal.mode === 'create' && newPolygonRef.current) {
              deleteItem(newPolygonRef.current.id);
              newPolygonRef.current = null;
            }
            setNoteModal(null);
          }}
          onSave={(p) => {
            updatePolygon(p);
            newPolygonRef.current = null;
            setNoteModal(null);
          }}
        />
      )}
    </div>
  );
}

function ArrowRender({
  arrow,
  selected,
  onClick,
}: {
  arrow: FiberArrow;
  selected: boolean;
  onClick: () => void;
}) {
  const color = selected ? '#B23A48' : arrow.color;
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <line
        x1={arrow.startX * 1000}
        y1={arrow.startY * 750}
        x2={arrow.endX * 1000}
        y2={arrow.endY * 750}
        stroke={color}
        strokeWidth={selected ? 4 : 3}
        markerEnd={`url(#arrowhead${selected ? '-selected' : ''})`}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={arrow.startX * 1000}
        cy={arrow.startY * 750}
        r={selected ? 6 : 4}
        fill={color}
        opacity={selected ? 1 : 0.6}
      />
      <title>{`纤维走向 ${arrow.angle.toFixed(1)}°${arrow.snappedTo15 ? ' (吸附)' : ''}`}</title>
      <text
        x={((arrow.startX + arrow.endX) / 2) * 1000 + 8}
        y={((arrow.startY + arrow.endY) / 2) * 750 - 8}
        fontSize={13}
        fill={color}
        fontFamily="'Source Han Serif', serif"
        fontWeight="bold"
      >
        {angleService.formatAngle(arrow.angle)}
      </text>
    </g>
  );
}

function PolygonRender({
  polygon,
  selected,
  onClick,
}: {
  polygon: RepairPolygon;
  selected: boolean;
  onClick: () => void;
}) {
  const fill = polygon.repairType === '补缺'
    ? 'rgba(178,58,72,0.18)'
    : polygon.repairType === '托裱'
    ? 'rgba(212,140,55,0.18)'
    : polygon.repairType === '接笔'
    ? 'rgba(45,90,123,0.18)'
    : polygon.repairType === '全色'
    ? 'rgba(90,123,45,0.18)'
    : 'rgba(92,69,34,0.18)';
  const stroke = selected ? '#B23A48' : '#5C4522';
  const pts = polygon.points
    .map((p) => `${p.x * 1000},${p.y * 750}`)
    .join(' ');
  const label = `[${polygon.repairType}] ${polygon.note || '未填写备注'}`;
  const cx = polygon.points.reduce((s, p) => s + p.x, 0) / polygon.points.length;
  const cy = polygon.points.reduce((s, p) => s + p.y, 0) / polygon.points.length;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <polygon
        points={pts}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 3 : 2}
        strokeDasharray={selected ? '6 3' : '4 2'}
      />
      {polygon.points.map((p, i) => (
        <circle
          key={i}
          cx={p.x * 1000}
          cy={p.y * 750}
          r={selected ? 5 : 3.5}
          fill={stroke}
          opacity={selected ? 1 : 0.75}
        />
      ))}
      <title>{label}</title>
      <g transform={`translate(${cx * 1000}, ${cy * 750})`}>
        <rect
          x={-50}
          y={-14}
          width={100}
          height={20}
          rx={4}
          fill={stroke}
          opacity={0.85}
        />
        <text
          y={0}
          textAnchor="middle"
          fontSize={11}
          fill="#FDF8EC"
          fontFamily="'Source Han Serif', serif"
        >
          {polygon.repairType}
        </text>
      </g>
    </g>
  );
}

function PolygonDraftRender({
  points,
  viewBoxH,
}: {
  points: Array<{ x: number; y: number }>;
  viewBoxH: number;
}) {
  const abs = points.map((p) => ({ x: p.x * 1000, y: p.y * viewBoxH }));
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < abs.length - 1; i++) {
    lines.push(
      <line
        key={i}
        x1={abs[i].x}
        y1={abs[i].y}
        x2={abs[i + 1].x}
        y2={abs[i + 1].y}
        stroke="#2D5A7B"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
    );
  }
  return (
    <g>
      {lines}
      {abs.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={5}
          fill="#2D5A7B"
          stroke="#FDF8EC"
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

function LayerToggle({
  icon,
  label,
  count,
  on,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition ${
        on
          ? 'border-[#2D5A7B] text-[#2D5A7B] bg-[#2D5A7B]/5'
          : 'border-[#8B6B3D]/30 text-[#5C4522]/60 bg-[#FDF8EC]/40 line-through'
      }`}
    >
      {icon}
      {label}
      <span
        className={`text-[10px] px-1.5 rounded-full ${
          on ? 'bg-[#2D5A7B] text-white' : 'bg-[#8B6B3D]/20 text-[#5C4522]/60'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function RepairNoteModal({
  polygon,
  mode,
  onCancel,
  onSave,
}: {
  polygon: RepairPolygon;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSave: (p: RepairPolygon) => void;
}) {
  const [type, setType] = useState<RepairType>(polygon.repairType);
  const [note, setNote] = useState(polygon.note);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2F2F]/60 backdrop-blur-sm">
      <div
        className="w-[min(92vw,480px)] rounded-2xl p-6 shadow-2xl"
        style={{ background: '#FDF8EC', border: '1px solid #8B6B3D55' }}
      >
        <h3 className="text-xl font-bold mb-1" style={{ color: '#3B2F2F', fontFamily: "'Source Han Serif', serif" }}>
          {mode === 'create' ? '新建修补区域' : '编辑修补区域'}
        </h3>
        <p className="text-xs text-[#8B6B3D] mb-5">
          标注修补类型并填写备注，便于审核与外审追溯
        </p>

        <label className="block text-sm mb-2 font-medium" style={{ color: '#3B2F2F' }}>
          修补类型
        </label>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {REPAIR_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-2 rounded-lg text-sm border transition ${
                type === t
                  ? 'text-white shadow'
                  : 'border-[#8B6B3D]/30 text-[#3B2F2F] hover:bg-[#EFE5CF]'
              }`}
              style={type === t ? { background: repairColor(t) } : {}}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="block text-sm mb-2 font-medium" style={{ color: '#3B2F2F' }}>
          文字备注
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="例：左上角虫蛀直径约1.2cm，采用桑皮纸托裱修复，浆糊浓度1.2%"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#2D5A7B] transition"
          style={{
            borderColor: '#8B6B3D55',
            background: '#FFFBF1',
            color: '#3B2F2F',
            resize: 'vertical',
          }}
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-[#5C4522] hover:bg-[#EFE5CF] transition"
          >
            {mode === 'create' ? '取消并删除' : '取消'}
          </button>
          <button
            onClick={() => onSave({ ...polygon, repairType: type, note })}
            className="px-5 py-2 rounded-lg text-sm text-white shadow-md hover:opacity-90 transition"
            style={{ background: '#2D5A7B' }}
          >
            保存标注
          </button>
        </div>
      </div>
    </div>
  );
}

function repairColor(t: RepairType): string {
  switch (t) {
    case '补缺':
      return '#B23A48';
    case '托裱':
      return '#C97F30';
    case '接笔':
      return '#2D5A7B';
    case '全色':
      return '#5A7B2D';
    default:
      return '#5C4522';
  }
}

function findHit(
  p: { x: number; y: number },
  layer: AnnotationLayer,
  tol: number
): string | null {
  for (const a of layer.arrows) {
    const d = distPointToSegment(p, { x: a.startX, y: a.startY }, { x: a.endX, y: a.endY });
    if (d < tol) return a.id;
  }
  for (const pol of layer.polygons) {
    if (pointInPolygon(p, pol.points)) return pol.id;
  }
  return null;
}
function distPointToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1e-9;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = a.x + t * dx,
    qy = a.y + t * dy;
  return Math.hypot(p.x - qx, p.y - qy);
}
function pointInPolygon(p: { x: number; y: number }, poly: Array<{ x: number; y: number }>) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
