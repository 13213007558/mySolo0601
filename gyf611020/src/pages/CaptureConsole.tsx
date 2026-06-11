import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  PenTool,
  RotateCcw,
  Info,
} from 'lucide-react';
import { AngleSlider } from '../components/capture/AngleSlider';
import { CameraPreview, captureCurrentFrame } from '../components/capture/CameraPreview';
import { angleService } from '../services/angleService';
import { exifService } from '../services/exifService';
import { storageService } from '../services/storageService';
import { usePreferences } from '../store/usePreferences';
import { CaptureRecord, Manuscript } from '../types';

export default function CaptureConsole() {
  const { manuscriptId = 'm1', pageNum = '1' } = useParams<{
    manuscriptId: string;
    pageNum: string;
  }>();
  const pn = Math.max(1, parseInt(pageNum, 10) || 1);
  const nav = useNavigate();

  const prefs = usePreferences();
  const [targetAngle, setTargetAngle] = useState(45);
  const [lowBlue, setLowBlue] = useState(prefs.lowBlueMode);
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [version, setVersion] = useState(1);
  const [flash, setFlash] = useState(false);
  const [lastCapture, setLastCapture] = useState<{
    record: CaptureRecord;
    url: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [pendingBadCapture, setPendingBadCapture] = useState<CaptureRecord | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const m = await storageService.getManuscript(manuscriptId);
      if (m) setManuscript(m);
      const v = await storageService.getNextVersion(manuscriptId, pn);
      setVersion(v);
    })();
  }, [manuscriptId, pn]);

  const triggerCapture = useCallback(async () => {
    if (saving) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
    setSaving(true);
    try {
      const raw = await captureCurrentFrame();
      const actualAngle =
        targetAngle + (Math.random() - 0.5) * 0.6; // 模拟实际角度微小抖动
      const exifBlob = await exifService.writeAngleMetadata(raw, actualAngle, {
        operatorId: prefs.operatorId,
        manuscriptCode: manuscript?.code ?? 'UNKNOWN',
        pageNum: pn,
      });
      const deviation = angleService.computeDeviation(actualAngle, targetAngle);
      const needsRetake = angleService.needsRetake(deviation);

      const record = {
        manuscriptId,
        pageNum: pn,
        targetAngle,
        actualAngle,
        angleDeviation: deviation,
        needsRetake,
        lowBlueMode: lowBlue,
        capturedBy: prefs.operatorId,
        capturedAt: Date.now(),
        version,
        exifJson: JSON.stringify({
          angle: actualAngle,
          target: targetAngle,
          operator: prefs.operatorId,
        }),
      };

      const id = await storageService.saveCapture(record, exifBlob);
      const loaded = await storageService.getCapture(id);
      if (loaded) setLastCapture({ record: { ...loaded.record, id }, url: loaded.url });
      setVersion((v) => v + 1);

      if (needsRetake) {
        setPendingBadCapture({ ...loaded!.record, id });
        setShowRetakeModal(true);
      }
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    targetAngle,
    prefs.operatorId,
    manuscript?.code,
    pn,
    lowBlue,
    version,
    manuscriptId,
  ]);

  const dev = lastCapture
    ? angleService.computeDeviation(lastCapture.record.actualAngle, lastCapture.record.targetAngle)
    : 0;

  const gotoPage = (delta: number) => {
    const next = Math.max(1, Math.min(manuscript?.totalPages ?? 9999, pn + delta));
    if (next !== pn) nav(`/capture/${manuscriptId}/${next}`);
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5EFE0' }}>
      <header
        className="sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between flex-wrap gap-3 border-b backdrop-blur"
        style={{ borderColor: '#8B6B3D33', background: 'rgba(245,239,224,0.85)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-[#EFE5CF] transition"
            style={{ borderColor: '#8B6B3D44', color: '#3B2F2F' }}
          >
            <ArrowLeft size={14} /> 返回
          </Link>
          {manuscript && (
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: '#8B6B3D' }} />
              <div>
                <div className="text-xs font-mono" style={{ color: '#8B6B3D' }}>
                  {manuscript.code}
                </div>
                <div
                  className="text-sm font-bold leading-tight"
                  style={{
                    color: '#3B2F2F',
                    fontFamily: "'LXGW WenKai', serif",
                  }}
                >
                  {manuscript.title}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: '#8B6B3D44' }}>
            <button
              onClick={() => gotoPage(-1)}
              className="px-2.5 py-1.5 hover:bg-[#EFE5CF] transition"
              style={{ color: '#5C4522' }}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 py-1.5 text-sm font-mono border-x" style={{ borderColor: '#8B6B3D33', background: '#FDF8EC' }}>
              第 <b style={{ color: '#2D5A7B' }}>{pn}</b> / {manuscript?.totalPages ?? '?'} 页 · v{version}
            </div>
            <button
              onClick={() => gotoPage(1)}
              className="px-2.5 py-1.5 hover:bg-[#EFE5CF] transition"
              style={{ color: '#5C4522' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              setLowBlue(!lowBlue);
              prefs.set({ lowBlueMode: !lowBlue });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition ${
              lowBlue ? 'text-white shadow' : 'hover:bg-[#EFE5CF]'
            }`}
            style={
              lowBlue
                ? { background: '#C97F30', borderColor: '#C97F30' }
                : { borderColor: '#8B6B3D44', color: '#5C4522' }
            }
          >
            {lowBlue ? <Eye size={14} /> : <EyeOff size={14} />}
            低蓝光 {lowBlue ? `${prefs.lowBlueIntensity}%` : ''}
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-5">
            <div className="relative">
              <CameraPreview
                lowBlueMode={lowBlue}
                lowBlueIntensity={prefs.lowBlueIntensity}
                angle={targetAngle}
              />
              {flash && (
                <div className="absolute inset-0 bg-white pointer-events-none animate-pulse" style={{ opacity: 0.85 }} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
              <button
                onClick={triggerCapture}
                disabled={saving}
                className="group relative px-8 py-4 rounded-2xl text-white text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all overflow-hidden disabled:opacity-60 disabled:translate-y-0"
                style={{
                  background:
                    'linear-gradient(135deg, #B23A48 0%, #8B2E38 100%)',
                  fontFamily: "'LXGW WenKai', serif",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Camera size={24} />
                  {saving ? '正在写入 EXIF…' : '快门采集 · 写入角度元数据'}
                </span>
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 60%)',
                  }}
                />
              </button>

              <div className="flex items-center gap-2 text-sm">
                <Info size={14} style={{ color: '#8B6B3D' }} />
                <span style={{ color: '#5C4522' }}>角度偏差 &gt; 2° 将强制重拍</span>
              </div>
            </div>

            {lastCapture && (
              <LastCapturePreview
                record={lastCapture.record}
                url={lastCapture.url}
                deviation={dev}
              />
            )}
          </div>

          <aside
            className="rounded-2xl p-5 border h-fit sticky top-24"
            style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
          >
            <h3
              className="text-lg font-bold mb-4 flex items-center gap-2"
              style={{ color: '#3B2F2F', fontFamily: "'LXGW WenKai', serif" }}
            >
              <RotateCcw size={18} style={{ color: '#2D5A7B' }} />
              侧光角度控制
            </h3>

            <AngleSlider
              value={targetAngle}
              onChange={setTargetAngle}
              onChangeEnd={(v) => {
                if (prefs.snapTo15) setTargetAngle(angleService.snapTo15(v));
              }}
            />

            <div className="mt-5 space-y-3">
              <StatusLine
                ok={!lastCapture || dev <= 2}
                label="角度偏差容限"
                value={`± 2° (当前 ${lastCapture ? dev.toFixed(2) : '0.00'}°)`}
              />
              <StatusLine
                ok={prefs.snapTo15}
                label="15° 吸附"
                value={prefs.snapTo15 ? '已开启' : '已关闭'}
              />
              <StatusLine
                ok={lowBlue}
                label="低蓝光护纸"
                value={lowBlue ? `开启 · ${prefs.lowBlueIntensity}%` : '关闭'}
              />
              <StatusLine
                ok={prefs.showGrid}
                label="对齐网格"
                value={prefs.showGrid ? '显示' : '隐藏'}
              />
            </div>

            <div
              className="mt-5 p-3 rounded-lg text-xs"
              style={{ background: '#FFF7E0', color: '#7A5A1E' }}
            >
              <div className="font-bold mb-1">💡 操作提示</div>
              <ul className="space-y-1 leading-relaxed">
                <li>• 环形滑杆：拖拽指针或点击刻度</li>
                <li>• 线性滑杆：粗调角度范围</li>
                <li>• 快捷键：空格触发快门</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {showRetakeModal && pendingBadCapture && (
        <RetakeModal
          record={pendingBadCapture}
          onRetake={() => {
            setShowRetakeModal(false);
            setPendingBadCapture(null);
            setTimeout(triggerCapture, 100);
          }}
          onAccept={() => {
            setShowRetakeModal(false);
            setPendingBadCapture(null);
          }}
          onAnnotate={() => {
            setShowRetakeModal(false);
            setPendingBadCapture(null);
            nav(`/annotate/${lastCapture?.record.id ?? pendingBadCapture.id}`);
          }}
        />
      )}
    </div>
  );
}

function StatusLine({
  ok,
  label,
  value,
}: {
  ok: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: '#5C4522' }}>{label}</span>
      <span
        className="font-medium flex items-center gap-1"
        style={{ color: ok ? '#5A7B2D' : '#B23A48' }}
      >
        {ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
        {value}
      </span>
    </div>
  );
}

function LastCapturePreview({
  record,
  url,
  deviation,
}: {
  record: CaptureRecord;
  url: string;
  deviation: number;
}) {
  const nav = useNavigate();
  const over2 = deviation > 2;
  return (
    <div
      className="rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-4 items-center"
      style={{
        borderColor: over2 ? '#B23A4888' : '#8B6B3D44',
        background: over2 ? 'rgba(178,58,72,0.05)' : '#FDF8EC',
      }}
    >
      <img
        src={url}
        alt="上一张采集"
        className="w-full h-36 object-cover rounded-lg border"
        style={{ borderColor: '#8B6B3D33' }}
      />
      <div>
        <div className="text-xs mb-2 flex items-center gap-2" style={{ color: '#8B6B3D' }}>
          <CheckCircle size={12} /> 最近采集 · {new Date(record.capturedAt).toLocaleTimeString('zh-CN')}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Metric label="目标角度" value={angleService.formatAngle(record.targetAngle)} />
          <Metric label="实际角度" value={angleService.formatAngle(record.actualAngle)} />
          <Metric
            label="角度偏差"
            value={`${deviation.toFixed(2)}°`}
            tone={over2 ? 'bad' : 'ok'}
          />
          <Metric label="版本" value={`v${record.version}`} />
        </div>
        {over2 && (
          <div
            className="mt-3 text-xs flex items-start gap-2 p-2 rounded-lg"
            style={{ background: '#B23A4820', color: '#8B2E38' }}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div>
              <b>触发合规预警</b>：偏差超过 ±2° 制度阈值，建议立即重拍以保证纤维走向分析可复现。
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col md:items-stretch gap-2">
        <button
          onClick={() => nav(`/annotate/${record.id}`)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-white shadow hover:opacity-90 transition"
          style={{ background: '#2D5A7B' }}
        >
          <PenTool size={14} /> 标注纤维/修补
        </button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'bad' | 'normal';
}) {
  const c = tone === 'ok' ? '#5A7B2D' : tone === 'bad' ? '#B23A48' : '#3B2F2F';
  return (
    <div>
      <div className="text-[11px]" style={{ color: '#8B6B3D' }}>{label}</div>
      <div className="font-bold text-lg tabular-nums" style={{ color: c, fontFamily: "'LXGW WenKai', serif" }}>
        {value}
      </div>
    </div>
  );
}

function RetakeModal({
  record,
  onRetake,
  onAccept,
  onAnnotate,
}: {
  record: CaptureRecord;
  onRetake: () => void;
  onAccept: () => void;
  onAnnotate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B2F2F]/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl border-2"
        style={{ background: '#FDF8EC', borderColor: '#B23A48' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#B23A4820', color: '#B23A48' }}
          >
            <AlertTriangle size={26} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#B23A48', fontFamily: "'LXGW WenKai', serif" }}>
              角度偏差超过制度阈值
            </h3>
            <p className="text-sm" style={{ color: '#5C4522' }}>
              外审要求角度偏差须在 ±2° 内，当前偏差
              <b className="mx-1 text-base" style={{ color: '#B23A48' }}>
                {record.angleDeviation.toFixed(2)}°
              </b>
              ，无法复现纤维走向分析结论。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5 text-center">
          <div className="rounded-lg py-2" style={{ background: '#fff' }}>
            <div className="text-[10px]" style={{ color: '#8B6B3D' }}>目标角度</div>
            <div className="font-bold text-lg tabular-nums" style={{ color: '#2D5A7B' }}>
              {angleService.formatAngle(record.targetAngle)}
            </div>
          </div>
          <div className="rounded-lg py-2" style={{ background: '#fff' }}>
            <div className="text-[10px]" style={{ color: '#8B6B3D' }}>实际角度</div>
            <div className="font-bold text-lg tabular-nums" style={{ color: '#5C4522' }}>
              {angleService.formatAngle(record.actualAngle)}
            </div>
          </div>
          <div className="rounded-lg py-2" style={{ background: '#B23A4815' }}>
            <div className="text-[10px]" style={{ color: '#8B2E38' }}>偏差</div>
            <div className="font-bold text-lg tabular-nums" style={{ color: '#B23A48' }}>
              {record.angleDeviation.toFixed(2)}°
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onRetake}
            className="w-full py-3 rounded-xl text-white text-base font-bold shadow-lg hover:opacity-90 transition"
            style={{ background: '#B23A48' }}
          >
            🔄 立即重拍（推荐）
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAnnotate}
              className="py-2.5 rounded-lg text-sm border hover:bg-[#EFE5CF] transition"
              style={{ borderColor: '#8B6B3D55', color: '#3B2F2F' }}
            >
              先标注再重拍
            </button>
            <button
              onClick={onAccept}
              className="py-2.5 rounded-lg text-sm text-[#5C4522] hover:bg-[#EFE5CF] transition"
            >
              标记为异常保留
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
