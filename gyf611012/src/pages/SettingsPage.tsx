import { useState } from 'react';
import { Switch } from '@headlessui/react';
import {
  Palette,
  Monitor,
  ShieldCheck,
  Save,
  Sun,
  Clock,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useSeedBatchRecords } from '@/hooks/useSeedBatchRecords';
import type { SaffronGrade } from '@/types';

interface ThresholdDraft {
  grade: SaffronGrade;
  maxDeltaE: number;
}

export default function SettingsPage() {
  useSeedBatchRecords();

  const colorCards = useAppStore((s) => s.colorCards);
  const settings = useAppStore((s) => s.settings);
  const updateColorCardThreshold = useAppStore((s) => s.updateColorCardThreshold);
  const updateSetting = useAppStore((s) => s.updateSetting);

  const [thresholdDrafts, setThresholdDrafts] = useState<ThresholdDraft[]>(
    colorCards.map((c) => ({ grade: c.grade, maxDeltaE: c.maxDeltaE }))
  );
  const [screenBrightness, setScreenBrightness] = useState(settings.screenBrightness);
  const [ambientThreshold, setAmbientThreshold] = useState(
    settings.ambientLightAlertThreshold
  );
  const [requireDualApproval, setRequireDualApproval] = useState(
    settings.requireDualApproval
  );
  const [lockHours, setLockHours] = useState(settings.lockHours);

  const [savedToast, setSavedToast] = useState<string | null>(null);

  const showSaved = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2200);
  };

  const updateThresholdDraft = (grade: SaffronGrade, value: string) => {
    const num = Number(value);
    setThresholdDrafts((prev) =>
      prev.map((d) => (d.grade === grade ? { ...d, maxDeltaE: Number.isFinite(num) && num >= 0 ? num : 0 } : d))
    );
  };

  const resetThresholdDrafts = () => {
    setThresholdDrafts(
      colorCards.map((c) => ({ grade: c.grade, maxDeltaE: c.maxDeltaE }))
    );
  };

  const handleSaveThresholds = () => {
    thresholdDrafts.forEach((d) => {
      updateColorCardThreshold(d.grade, d.maxDeltaE);
    });
    showSaved('色卡阈值已保存');
  };

  const handleSaveDarkbox = () => {
    updateSetting('screenBrightness', screenBrightness);
    updateSetting('ambientLightAlertThreshold', ambientThreshold);
    showSaved('暗箱设置已保存');
  };

  const handleSaveApproval = () => {
    updateSetting('requireDualApproval', requireDualApproval);
    updateSetting('lockHours', Math.max(0, Math.floor(lockHours)));
    showSaved('审批设置已保存');
  };

  const thresholdsDirty = thresholdDrafts.some((d) => {
    const orig = colorCards.find((c) => c.grade === d.grade);
    return orig && orig.maxDeltaE !== d.maxDeltaE;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">系统设置</h1>
          <p className="text-sm text-slate-500">
            配置色卡阈值、暗箱环境与退货审批流程参数
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-rose-500" />
              <h2 className="text-base font-semibold text-slate-800">
                色卡阈值配置
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {thresholdsDirty && (
                <button
                  onClick={resetThresholdDrafts}
                  className={cn(
                    'rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600',
                    'hover:bg-slate-50'
                  )}
                >
                  还原
                </button>
              )}
              <button
                onClick={handleSaveThresholds}
                disabled={!thresholdsDirty}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white',
                  'transition-colors',
                  thresholdsDirty
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'cursor-not-allowed bg-slate-300'
                )}
              >
                <Save className="h-3.5 w-3.5" />
                保存阈值
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-2.5 w-24">等级</th>
                  <th className="px-4 py-2.5 w-24">颜色块</th>
                  <th className="px-4 py-2.5">描述</th>
                  <th className="px-4 py-2.5 w-48 text-right">当前阈值（最大 ΔE）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {thresholdDrafts.map((draft) => {
                  const card = colorCards.find((c) => c.grade === draft.grade);
                  const orig = card?.maxDeltaE ?? 0;
                  const dirty = orig !== draft.maxDeltaE;
                  return (
                    <tr
                      key={draft.grade}
                      className={cn('transition-colors', dirty && 'bg-amber-50/50')}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {card?.gradeLabel ?? draft.grade}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="h-8 w-12 rounded-md border border-slate-200 shadow-inner"
                          style={{ backgroundColor: card?.hexColor ?? '#ccc' }}
                          title={card?.hexColor}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {card?.description ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={draft.maxDeltaE}
                            onChange={(e) =>
                              updateThresholdDraft(draft.grade, e.target.value)
                            }
                            className={cn(
                              'w-28 rounded-lg border px-3 py-1.5 text-right font-mono text-sm',
                              'focus:outline-none focus:ring-2',
                              dirty
                                ? 'border-amber-300 bg-white focus:border-amber-500 focus:ring-amber-100'
                                : 'border-slate-300 bg-white focus:border-rose-500 focus:ring-rose-100'
                            )}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-rose-500" />
              <h2 className="text-base font-semibold text-slate-800">暗箱设置</h2>
            </div>
            <button
              onClick={handleSaveDarkbox}
              className={cn(
                'flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white',
                'hover:bg-rose-600 transition-colors'
              )}
            >
              <Save className="h-3.5 w-3.5" />
              保存设置
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Sun className="h-4 w-4 text-amber-500" />
                  屏幕亮度
                </label>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-sm font-medium text-amber-700">
                  {screenBrightness}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400">0</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={screenBrightness}
                  onChange={(e) => setScreenBrightness(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-rose-500"
                  style={{
                    background: `linear-gradient(to right, #F43F5E 0%, #F43F5E ${screenBrightness}%, #E2E8F0 ${screenBrightness}%, #E2E8F0 100%)`,
                  }}
                />
                <span className="text-xs text-slate-400">100</span>
              </div>
              <div
                className="h-3 w-full overflow-hidden rounded-lg border border-slate-200"
                style={{
                  background: `linear-gradient(to right, #0F172A 0%, #FDE68A ${screenBrightness}%, #FEF9C3 100%)`,
                  opacity: 0.3 + screenBrightness / 150,
                }}
              />
              <p className="text-xs text-slate-400">
                控制暗箱内显示器的亮度输出，默认 92%。实际效果请以设备为准。
              </p>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Sun className="h-4 w-4 text-sky-500" />
                    环境光阈值（lux）
                  </label>
                  <span className="rounded-md bg-sky-50 px-2 py-0.5 font-mono text-sm font-medium text-sky-700">
                    {ambientThreshold}
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={ambientThreshold}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setAmbientThreshold(
                      Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0
                    );
                  }}
                  className={cn(
                    'w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm',
                    'focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100'
                  )}
                />
                <p className="text-xs text-slate-400">
                  当暗箱内环境光超过此阈值时触发告警，提醒检测人员关闭光源。建议范围 50 ~ 150 lux。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-rose-500" />
              <h2 className="text-base font-semibold text-slate-800">审批设置</h2>
            </div>
            <button
              onClick={handleSaveApproval}
              className={cn(
                'flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white',
                'hover:bg-rose-600 transition-colors'
              )}
            >
              <Save className="h-3.5 w-3.5" />
              保存设置
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-medium text-slate-700">
                    强制双人审批
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  开启后，所有退货降级单需经主管一级确认 + 经理二级确认，方可生效并锁定。
                  关闭后，仅需一级确认即可。
                </p>
              </div>
              <Switch
                checked={requireDualApproval}
                onChange={setRequireDualApproval}
                className={cn(
                  'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-2',
                  requireDualApproval ? 'bg-rose-500' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                    requireDualApproval ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </Switch>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-violet-500" />
                  退货单锁定时长（小时）
                </label>
              </div>
              <input
                type="number"
                min={0}
                step={1}
                value={lockHours}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLockHours(Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
                }}
                className={cn(
                  'w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm',
                  'focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100'
                )}
              />
              <p className="text-xs text-slate-400">
                最终审批通过后，退货单进入不可撤销锁定状态的持续时间。
                到期后自动转为"已生效"。建议 24 小时，0 表示立即生效。
              </p>
            </div>

            {!requireDualApproval && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  已关闭双人审批。退货单仅需一级确认即可锁定，请注意复核权限分配。
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {savedToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-slate-700">{savedToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
