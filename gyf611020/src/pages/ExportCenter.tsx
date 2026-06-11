import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Package,
  FolderTree,
  Info,
} from 'lucide-react';
import { angleService } from '../services/angleService';
import { exportService } from '../services/exportService';
import { storageService } from '../services/storageService';
import { CaptureRecord, Manuscript } from '../types';

interface Row extends CaptureRecord {
  code?: string;
  title?: string;
  selected?: boolean;
}

export default function ExportCenter() {
  const [sp] = useSearchParams();
  const initialIds = sp.get('ids')?.split(',').filter(Boolean) ?? [];

  const [loading, setLoading] = useState(true);
  const [mans, setMans] = useState<Manuscript[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [manFilter, setManFilter] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const manuscripts = await storageService.listManuscripts();
      setMans(manuscripts);
      const list = await storageService.listCaptures();
      const withInfo = list.map((r) => ({
        ...r,
        code: manuscripts.find((m) => m.id === r.manuscriptId)?.code,
        title: manuscripts.find((m) => m.id === r.manuscriptId)?.title,
        selected: initialIds.includes(r.id),
      }));
      setRows(withInfo);
      setSel(new Set(withInfo.filter((r) => initialIds.includes(r.id)).map((r) => r.id)));
      setLoading(false);
    })();
  }, [initialIds]);

  const filtered = useMemo(
    () => (manFilter ? rows.filter((r) => r.manuscriptId === manFilter) : rows),
    [rows, manFilter]
  );

  const toggle = (id: string) => {
    setSel((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (filtered.every((r) => sel.has(r.id))) {
      setSel((prev) => {
        const n = new Set(prev);
        filtered.forEach((r) => n.delete(r.id));
        return n;
      });
    } else {
      setSel((prev) => {
        const n = new Set(prev);
        filtered.forEach((r) => n.add(r.id));
        return n;
      });
    }
  };

  const selectedRows = rows.filter((r) => sel.has(r.id));
  const needRetakeCount = selectedRows.filter((r) => r.needsRetake).length;

  const doExport = async () => {
    if (selectedRows.length === 0) return;
    const ids = Array.from(sel);
    setProgress(0);
    setLog((l) => [`✅ 开始导出 ${ids.length} 条记录…`, ...l]);
    try {
      const blob = await exportService.exportBatch(ids, (p) => {
        setProgress(p * 100);
      });
      const name = `MSL-IIIF-${new Date().toISOString().slice(0, 10)}-${ids.length}.zip`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
      setProgress(100);
      setLog((l) => [
        `🎉 导出成功：${name} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
        `📦 IIIF Manifest + ${ids.length} 图像 + 标注层 + 元数据已打包`,
        ...l,
      ]);
    } catch (e) {
      setLog((l) => [`❌ 导出失败：${e instanceof Error ? e.message : String(e)}`, ...l]);
      setProgress(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5EFE0' }}>
      <header
        className="sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between flex-wrap gap-3 border-b backdrop-blur"
        style={{ borderColor: '#8B6B3D33', background: 'rgba(245,239,224,0.92)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/records"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-[#EFE5CF] transition"
            style={{ borderColor: '#8B6B3D44', color: '#3B2F2F' }}
          >
            <ArrowLeft size={14} /> 返回记录
          </Link>
          <div className="flex items-center gap-2">
            <Download size={20} style={{ color: '#5A7B2D' }} />
            <div>
              <div className="text-xs" style={{ color: '#8B6B3D' }}>
                IIIF Presentation API 3.0 合规
              </div>
              <h1 className="text-lg font-bold" style={{ fontFamily: "'LXGW WenKai', serif", color: '#3B2F2F' }}>
                国际标准图像互操作导出中心
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: '#8B6B3D44', background: '#FDF8EC', color: '#3B2F2F' }}>
            已选 <b style={{ color: '#5A7B2D' }}>{selectedRows.length}</b> 条
            {needRetakeCount > 0 && (
              <span className="ml-2 text-[#B23A48]">
                (含 <AlertTriangle size={12} className="inline" /> {needRetakeCount} 条待重拍)
              </span>
            )}
          </div>
          <button
            disabled={selectedRows.length === 0 || progress !== null}
            onClick={doExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#5A7B2D' }}
          >
            {progress !== null ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Package size={16} />
            )}
            {progress !== null ? `导出中 ${progress.toFixed(0)}%` : '批量打包导出'}
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-5 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <section>
          <div
            className="rounded-2xl border p-4 mb-4 flex flex-wrap items-center gap-3"
            style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
          >
            <label className="text-xs flex items-center gap-2">
              <input
                type="checkbox"
                checked={filtered.length > 0 && filtered.every((r) => sel.has(r.id))}
                onChange={toggleAll}
                className="w-4 h-4 accent-[#5A7B2D]"
              />
              全选当前筛选
            </label>
            <div className="flex-1 min-w-[180px]">
              <select
                value={manFilter}
                onChange={(e) => setManFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border text-sm outline-none"
                style={{ borderColor: '#8B6B3D55', background: '#FFFBF1', color: '#3B2F2F' }}
              >
                <option value="">全部手稿</option>
                {mans.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} · {m.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setSel(new Set())}
              className="text-xs px-3 py-1.5 rounded-md border hover:bg-[#EFE5CF] transition"
              style={{ borderColor: '#8B6B3D44', color: '#5C4522' }}
            >
              清空选择
            </button>
          </div>

          {progress !== null && (
            <div
              className="rounded-2xl border p-4 mb-4"
              style={{ borderColor: '#5A7B2D66', background: '#5A7B2D10' }}
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="font-bold flex items-center gap-2" style={{ color: '#3B2F2F' }}>
                  <Loader2 size={14} className="animate-spin text-[#5A7B2D]" />
                  正在生成 IIIF 包…
                </div>
                <div className="font-mono tabular-nums" style={{ color: '#5A7B2D' }}>
                  {progress.toFixed(0)}%
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#D4C5A3' }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #5A7B2D, #7fa04a)',
                  }}
                />
              </div>
              {log.length > 0 && (
                <div className="mt-3 p-3 rounded-lg text-xs font-mono space-y-1 max-h-36 overflow-y-auto" style={{ background: '#FDF8EC', color: '#3B2F2F' }}>
                  {log.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#EFE5CF', color: '#5C4522' }}>
                    <th className="p-3 text-left pl-4">包含</th>
                    <th className="p-3 text-left font-semibold">手稿</th>
                    <th className="p-3 text-left font-semibold">页/版</th>
                    <th className="p-3 text-left font-semibold">角度</th>
                    <th className="p-3 text-left font-semibold">采集人</th>
                    <th className="p-3 text-left font-semibold pr-5">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center" style={{ color: '#8B6B3D' }}>
                        加载…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center" style={{ color: '#8B6B3D' }}>
                        没有采集记录可供导出
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const on = sel.has(r.id);
                      return (
                        <tr
                          key={r.id}
                          className={`border-t ${on ? 'bg-[#5A7B2D]/5' : 'hover:bg-[#F5EFE0]'}`}
                          style={{ borderColor: '#8B6B3D22' }}
                        >
                          <td className="p-3 pl-4">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(r.id)}
                              className="w-4 h-4 accent-[#5A7B2D]"
                            />
                          </td>
                          <td className="p-3 min-w-[240px]">
                            <div className="text-xs font-mono" style={{ color: '#8B6B3D' }}>{r.code}</div>
                            <div
                              className="font-bold truncate"
                              style={{ color: '#3B2F2F', fontFamily: "'LXGW WenKai', serif" }}
                              title={r.title}
                            >
                              {r.title}
                            </div>
                          </td>
                          <td className="p-3 tabular-nums">
                            <div style={{ color: '#3B2F2F' }}>
                              第 <b>{r.pageNum}</b> 页 · v{r.version}
                            </div>
                            <div className="text-[11px]" style={{ color: '#8B6B3D' }}>
                              {new Date(r.capturedAt).toLocaleDateString('zh-CN')}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold" style={{ color: '#2D5A7B' }}>
                              {angleService.formatAngle(r.actualAngle)}
                            </span>
                            {r.angleDeviation > 2 && (
                              <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: '#B23A4822', color: '#B23A48' }}>
                                偏差 {r.angleDeviation.toFixed(1)}°
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs" style={{ color: '#3B2F2F' }}>{r.capturedBy}</td>
                          <td className="p-3 pr-5">
                            {r.needsRetake ? (
                              <span className="text-xs px-2 py-1 rounded-md flex items-center gap-1.5 w-fit" style={{ background: '#B23A4822', color: '#B23A48' }}>
                                <AlertTriangle size={12} /> 建议先重拍
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-md flex items-center gap-1.5 w-fit" style={{ background: '#5A7B2D22', color: '#5A7B2D' }}>
                                <CheckCircle2 size={12} /> 合规
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
          >
            <div className="font-bold mb-3 flex items-center gap-2" style={{ color: '#3B2F2F', fontFamily: "'LXGW WenKai', serif" }}>
              <FolderTree size={16} style={{ color: '#5A7B2D' }} />
              导出包结构
            </div>
            <ul className="text-xs font-mono space-y-1.5 pl-2" style={{ color: '#5C4522' }}>
              <li>📦 <b>manifest.json</b></li>
              <li className="pl-4 opacity-80">IIIF Presentation 3.0 清单</li>
              <li>📁 <b>images/</b></li>
              <li className="pl-4 opacity-80">原始采集图像（含 EXIF）</li>
              <li>📁 <b>annotations/</b></li>
              <li className="pl-4 opacity-80">纤维箭头 + 修补圈选 JSON</li>
              <li>📁 <b>metadata/</b></li>
              <li className="pl-4 opacity-80">结构化角度元数据</li>
              <li>📁 <b>manuscripts/</b></li>
              <li className="pl-4 opacity-80">手稿基本信息</li>
              <li>📄 <b>README.txt</b></li>
            </ul>
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
          >
            <div className="font-bold mb-3 flex items-center gap-2" style={{ color: '#3B2F2F', fontFamily: "'LXGW WenKai', serif" }}>
              <Info size={16} style={{ color: '#2D5A7B' }} />
              合规说明
            </div>
            <ul className="text-xs space-y-2" style={{ color: '#5C4522' }}>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: '#5A7B2D' }} />
                <span>遵循 <b>IIIF Presentation API 3.0</b> 规范</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: '#5A7B2D' }} />
                <span>侧光角度写入 <b>EXIF UserComment</b> 字段</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: '#5A7B2D' }} />
                <span><b>标注层与原始图像</b>完全分离存储</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: '#5A7B2D' }} />
                <span>每条记录的 Canvas 含 <b>seeAlso</b> 引用</span>
              </li>
            </ul>
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: '#5A7B2D44', background: '#5A7B2D08' }}
          >
            <div className="font-bold mb-2 flex items-center gap-2" style={{ color: '#3B2F2F' }}>
              <FileText size={16} style={{ color: '#5A7B2D' }} />
              导出清单
            </div>
            <div className="space-y-1.5 text-xs">
              <Row k="手稿数" v={`${new Set(selectedRows.map((r) => r.manuscriptId)).size}`} />
              <Row k="采集幅数" v={`${selectedRows.length}`} />
              <Row
                k="页数跨度"
                v={`${
                  selectedRows.length
                    ? `${Math.min(...selectedRows.map((r) => r.pageNum))} – ${Math.max(...selectedRows.map((r) => r.pageNum))}`
                    : '—'
                }`}
              />
              <Row k="合规幅数" v={`${selectedRows.length - needRetakeCount}`} tone={needRetakeCount > 0 ? 'warn' : 'ok'} />
            </div>
            <Link
              to="/records"
              className="mt-3 flex items-center gap-1 text-xs justify-center border-t pt-3"
              style={{ borderColor: '#8B6B3D22', color: '#2D5A7B' }}
            >
              去记录列表精细筛选 <ChevronRight size={12} />
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: 'ok' | 'warn' }) {
  const c = tone === 'ok' ? '#5A7B2D' : tone === 'warn' ? '#B23A48' : '#3B2F2F';
  return (
    <div className="flex justify-between" style={{ color: '#5C4522' }}>
      <span className="opacity-80">{k}</span>
      <b className="tabular-nums" style={{ color: c }}>{v}</b>
    </div>
  );
}
