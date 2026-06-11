import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Download,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Filter,
  PenTool,
  Search,
  SplitSquareVertical,
  Trash2,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { angleService } from '../services/angleService';
import { storageService } from '../services/storageService';
import { CaptureRecord, Manuscript } from '../types';

interface EnrichedRecord extends CaptureRecord {
  manuscriptTitle?: string;
  manuscriptCode?: string;
  imgThumb?: string;
  arrows: number;
  polygons: number;
}

export default function RecordList() {
  const [sp] = useSearchParams();
  const highlight = sp.get('highlight');

  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState<EnrichedRecord[]>([]);
  const [mans, setMans] = useState<Manuscript[]>([]);
  const [filterMan, setFilterMan] = useState('');
  const [filterNeed, setFilterNeed] = useState<'all' | 'need' | 'ok'>('all');
  const [filterAnnot, setFilterAnnot] = useState<'all' | 'done' | 'pending'>('all');
  const [kw, setKw] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const manuscripts = await storageService.listManuscripts();
      setMans(manuscripts);
      const list = await storageService.listCaptures();
      const enriched: EnrichedRecord[] = [];
      for (const r of list) {
        const m = manuscripts.find((x) => x.id === r.manuscriptId);
        const got = await storageService.getCapture(r.id);
        const ann = await storageService.getAnnotations(r.id);
        enriched.push({
          ...r,
          manuscriptTitle: m?.title,
          manuscriptCode: m?.code,
          imgThumb: got?.url,
          arrows: ann?.arrows.length ?? 0,
          polygons: ann?.polygons.length ?? 0,
        });
      }
      setAll(enriched);
      setLoading(false);
      if (highlight) {
        setTimeout(() => {
          document
            .getElementById('row-' + highlight)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
    })();
  }, [highlight]);

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (filterMan && r.manuscriptId !== filterMan) return false;
      if (filterNeed === 'need' && !r.needsRetake) return false;
      if (filterNeed === 'ok' && r.needsRetake) return false;
      const annotated = r.arrows > 0 && r.polygons > 0;
      if (filterAnnot === 'done' && !annotated) return false;
      if (filterAnnot === 'pending' && annotated) return false;
      if (kw) {
        const q = kw.toLowerCase();
        if (
          !(r.manuscriptCode?.toLowerCase().includes(q)) &&
          !(r.manuscriptTitle?.toLowerCase().includes(q)) &&
          !String(r.pageNum).includes(q) &&
          !r.capturedBy.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [all, filterMan, filterNeed, filterAnnot, kw]);

  const stats = useMemo(() => {
    const need = all.filter((r) => r.needsRetake).length;
    const annotated = all.filter((r) => r.arrows > 0 && r.polygons > 0).length;
    return { total: all.length, need, annotated, pending: all.length - annotated };
  }, [all]);

  const toggleSel = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const onDelete = async (id: string) => {
    await storageService.deleteCapture(id);
    setAll((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    setConfirmDel(null);
  };

  const exportIds = Array.from(selected);

  return (
    <div className="min-h-screen" style={{ background: '#F5EFE0' }}>
      <header
        className="sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between flex-wrap gap-3 border-b backdrop-blur"
        style={{ borderColor: '#8B6B3D33', background: 'rgba(245,239,224,0.92)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-[#EFE5CF] transition"
            style={{ borderColor: '#8B6B3D44', color: '#3B2F2F' }}
          >
            <ArrowLeft size={14} /> 首页
          </Link>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "'LXGW WenKai', serif", color: '#3B2F2F' }}
          >
            采集记录
          </h1>
          <div className="flex items-center gap-1 text-xs ml-2">
            <StatChip label="总数" value={stats.total} tone="#2D5A7B" />
            <StatChip label="待重拍" value={stats.need} tone="#B23A48" />
            <StatChip label="已标注" value={stats.annotated} tone="#5A7B2D" />
            <StatChip label="待标注" value={stats.pending} tone="#C97F30" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/export?ids=${exportIds.join(',')}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
              exportIds.length > 0 ? 'text-white shadow hover:opacity-90' : 'text-[#5C4522] border opacity-60 cursor-not-allowed'
            }`}
            style={exportIds.length > 0 ? { background: '#5A7B2D' } : { borderColor: '#8B6B3D44' }}
          >
            <Download size={14} />
            导出选中 {exportIds.length > 0 ? `(${exportIds.length})` : ''}
          </Link>
        </div>
      </header>

      <main className="px-4 md:px-8 py-5 max-w-7xl mx-auto">
        <div
          className="rounded-2xl border p-4 mb-5 flex flex-wrap gap-3 items-center"
          style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
        >
          <Filter size={16} style={{ color: '#8B6B3D' }} />
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8B6B3D' }} />
            <input
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              placeholder="搜索编号 / 标题 / 页码 / 采集人…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none focus:border-[#2D5A7B]"
              style={{ borderColor: '#8B6B3D55', background: '#FFFBF1', color: '#3B2F2F' }}
            />
          </div>
          <Sel
            label="手稿"
            value={filterMan}
            onChange={setFilterMan}
            options={[
              { v: '', t: '全部手稿' },
              ...mans.map((m) => ({ v: m.id, t: `${m.code} ${m.title.slice(0, 8)}` })),
            ]}
          />
          <Sel
            label="重拍状态"
            value={filterNeed}
            onChange={(v) => setFilterNeed(v as typeof filterNeed)}
            options={[
              { v: 'all', t: '全部' },
              { v: 'need', t: '待重拍' },
              { v: 'ok', t: '已合格' },
            ]}
          />
          <Sel
            label="标注状态"
            value={filterAnnot}
            onChange={(v) => setFilterAnnot(v as typeof filterAnnot)}
            options={[
              { v: 'all', t: '全部' },
              { v: 'done', t: '已完成' },
              { v: 'pending', t: '待标注' },
            ]}
          />
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#EFE5CF', color: '#5C4522' }}>
                  <th className="text-left p-3 pl-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-[#2D5A7B]"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold">缩略图</th>
                  <th className="text-left p-3 font-semibold">手稿信息</th>
                  <th className="text-left p-3 font-semibold">页/版</th>
                  <th className="text-left p-3 font-semibold">角度</th>
                  <th className="text-left p-3 font-semibold">标注</th>
                  <th className="text-left p-3 font-semibold">采集人·时间</th>
                  <th className="text-left p-3 font-semibold pr-5">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center" style={{ color: '#8B6B3D' }}>
                      加载采集记录…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-14 text-center">
                      <FileText size={36} className="mx-auto mb-3" style={{ color: '#8B6B3D55' }} />
                      <div className="mb-1 font-bold" style={{ color: '#3B2F2F' }}>无匹配的采集记录</div>
                      <div className="text-xs mb-4" style={{ color: '#8B6B3D' }}>
                        尚未采集或筛选条件过于严格
                      </div>
                      <Link
                        to="/"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white"
                        style={{ background: '#2D5A7B' }}
                      >
                        <Camera size={14} /> 去采集
                      </Link>
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const dev = angleService.computeDeviation(r.actualAngle, r.targetAngle);
                  const over = dev > 2;
                  const annotDone = r.arrows > 0 && r.polygons > 0;
                  const hl = highlight === r.id;
                  return (
                    <tr
                      key={r.id}
                      id={'row-' + r.id}
                      className={`border-t transition ${
                        selected.has(r.id) ? 'bg-[#2D5A7B]/5' : 'hover:bg-[#F5EFE0]'
                      } ${hl ? 'ring-2 ring-[#C97F30]' : ''}`}
                      style={{ borderColor: over ? '#B23A4833' : '#8B6B3D22', background: over ? 'rgba(178,58,72,0.035)' : undefined }}
                    >
                      <td className="p-3 pl-4">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSel(r.id)}
                          className="w-4 h-4 accent-[#2D5A7B]"
                        />
                      </td>
                      <td className="p-3">
                        {r.imgThumb && (
                          <Link to={`/annotate/${r.id}`}>
                            <img
                              src={r.imgThumb}
                              alt="缩略"
                              className="w-20 h-14 object-cover rounded-md border"
                              style={{ borderColor: '#8B6B3D44' }}
                            />
                          </Link>
                        )}
                      </td>
                      <td className="p-3 min-w-[200px]">
                        <div className="text-xs font-mono" style={{ color: '#8B6B3D' }}>
                          {r.manuscriptCode}
                        </div>
                        <div
                          className="font-bold leading-snug"
                          style={{ color: '#3B2F2F', fontFamily: "'LXGW WenKai', serif" }}
                        >
                          {r.manuscriptTitle}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold tabular-nums" style={{ color: '#3B2F2F' }}>
                          第 {r.pageNum} 页
                        </div>
                        <div className="text-xs" style={{ color: '#8B6B3D' }}>
                          版本 v{r.version}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold" style={{ color: '#2D5A7B' }}>
                            {angleService.formatAngle(r.actualAngle)}
                          </span>
                          {over ? (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: '#B23A4822', color: '#B23A48' }}
                            >
                              <AlertTriangle size={11} />
                              {dev.toFixed(2)}°
                            </span>
                          ) : (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: '#5A7B2D20', color: '#5A7B2D' }}
                            >
                              <CheckCircle size={11} />
                              {dev.toFixed(2)}°
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#8B6B3D' }}>
                          目标 {angleService.formatAngle(r.targetAngle)}
                          {r.lowBlueMode ? ' · 低蓝光' : ''}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ background: '#3B2F2F' }}
                            />
                            纤维箭头 <b style={{ color: r.arrows > 0 ? '#5A7B2D' : '#B23A48' }}>{r.arrows}</b>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ background: '#B23A48' }}
                            />
                            修补区域 <b style={{ color: r.polygons > 0 ? '#5A7B2D' : '#B23A48' }}>{r.polygons}</b>
                          </div>
                          <div className="mt-1">
                            {annotDone ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 w-fit" style={{ background: '#5A7B2D22', color: '#5A7B2D' }}>
                                <CheckCircle size={10} /> 标注完成
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 w-fit" style={{ background: '#C97F3022', color: '#C97F30' }}>
                                <AlertTriangle size={10} /> 待标注
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <div style={{ color: '#3B2F2F' }}>{r.capturedBy}</div>
                        <div style={{ color: '#8B6B3D' }}>
                          {new Date(r.capturedAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="p-3 pr-5">
                        <div className="flex flex-wrap gap-1.5">
                          <Link
                            to={`/annotate/${r.id}`}
                            title="标注"
                            className="p-1.5 rounded-md border hover:bg-[#2D5A7B] hover:text-white hover:border-[#2D5A7B] transition"
                            style={{ borderColor: '#8B6B3D44', color: '#2D5A7B' }}
                          >
                            <PenTool size={14} />
                          </Link>
                          <Link
                            to={`/capture/${r.manuscriptId}/${r.pageNum}`}
                            title="重拍"
                            className={`p-1.5 rounded-md border transition ${
                              over
                                ? 'bg-[#B23A48] text-white border-[#B23A48] hover:bg-[#8B2E38]'
                                : 'hover:bg-[#C97F30] hover:text-white hover:border-[#C97F30]'
                            }`}
                            style={over ? {} : { borderColor: '#8B6B3D44', color: '#C97F30' }}
                          >
                            <RotateCcw size={14} />
                          </Link>
                          <Link
                            to={`/diff/${r.manuscriptId}/${r.pageNum}`}
                            title="历史对比"
                            className="p-1.5 rounded-md border hover:bg-[#C97F30] hover:text-white hover:border-[#C97F30] transition"
                            style={{ borderColor: '#8B6B3D44', color: '#C97F30' }}
                          >
                            <SplitSquareVertical size={14} />
                          </Link>
                          <button
                            title="删除"
                            onClick={() => setConfirmDel(r.id)}
                            className="p-1.5 rounded-md border hover:bg-[#B23A48] hover:text-white hover:border-[#B23A48] transition"
                            style={{ borderColor: '#8B6B3D44', color: '#B23A48' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs" style={{ color: '#8B6B3D' }}>
          <div>
            共 <b style={{ color: '#3B2F2F' }}>{filtered.length}</b> 条记录，已选择{' '}
            <b style={{ color: '#2D5A7B' }}>{selected.size}</b> 条
          </div>
          <Link to="/" className="flex items-center gap-1 hover:text-[#2D5A7B] transition">
            返回首页 <ChevronRight size={12} />
          </Link>
        </div>
      </main>

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2F2F]/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl border"
            style={{ background: '#FDF8EC', borderColor: '#B23A4855' }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#B23A4822', color: '#B23A48' }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: '#3B2F2F', fontFamily: "'LXGW WenKai', serif" }}>
                  确认删除此采集记录？
                </h3>
                <p className="text-sm" style={{ color: '#5C4522' }}>
                  将同时删除原始图像、EXIF 元数据以及所有标注层，操作无法撤销。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDel(null)}
                className="px-4 py-2 rounded-lg text-sm hover:bg-[#EFE5CF] transition"
                style={{ color: '#5C4522' }}
              >
                取消
              </button>
              <button
                onClick={() => onDelete(confirmDel)}
                className="px-4 py-2 rounded-lg text-sm text-white shadow hover:opacity-90 transition"
                style={{ background: '#B23A48' }}
              >
                永久删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div
      className="px-2.5 py-1 rounded-md flex items-center gap-1.5 border"
      style={{ borderColor: tone + '44', background: tone + '11' }}
    >
      <span style={{ color: '#8B6B3D' }}>{label}</span>
      <span className="font-bold tabular-nums" style={{ color: tone }}>
        {value}
      </span>
    </div>
  );
}

function Sel({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ v: string; t: string }>;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span style={{ color: '#5C4522' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 rounded-md border text-sm outline-none focus:border-[#2D5A7B]"
        style={{ borderColor: '#8B6B3D55', background: '#FFFBF1', color: '#3B2F2F' }}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    </label>
  );
}
