import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  ChevronRight,
  Send,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { AnnotationCanvas } from '../components/annotation/AnnotationCanvas';
import { angleService } from '../services/angleService';
import { storageService } from '../services/storageService';
import { usePreferences } from '../store/usePreferences';
import { AnnotationLayer, CaptureRecord } from '../types';

export default function AnnotationWorkspace() {
  const { captureId = '' } = useParams<{ captureId: string }>();
  const nav = useNavigate();
  const operatorId = usePreferences((s) => s.operatorId);
  const [record, setRecord] = useState<CaptureRecord | null>(null);
  const [imgUrl, setImgUrl] = useState('');
  const [initial, setInitial] = useState<AnnotationLayer | undefined>(undefined);
  const [current, setCurrent] = useState<AnnotationLayer | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const got = await storageService.getCapture(captureId);
      if (got) {
        setRecord(got.record);
        setImgUrl(got.url);
      }
      const ann = await storageService.getAnnotations(captureId);
      if (ann) setInitial(ann);
      setLoading(false);
    })();
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureId]);

  const save = async (submit = false) => {
    if (!current) return;
    setSaving(true);
    try {
      await storageService.saveAnnotations({
        ...current,
        updatedBy: operatorId,
      });
      setSavedAt(Date.now());
      if (submit) {
        nav(`/records?highlight=${captureId}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const complete = (): boolean => {
    if (!current) return false;
    return current.arrows.length > 0 && current.polygons.length > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EFE0', color: '#8B6B3D' }}>
        加载采集记录…
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen p-10" style={{ background: '#F5EFE0' }}>
        <div className="max-w-xl mx-auto p-6 rounded-2xl text-center" style={{ background: '#FDF8EC', border: '1px solid #B23A4844' }}>
          <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: '#B23A48' }} />
          <div className="text-lg font-bold mb-2" style={{ color: '#3B2F2F' }}>未找到该采集记录</div>
          <Link to="/records" className="inline-flex items-center gap-1 text-sm mt-4" style={{ color: '#2D5A7B' }}>
            返回记录列表 <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const dev = angleService.computeDeviation(record.actualAngle, record.targetAngle);
  const over = dev > 2;

  return (
    <div className="min-h-screen" style={{ background: '#F5EFE0' }}>
      <header
        className="sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between flex-wrap gap-3 border-b backdrop-blur"
        style={{ borderColor: '#8B6B3D33', background: 'rgba(245,239,224,0.9)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/records"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-[#EFE5CF] transition"
            style={{ borderColor: '#8B6B3D44', color: '#3B2F2F' }}
          >
            <ArrowLeft size={14} /> 记录列表
          </Link>
          {record && (
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: '#8B6B3D' }} />
              <div>
                <div className="text-xs font-mono" style={{ color: '#8B6B3D' }}>
                  第 {record.pageNum} 页 · v{record.version} ·{' '}
                  {angleService.formatAngle(record.actualAngle)}
                </div>
                <div className="text-sm font-bold leading-tight" style={{ color: '#3B2F2F' }}>
                  标注工作台
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {over && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: '#B23A4815', color: '#B23A48' }}
            >
              <AlertTriangle size={14} /> 偏差 {dev.toFixed(2)}° · 建议先重拍
            </div>
          )}
          <Link
            to={`/capture/${record.manuscriptId}/${record.pageNum}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-[#EFE5CF] transition"
            style={{ borderColor: '#8B6B3D44', color: '#3B2F2F' }}
          >
            <RotateCcw size={14} /> 重拍
          </Link>
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm border hover:bg-[#EFE5CF] transition disabled:opacity-60"
            style={{ borderColor: '#8B6B3D44', color: '#3B2F2F' }}
          >
            <Save size={14} />
            {saving ? '保存中…' : savedAt ? `已保存 ${new Date(savedAt).toLocaleTimeString('zh-CN')}` : '保存标注'}
          </button>
          <button
            onClick={() => save(true)}
            disabled={!complete() || saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm text-white shadow hover:opacity-90 transition disabled:opacity-50"
            style={{ background: complete() ? '#5A7B2D' : '#9aa892' }}
          >
            <Send size={14} /> 提交审核
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-5 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="flex flex-col" style={{ minHeight: 560 }}>
            {imgUrl ? (
              <AnnotationCanvas
                imageUrl={imgUrl}
                captureId={captureId}
                initial={initial}
                onChange={(l) => setCurrent(l)}
              />
            ) : null}
          </div>

          <aside className="space-y-4">
            <Card title="采集元数据">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Meta label="目标角度" value={angleService.formatAngle(record.targetAngle)} />
                <Meta
                  label="实际角度"
                  value={angleService.formatAngle(record.actualAngle)}
                />
                <Meta
                  label="角度偏差"
                  value={`${dev.toFixed(2)}°`}
                  tone={over ? 'bad' : 'ok'}
                />
                <Meta label="版本" value={`v${record.version}`} />
                <Meta label="低蓝光" value={record.lowBlueMode ? '开启' : '关闭'} />
                <Meta label="采集人" value={record.capturedBy} />
                <Meta
                  label="采集时间"
                  value={new Date(record.capturedAt).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  full
                />
              </div>
            </Card>

            <Card title="标注进度" tone={complete() ? 'ok' : 'warn'}>
              <ProgressRow
                label="纤维走向箭头"
                count={current?.arrows.length ?? initial?.arrows.length ?? 0}
                required
                done={(current?.arrows.length ?? initial?.arrows.length ?? 0) > 0}
              />
              <ProgressRow
                label="修补区域圈选"
                count={current?.polygons.length ?? initial?.polygons.length ?? 0}
                required
                done={(current?.polygons.length ?? initial?.polygons.length ?? 0) > 0}
              />
              {complete() && (
                <div
                  className="mt-3 p-2 rounded-lg flex items-center gap-2 text-xs"
                  style={{ background: '#5A7B2D20', color: '#3d571e' }}
                >
                  <CheckCircle size={14} />
                  标注要素已齐全，可以提交审核
                </div>
              )}
              {!complete() && (
                <div
                  className="mt-3 p-2 rounded-lg flex items-start gap-2 text-xs"
                  style={{ background: '#C97F3018', color: '#7a4f1e' }}
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    制度要求：每张照片<b>必须</b>同时标注纤维走向与修补痕迹区域，缺一不可。
                  </div>
                </div>
              )}
            </Card>

            <Card title="操作说明">
              <ul className="text-xs space-y-1.5" style={{ color: '#5C4522' }}>
                <li>🔸 <b>纤维箭头</b>：在画布上拖拽起点终点，自动吸附 15° 整数倍</li>
                <li>🔸 <b>修补圈选</b>：点击放置顶点，Enter 闭合或「闭合」按钮</li>
                <li>🔸 <b>闭合选区</b>后自动弹出修补类型与文字备注对话框</li>
                <li>🔸 按 <kbd className="px-1 rounded" style={{ background: '#EFE5CF' }}>Esc</kbd> 取消当前绘制，<kbd className="px-1 rounded" style={{ background: '#EFE5CF' }}>Backspace</kbd> 删除选中</li>
              </ul>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Card({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'ok' | 'warn' | 'normal';
}) {
  const accent =
    tone === 'ok' ? '#5A7B2D' : tone === 'warn' ? '#C97F30' : '#2D5A7B';
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
    >
      <div
        className="text-sm font-bold mb-3 flex items-center gap-2"
        style={{ color: '#3B2F2F', fontFamily: "'LXGW WenKai', serif" }}
      >
        <span
          className="inline-block w-1.5 h-4 rounded"
          style={{ background: accent }}
        />
        {title}
      </div>
      {children}
    </div>
  );
}

function Meta({
  label,
  value,
  tone = 'normal',
  full = false,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'bad' | 'normal';
  full?: boolean;
}) {
  const c = tone === 'ok' ? '#5A7B2D' : tone === 'bad' ? '#B23A48' : '#3B2F2F';
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-[11px]" style={{ color: '#8B6B3D' }}>
        {label}
      </div>
      <div className="font-bold tabular-nums" style={{ color: c }}>
        {value}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  count,
  required,
  done,
}: {
  label: string;
  count: number;
  required?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: '#8B6B3D22' }}>
      <div className="text-sm flex items-center gap-1" style={{ color: '#3B2F2F' }}>
        {label} {required && <span style={{ color: '#B23A48' }}>*</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono" style={{ color: '#8B6B3D' }}>
          {count} 处
        </span>
        {done ? (
          <CheckCircle size={14} style={{ color: '#5A7B2D' }} />
        ) : required ? (
          <AlertTriangle size={14} style={{ color: '#C97F30' }} />
        ) : null}
      </div>
    </div>
  );
}
