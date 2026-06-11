import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Target,
  Grid3X3,
  UserCircle2,
  Save,
  RotateCcw,
  MoonStar,
  Info,
} from 'lucide-react';
import { usePreferences } from '../store/usePreferences';

export default function Settings() {
  const prefs = usePreferences();
  const [form, setForm] = useState({
    lowBlueMode: prefs.lowBlueMode,
    lowBlueIntensity: prefs.lowBlueIntensity,
    snapTo15: prefs.snapTo15,
    operatorId: prefs.operatorId,
    showGrid: prefs.showGrid,
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    prefs.set(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const reset = () => {
    const def = {
      lowBlueMode: false,
      lowBlueIntensity: 40,
      snapTo15: true,
      operatorId: '修复师-001',
      showGrid: true,
    };
    setForm(def);
    prefs.set(def);
  };

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
            <ArrowLeft size={14} /> 返回首页
          </Link>
          <h1 className="text-lg font-bold" style={{ fontFamily: "'LXGW WenKai', serif", color: '#3B2F2F' }}>
            系统偏好设置
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-[#EFE5CF] transition"
            style={{ borderColor: '#8B6B3D44', color: '#5C4522' }}
          >
            <RotateCcw size={14} /> 恢复默认
          </button>
          <button
            onClick={save}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm text-white shadow hover:opacity-90 transition"
            style={{ background: '#2D5A7B' }}
          >
            {saved ? (
              <>✓ 已保存</>
            ) : (
              <>
                <Save size={14} /> 保存设置
              </>
            )}
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-5">
        <Section
          icon={<MoonStar size={18} />}
          title="护纸与护眼 · 低蓝光模式"
          desc="通过暖色滤镜降低高能量蓝光对纸页纤维与修复师视觉的刺激"
          accent="#C97F30"
        >
          <Row>
            <div className="flex-1">
              <div className="font-semibold mb-1" style={{ color: '#3B2F2F' }}>低蓝光模式总开关</div>
              <div className="text-xs" style={{ color: '#8B6B3D' }}>
                作用于实时预览、采集输出与标注工作台
              </div>
            </div>
            <Toggle
              on={form.lowBlueMode}
              onChange={(v) => setForm({ ...form, lowBlueMode: v })}
              color="#C97F30"
            />
          </Row>
          <Row>
            <div className="flex-1">
              <div className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#3B2F2F' }}>
                <Eye size={14} />
                滤镜强度
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={form.lowBlueIntensity}
                  onChange={(e) => setForm({ ...form, lowBlueIntensity: Number(e.target.value) })}
                  disabled={!form.lowBlueMode}
                  className="flex-1 accent-[#C97F30]"
                />
                <div
                  className="w-10 h-10 rounded-lg border shrink-0"
                  style={{
                    borderColor: '#8B6B3D44',
                    background: `rgba(255, ${230 + form.lowBlueIntensity * 0.3}, ${
                      160 + form.lowBlueIntensity * 0.8
                    }, ${form.lowBlueMode ? 0.4 + form.lowBlueIntensity / 200 : 0})`,
                  }}
                  title="暖色预览"
                />
                <span className="w-12 text-right tabular-nums font-bold" style={{ color: '#C97F30' }}>
                  {form.lowBlueIntensity}%
                </span>
              </div>
            </div>
          </Row>
        </Section>

        <Section
          icon={<Target size={18} />}
          title="侧光角度 · 15° 吸附"
          desc="强制滑杆与纤维箭头吸附至 15° 整数倍，符合外审对角度可复现性的要求"
          accent="#2D5A7B"
        >
          <Row>
            <div className="flex-1">
              <div className="font-semibold mb-1" style={{ color: '#3B2F2F' }}>启用吸附</div>
              <div className="text-xs" style={{ color: '#8B6B3D' }}>
                角度滑杆、纤维走向箭头工具均自动对齐 0°, 15°, 30° … 345°
              </div>
            </div>
            <Toggle
              on={form.snapTo15}
              onChange={(v) => setForm({ ...form, snapTo15: v })}
              color="#2D5A7B"
            />
          </Row>
          <div className="mt-1 p-3 rounded-lg text-xs flex items-start gap-2" style={{ background: '#2D5A7B10', color: '#21475f' }}>
            <Info size={14} className="mt-0.5 shrink-0" />
            <div>
              <b>制度依据</b>：外审指出纤维走向分析须在标准角度下可复现，
              吸附 15° 后角度偏差 ±2° 的阈值将自动收紧为 ±1°，建议保持开启。
            </div>
          </div>
        </Section>

        <Section
          icon={<Grid3X3 size={18} />}
          title="对齐网格 · 构图辅助"
          desc="在相机预览与标注画布上叠加 3×3 金色分割线与虚线安全框"
          accent="#8B6B3D"
        >
          <Row>
            <div className="flex-1">
              <div className="font-semibold mb-1" style={{ color: '#3B2F2F' }}>显示对齐网格</div>
              <div className="text-xs" style={{ color: '#8B6B3D' }}>
                金色 1/3 分割线 + 8% 边距安全框，辅助手稿居中对齐
              </div>
            </div>
            <Toggle
              on={form.showGrid}
              onChange={(v) => setForm({ ...form, showGrid: v })}
              color="#8B6B3D"
            />
          </Row>
        </Section>

        <Section
          icon={<UserCircle2 size={18} />}
          title="采集人身份"
          desc="写入 EXIF 元数据与标注层审计字段，便于问责追溯"
          accent="#B23A48"
        >
          <Row>
            <div className="flex-1">
              <label className="font-semibold mb-2 block" style={{ color: '#3B2F2F' }}>
                工号 / 姓名
              </label>
              <input
                value={form.operatorId}
                onChange={(e) => setForm({ ...form, operatorId: e.target.value })}
                className="w-full max-w-sm px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#B23A48]"
                style={{ borderColor: '#8B6B3D55', background: '#FFFBF1', color: '#3B2F2F' }}
                placeholder="例：修复师-王XX 或 FS-042"
              />
              <div className="text-[11px] mt-1.5" style={{ color: '#8B6B3D' }}>
                该标识将写入 EXIF UserComment 与所有 AnnotationLayer.updatedBy
              </div>
            </div>
          </Row>
        </Section>

        <div
          className="rounded-2xl border p-4 flex items-center justify-between flex-wrap gap-3"
          style={{ borderColor: '#5A7B2D55', background: '#5A7B2D10' }}
        >
          <div>
            <div className="font-bold" style={{ color: '#3d571e' }}>
              所有偏好设置本地持久化
            </div>
            <div className="text-xs" style={{ color: '#6a7a4e' }}>
              存于 localStorage，不随采集数据上传
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-[#EFE5CF] transition"
              style={{ borderColor: '#8B6B3D44', color: '#5C4522' }}
            >
              <RotateCcw size={14} className="inline mr-1" />
              恢复默认
            </button>
            <button
              onClick={save}
              className="px-5 py-2 rounded-lg text-white text-sm shadow hover:opacity-90 transition"
              style={{ background: '#2D5A7B' }}
            >
              <Save size={14} className="inline mr-1" />
              保存设置
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  icon,
  title,
  desc,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-5 space-y-3"
      style={{ borderColor: '#8B6B3D44', background: '#FDF8EC' }}
    >
      <header className="flex items-start gap-3 pb-2 border-b" style={{ borderColor: '#8B6B3D22' }}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
          style={{ background: accent }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg" style={{ fontFamily: "'LXGW WenKai', serif", color: '#3B2F2F' }}>
            {title}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#8B6B3D' }}>{desc}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-0" style={{ borderColor: '#8B6B3D22' }}>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  color,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative w-12 h-7 rounded-full transition-colors shrink-0"
      style={{ background: on ? color : '#D4C5A3' }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}
