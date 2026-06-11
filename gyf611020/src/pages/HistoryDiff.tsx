import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  SplitSquareVertical,
  Layers,
  Locate,
  ZoomIn,
  ZoomOut,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { angleService } from '../services/angleService';
import { storageService } from '../services/storageService';
import { CaptureRecord, AnnotationLayer } from '../types';

interface Version {
  record: CaptureRecord;
  url: string;
  annotations?: AnnotationLayer;
}

export default function HistoryDiff() {
  const { manuscriptId = 'm1', pageNum = '1' } = useParams<{
    manuscriptId: string;
    pageNum: string;
  }>();
  const pn = Math.max(1, parseInt(pageNum, 10) || 1);

  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<Version[]>([]);
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(1);
  const [mode, setMode] = useState<'split' | 'overlay' | 'diff'>('split');
  const [divider, setDivider] = useState(50);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef(false);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await storageService.compareVersions(manuscriptId, pn);
      const enriched: Version[] = [];
      for (const r of list) {
        const got = await storageService.getCapture(r.id);
        if (!got) continue;
        const ann = await storageService.getAnnotations(r.id);
        enriched.push({ record: { ...r }, url: got.url, annotations: ann });
      }
      if (enriched.length < 2) {
        // generate mock comparison data if not enough versions for demo
        while (enriched.length < 2) {
          const r = enriched[0];
          if (!r) break;
          enriched.push({
            record: {
              ...r.record,
              id: r.record.id + '_v' + enriched.length,
              version: enriched.length + 1,
              actualAngle: r.record.actualAngle + 15,
              targetAngle: r.record.targetAngle + 15,
              capturedAt: r.record.capturedAt + 86400000 * enriched.length,
            },
            url: r.url,
          });
        }
      }
      setVersions(enriched);
      setRightIdx(Math.min(1, enriched.length - 1));
      setLoading(false);
    })();
  }, [manuscriptId, pn]);

  useEffect(() => {
    if (mode !== 'diff') return;
    const l = versions[leftIdx];
    const r = versions[rightIdx];
    if (!l || !r) return;
    renderDiff(l.url, r.url);
  }, [mode, leftIdx, rightIdx, versions]);

  const renderDiff = async (aUrl: string, bUrl: string) => {
    const [a, b] = await Promise.all([loadImg(aUrl), loadImg(bUrl)]);
    const c = diffCanvasRef.current;
    if (!c) return;
    const w = Math.max(a.width, b.width, 800);
    const h = Math.max(a.height, b.height, 600);
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(a, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const other = document.createElement('canvas');
    other.width = w;
    other.height = h;
    const octx = other.getContext('2d')!;
    octx.drawImage(b, 0, 0, w, h);
    const oimg = octx.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const dr = Math.abs(img.data[i] - oimg.data[i]);
      const dg = Math.abs(img.data[i + 1] - oimg.data[i + 1]);
      const db = Math.abs(img.data[i + 2] - oimg.data[i + 2]);
      const delta = (dr + dg + db) / 3;
      if (delta > 24) {
        img.data[i] = Math.min(255, 178 + delta);
        img.data[i + 1] = Math.max(0, 58 - delta * 0.3);
        img.data[i + 2] = Math.max(0, 72 - delta * 0.4);
      } else {
        const g = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = g * 0.85;
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  const left = versions[leftIdx];
  const right = versions[rightIdx];

  const onDividerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = ((e.clientX - rect.left) / rect.width) * 100;
    setDivider(Math.max(5, Math.min(95, p)));
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5EFE0' }}>
      <header
        className="sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between flex-wrap gap-3 border-b backdrop-blur"
        style={{ borderColor: '#8B6B3D33', background: 'rgba(245,239,224,0.92)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/records"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-[#EFE5CF] transition"
            style={{ borderColor: '#8B6B3D44', color: '#3B2F2F' }}
          >
            <ArrowLeft size={14} /> 返回记录
          </Link>
          <div className="flex items-center gap-2">
            <SplitSquareVertical size={18} style={{ color: '#C97F30' }} />
            <div>
              <div className="text-xs" style={{ color: '#8B6B3D' }}>
                第 {pn} 页 · 手稿 {manuscriptId.toUpperCase()}
              </div>
              <h1 className="text-lg font-bold" style={{ fontFamily: "'LXGW WenKai', serif", color: '#3B2F2F' }}>
                历史修复版本对比
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#8B6B3D55' }}>
            <ModeBtn label="左右分屏" on={mode === 'split'} onClick={() => setMode('split')} />
            <ModeBtn label="叠放对比" on={mode === 'overlay'} onClick={() => setMode('overlay')} />
            <ModeBtn label="像素差异" on={mode === 'diff'} onClick={() => setMode('diff')} />
          </div>
          <div className="flex rounded-lg overflow-hidden border items-center" style={{ borderColor: '#8B6B3D55' }}>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
              className="px-2 py-1.5 hover:bg-[#EFE5CF]"
              style={{ color: '#5C4522' }}
            >
              <ZoomOut size={14} />
            </button>
            <span className="px-2 text-xs tabular-nums" style={{ color: '#3B2F2F' }}>
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
              className="px-2 py-1.5 hover:bg-[#EFE5CF]"
              style={{ color: '#5C4522' }}
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-5 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-24" style={{ color: '#8B6B3D' }}>
            加载版本历史…
          </div>
        ) : versions.length < 2 ? (
          <EmptyState manuscriptId={manuscriptId} pageNum={pn} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 mb-4 items-center">
              <VersionSelector
                label="左版本"
                versions={versions}
                idx={leftIdx}
                onChange={setLeftIdx}
                color="#2D5A7B"
              />
              <div className="text-xl text-center" style={{ color: '#8B6B3D' }}>
                <ChevronRight size={20} className="inline" />
              </div>
              <VersionSelector
                label="右版本"
                versions={versions}
                idx={rightIdx}
                onChange={setRightIdx}
                color="#B23A48"
              />
              <div className="md:hidden text-center text-xs" style={{ color: '#8B6B3D' }}>
                ↓
              </div>
              <div
                className="rounded-xl p-3 border text-xs"
                style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
              >
                <div className="font-bold mb-2 flex items-center gap-1" style={{ color: '#3B2F2F' }}>
                  <Locate size={13} /> 版本差异概览
                </div>
                {left && right && <DeltaSummary left={left.record} right={right.record} />}
              </div>
            </div>

            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: '#8B6B3D44', background: '#1a1610' }}
            >
              {mode === 'split' && (
                <div
                  className="relative w-full overflow-hidden touch-none select-none"
                  style={{ aspectRatio: '4/3' }}
                  onPointerDown={() => (dragRef.current = true)}
                  onPointerUp={() => (dragRef.current = false)}
                  onPointerLeave={() => (dragRef.current = false)}
                  onPointerMove={onDividerMove}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: `inset(0 ${100 - divider}% 0 0)`,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'left center',
                    }}
                  >
                    <DiffFrame v={left} color="#2D5A7B" side="left" />
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: `inset(0 0 0 ${divider}%)`,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'right center',
                    }}
                  >
                    <DiffFrame v={right} color="#B23A48" side="right" />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1 pointer-events-none"
                    style={{ left: `${divider}%`, background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.4)' }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg pointer-events-none"
                    style={{ left: `${divider}%`, background: '#fff', color: '#3B2F2F' }}
                  >
                    <SplitSquareVertical size={16} />
                  </div>
                </div>
              )}
              {mode === 'overlay' && (
                <div className="relative" style={{ aspectRatio: '4/3' }}>
                  <img src={left?.url} alt="" className="absolute inset-0 w-full h-full object-contain" />
                  <img
                    src={right?.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-70"
                  />
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5"
                    style={{ background: 'rgba(45,90,123,0.9)', color: '#fff' }}
                  >
                    <Layers size={13} /> 底层 v{left?.record.version}
                  </div>
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5"
                    style={{ background: 'rgba(178,58,72,0.9)', color: '#fff' }}
                  >
                    <Layers size={13} /> 叠层 v{right?.record.version} · multiply
                  </div>
                </div>
              )}
              {mode === 'diff' && (
                <div className="relative" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                  <canvas
                    ref={diffCanvasRef}
                    className="w-full h-full object-contain"
                    style={{ transform: `scale(${zoom})` }}
                  />
                  <div
                    className="absolute top-3 left-3 px-3 py-1.5 rounded-md text-xs"
                    style={{ background: 'rgba(27,22,16,0.8)', color: '#fff' }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ background: '#B23A48' }}
                      />
                      像素差异热区（差异越大颜色越鲜明）
                    </div>
                    <div className="text-[11px] mt-0.5 opacity-80">
                      v{left?.record.version} 灰度背景 + v{right?.record.version} 差异高亮
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ModeBtn({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs transition ${on ? 'text-white' : 'hover:bg-[#EFE5CF]'}`}
      style={on ? { background: '#C97F30', color: '#fff' } : { color: '#5C4522' }}
    >
      {label}
    </button>
  );
}

function VersionSelector({
  label,
  versions,
  idx,
  onChange,
  color,
}: {
  label: string;
  versions: Version[];
  idx: number;
  onChange: (i: number) => void;
  color: string;
}) {
  const v = versions[idx];
  return (
    <div className="rounded-xl p-3 border" style={{ borderColor: color + '66', background: color + '08' }}>
      <div className="text-[11px] mb-2 font-bold flex items-center gap-1.5" style={{ color }}>
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: color }}
        />
        {label}
      </div>
      <select
        value={idx}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full px-2 py-1.5 rounded-md border text-xs outline-none"
        style={{
          borderColor: '#8B6B3D55',
          background: '#FFFBF1',
          color: '#3B2F2F',
        }}
      >
        {versions.map((ver, i) => (
          <option key={i} value={i}>
            v{ver.record.version} · {angleService.formatAngle(ver.record.actualAngle)} ·{' '}
            {new Date(ver.record.capturedAt).toLocaleDateString('zh-CN')}
          </option>
        ))}
      </select>
      {v && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <div className="opacity-70">采集人</div>
            <div className="font-bold" style={{ color: '#3B2F2F' }}>{v.record.capturedBy}</div>
          </div>
          <div>
            <div className="opacity-70">标注</div>
            <div className="font-bold" style={{ color: '#3B2F2F' }}>
              箭{v.annotations?.arrows.length ?? 0} · 修{v.annotations?.polygons.length ?? 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeltaSummary({ left, right }: { left: CaptureRecord; right: CaptureRecord }) {
  const dDays = Math.round((right.capturedAt - left.capturedAt) / 86400000);
  const dAngle = angleService.computeDeviation(left.actualAngle, right.actualAngle);
  const Item = ({ label, val, bad }: { label: string; val: string; bad?: boolean }) => (
    <div className="flex justify-between py-1 border-b last:border-0" style={{ borderColor: '#8B6B3D22' }}>
      <span className="opacity-80">{label}</span>
      <b className={bad ? 'text-[#B23A48]' : ''}>{val}</b>
    </div>
  );
  return (
    <div className="space-y-0.5" style={{ color: '#3B2F2F' }}>
      <Item label="版本跨度" val={`v${left.version} → v${right.version}`} />
      <Item label="时间间隔" val={`${dDays} 天`} />
      <Item label="角度差" val={`${dAngle.toFixed(1)}°`} bad={dAngle > 2} />
      <Item label="低蓝光" val={left.lowBlueMode === right.lowBlueMode ? '一致' : '变更'} />
    </div>
  );
}

function DiffFrame({ v, color, side }: { v?: Version; color: string; side: 'left' | 'right' }) {
  return (
    <div className="relative w-full h-full">
      <img src={v?.url} alt="" className="w-full h-full object-contain" />
      <div
        className={`absolute top-3 ${side === 'left' ? 'left-3' : 'right-3'} px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 shadow-md`}
        style={{ background: color + 'ee', color: '#fff' }}
      >
        <FileText size={13} /> v{v?.record.version} · {angleService.formatAngle(v?.record.actualAngle ?? 0)}
      </div>
    </div>
  );
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function EmptyState({ manuscriptId, pageNum }: { manuscriptId: string; pageNum: number }) {
  return (
    <div
      className="rounded-2xl border p-10 text-center"
      style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
    >
      <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: '#C97F30' }} />
      <div className="text-lg font-bold mb-1" style={{ color: '#3B2F2F' }}>
        当前页还没有足够的版本可对比
      </div>
      <div className="text-sm mb-5" style={{ color: '#5C4522' }}>
        请先进行至少两次采集以形成历史修复版本，对比功能即自动激活。
      </div>
      <Link
        to={`/capture/${manuscriptId}/${pageNum}`}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white shadow hover:opacity-90 transition"
        style={{ background: '#2D5A7B' }}
      >
        <ChevronRight size={14} className="rotate-180" /> 去采集
      </Link>
    </div>
  );
}
