import { useCallback, useEffect, useMemo, useState } from 'react';
import { Listbox } from '@headlessui/react';
import {
  ChevronsUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Camera,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useSeedBatchRecords } from '@/hooks/useSeedBatchRecords';
import ColorCardStrip from '@/components/ColorCardStrip';
import DeltaEGauge from '@/components/DeltaEGauge';
import CameraCaptureDialog from '@/components/CameraCaptureDialog';
import type { ColorCard, LAB, SaffronGrade } from '@/types';
import { SaffronGrade as Grade } from '@/types';
import {
  calculateClosestGrade,
  labToRoughHex,
} from '@/utils/colorUtils';

function jitter(v: number, range: number): number {
  return v + (Math.random() - 0.5) * range * 2;
}

const GRADE_ORDER: SaffronGrade[] = [
  Grade.GRADE_S,
  Grade.GRADE_A,
  Grade.GRADE_B,
  Grade.GRADE_C,
  Grade.GRADE_D,
  Grade.GRADE_E,
  Grade.GRADE_F,
];

export default function InspectionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useSeedBatchRecords();

  const {
    batches,
    colorCards,
    activeBatchId,
    setActiveBatch,
    getBatchById,
    getBatchRecords,
    addSilkRecord,
  } = useAppStore();

  const batch = activeBatchId ? getBatchById(activeBatchId) : undefined;
  const batchRecords = useMemo(
    () => (activeBatchId ? getBatchRecords(activeBatchId) : []),
    [activeBatchId, getBatchRecords]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lab, setLab] = useState<LAB>({ L: 50, a: 20, b: 40 });
  const [selectedGrade, setSelectedGrade] = useState<SaffronGrade | null>(null);
  const [supplierLotNo, setSupplierLotNo] = useState('');
  const [remark, setRemark] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRedMask, setShowRedMask] = useState(false);

  const closest = useMemo(() => {
    if (!colorCards.length) return null;
    return calculateClosestGrade(lab, colorCards);
  }, [lab, colorCards]);

  const selectedCard = useMemo(
    () => colorCards.find((c) => c.grade === selectedGrade),
    [selectedGrade, colorCards]
  );

  const threshold = selectedCard?.maxDeltaE ?? closest?.closestCard.maxDeltaE ?? 3;
  const deltaE = closest?.deltaE ?? 0;
  const isWithinThreshold = selectedGrade
    ? deltaE <= threshold
    : closest?.isWithinThreshold ?? true;

  const totalQuantity = batch?.totalQuantity ?? 0;
  const inspectedCount = batchRecords.length;
  const progressPct = totalQuantity > 0 ? (inspectedCount / totalQuantity) * 100 : 0;

  useEffect(() => {
    if (!isWithinThreshold && deltaE > 0) {
      setShowRedMask(true);
      const t1 = setTimeout(() => setShowRedMask(false), 350);
      const t2 = setTimeout(() => setShowRedMask(true), 550);
      const t3 = setTimeout(() => setShowRedMask(false), 900);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isWithinThreshold, deltaE]);

  const handleCardSelect = useCallback((card: ColorCard) => {
    setSelectedGrade(card.grade);
    setLab({
      L: Number(jitter(card.labColor.L, 1.5).toFixed(2)),
      a: Number(jitter(card.labColor.a, 1.2).toFixed(2)),
      b: Number(jitter(card.labColor.b, 1.2).toFixed(2)),
    });
  }, []);

  const handleLabChange = (key: keyof LAB, value: number) => {
    setLab((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(totalQuantity - 1, i + 1));
  };

  const handleBatchChange = (id: string) => {
    setActiveBatch(id);
    setCurrentIndex(0);
    resetForm();
  };

  const resetForm = () => {
    setLab({ L: 50, a: 20, b: 40 });
    setSelectedGrade(null);
    setSupplierLotNo('');
    setRemark('');
    setPhotoDataUrl(undefined);
  };

  const suggestedDowngrade = useMemo(() => {
    if (!closest || isWithinThreshold || !selectedGrade) return null;
    const currentIdx = GRADE_ORDER.indexOf(selectedGrade);
    const closestIdx = GRADE_ORDER.indexOf(closest.grade);
    if (closestIdx > currentIdx) return closest.grade;
    for (let i = currentIdx + 1; i < GRADE_ORDER.length; i++) {
      const g = GRADE_ORDER[i];
      const card = colorCards.find((c) => c.grade === g);
      if (card && deltaE <= card.maxDeltaE) return g;
    }
    return closest.grade;
  }, [closest, isWithinThreshold, selectedGrade, colorCards, deltaE]);

  const performSubmit = () => {
    if (!activeBatchId || !batch) return;
    const finalGrade =
      selectedGrade ?? closest?.grade ?? Grade.GRADE_F;
    const finalActual = closest?.grade ?? finalGrade;

    addSilkRecord({
      batchId: activeBatchId,
      serialNumber: inspectedCount + 1,
      selectedGrade: finalGrade,
      actualGrade: finalActual,
      deltaE,
      isWithinThreshold,
      labColor: lab,
      photoDataUrl,
      supplierLotNo,
      remark: remark || undefined,
    });

    setCurrentIndex((i) => Math.min(totalQuantity - 1, i + 1));
    resetForm();
    setShowConfirm(false);
  };

  const handleSubmit = () => {
    if (!activeBatchId) return;
    if (!isWithinThreshold) {
      setShowConfirm(true);
    } else {
      performSubmit();
    }
  };

  const previewHex = labToRoughHex(lab);

  return (
    <div className={cn('relative min-h-screen p-6 space-y-5')}>
      {showRedMask && (
        <div className="fixed inset-0 pointer-events-none z-40 bg-saffron-500/10 animate-pulse" />
      )}

      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 min-w-[280px]">
            <button
              onClick={() => navigate('/batches')}
              className="btn-hard-ghost !px-3 !py-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Listbox value={activeBatchId ?? ''} onChange={handleBatchChange}>
              <div className="relative w-full">
                <Listbox.Button className="w-full flex items-center justify-between gap-2 bg-ink-900 border border-ink-700 px-4 py-2.5 hover:border-gold-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500">
                  <span className="font-mono text-sm text-ink-100">
                    {batch
                      ? `${batch.batchNo} · ${batch.supplierName}`
                      : t('inspection.select_batch')}
                  </span>
                  <ChevronsUpDown className="w-4 h-4 text-ink-400 flex-shrink-0" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-30 mt-1 w-full bg-ink-800 border border-ink-700 shadow-card max-h-64 overflow-y-auto scrollbar-thin">
                  {batches.map((b) => (
                    <Listbox.Option
                      key={b.id}
                      value={b.id}
                      className={({ active, selected }) =>
                        cn(
                          'px-4 py-2.5 cursor-pointer transition-colors',
                          active && 'bg-ink-700',
                          selected && 'text-gold-400'
                        )
                      }
                    >
                      {({ selected }) => (
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-mono text-sm text-ink-100">
                              {b.batchNo}
                            </div>
                            <div className="text-xs text-ink-400 mt-0.5">
                              {b.supplierName} · {t('batch.expected_grade')}: {b.expectedGrade}
                            </div>
                          </div>
                          {selected && <Check className="w-4 h-4 text-gold-500 flex-shrink-0" />}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          <div className="flex-1 min-w-[300px] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="data-chip border-ink-600 bg-ink-900/60 text-ink-200">
                  {t('inspection.current_index')}:{' '}
                  <span className="text-gold-400 font-bold ml-1">
                    {currentIndex + 1}
                  </span>{' '}
                  / {Math.max(totalQuantity, 1)}
                </span>
                <span className="data-chip border-ink-600 bg-ink-900/60 text-ink-200">
                  {t('batch.inspected')}:{' '}
                  <span className="text-emerald-400 font-bold ml-1">
                    {inspectedCount}
                  </span>
                  <span className="text-ink-500 mx-1">/</span>
                  {totalQuantity}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="btn-hard-ghost !px-3 !py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('common.prev')}
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= totalQuantity - 1}
                  className="btn-hard-ghost !px-3 !py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('common.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="progress-track">
              <div
                className={cn(
                  'progress-bar',
                  progressPct >= 100 ? 'bg-emerald-500' : 'bg-gold-500'
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-5">
          <div className="panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-none bg-gold-500" />
                <h3 className="panel-title text-base">{t('inspection.grade_pick')}</h3>
              </div>
              {selectedCard && (
                <div
                  className="data-chip border-gold-500 bg-gold-600/20 text-gold-300 font-bold"
                >
                  {selectedCard.gradeLabel}
                </div>
              )}
            </div>
            <ColorCardStrip
              activeGrade={selectedGrade}
              onSelect={handleCardSelect}
              className="min-h-[280px]"
            />
          </div>

          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-none bg-gold-500" />
                <h3 className="panel-title text-base">{t('inspection.lab_panel')}</h3>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 border-2 border-gold-500"
                  style={{ backgroundColor: previewHex }}
                />
                <div className="font-mono text-xs text-ink-300 tabular-nums">
                  {previewHex}
                </div>
              </div>
            </div>

            {([
              { key: 'L' as const, label: 'L*', min: 0, max: 100, color: 'from-ink-950 to-white' },
              { key: 'a' as const, label: 'a*', min: -60, max: 60, color: 'from-emerald-600 to-saffron-600' },
              { key: 'b' as const, label: 'b*', min: -60, max: 60, color: 'from-blue-600 to-gold-500' },
            ]).map(({ key, label, min, max, color }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-ink-400">
                    {label}
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-gold-300">
                    {lab[key].toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <div className={cn('h-3 bg-gradient-to-r', color)} />
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={0.1}
                    value={lab[key]}
                    onChange={(e) => handleLabChange(key, Number(e.target.value))}
                    className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-white bg-ink-900 shadow-lg pointer-events-none"
                    style={{
                      left: `calc(${((lab[key] - min) / (max - min)) * 100}% - 10px)`,
                    }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-ink-500">
                  <span>{min}</span>
                  <span>0</span>
                  <span>{max}</span>
                </div>
              </div>
            ))}

            {closest && (
              <div className="border-t border-ink-700 pt-3 grid grid-cols-2 gap-3">
                <div className="data-chip border-ink-600 bg-ink-900/60 text-ink-200 !py-2 justify-center">
                  {t('batch.expected_grade')}:{' '}
                  <span className="font-bold ml-1 text-emerald-400">
                    {closest.closestCard.gradeLabel}
                  </span>
                </div>
                <div className="data-chip border-ink-600 bg-ink-900/60 text-ink-200 !py-2 justify-center">
                  ΔE:{' '}
                  <span
                    className={cn(
                      'font-bold ml-1 tabular-nums',
                      closest.isWithinThreshold
                        ? 'text-emerald-400'
                        : 'text-saffron-400'
                    )}
                  >
                    {closest.deltaE.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <DeltaEGauge
            value={deltaE}
            threshold={threshold}
            selectedGrade={selectedGrade}
          />

          {suggestedDowngrade && !isWithinThreshold && (
            <div className="panel p-4 border-saffron-600 bg-saffron-900/20 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-saffron-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono text-sm font-bold text-saffron-300 uppercase tracking-wider">
                    {t('inspection.threshold_warn')}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-ink-200 text-sm">
                      {t('inspection.auto_degrade')}:
                    </span>
                    <span
                      className="data-chip border-gold-500 bg-gold-600/30 text-gold-300 font-bold !py-1.5"
                    >
                      {colorCards.find((c) => c.grade === suggestedDowngrade)
                        ?.gradeLabel ?? suggestedDowngrade}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-5">
          <div className="panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-none bg-gold-500" />
              <h3 className="panel-title text-base">{t('batch.supplier')}</h3>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-ink-400">
                {t('inspection.supplier_lot')}
              </label>
              <input
                type="text"
                value={supplierLotNo}
                onChange={(e) => setSupplierLotNo(e.target.value)}
                placeholder="SUPP-LOT-2026-001"
                className="w-full bg-ink-900 border border-ink-700 px-4 py-2.5 font-mono text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-ink-400">
                {t('inspection.remark')}
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                placeholder="..."
                className="w-full bg-ink-900 border border-ink-700 px-4 py-2.5 font-mono text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-ink-400">
                {t('inspection.take_photo')}
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCameraOpen(true)}
                  className="btn-hard-ghost !px-4 !py-2.5 flex-1 gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {photoDataUrl
                    ? t('common.refresh')
                    : t('inspection.take_photo')}
                </button>
                {photoDataUrl && (
                  <div className="relative w-20 h-20 border-2 border-gold-500 overflow-hidden bg-ink-900 flex-shrink-0">
                    <img
                      src={photoDataUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPhotoDataUrl(undefined)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-saffron-600 text-white text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                    <Eye className="absolute bottom-1 right-1 w-3 h-3 text-white/80" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <button
              onClick={handleSubmit}
              disabled={!activeBatchId}
              className={cn(
                'w-full !py-3.5 !text-base gap-2',
                isWithinThreshold
                  ? 'btn-hard-primary'
                  : 'btn-hard-danger animate-blink-critical',
                !activeBatchId && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isWithinThreshold ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              {t('inspection.confirm_record')}
            </button>

            {!isWithinThreshold && (
              <p className="text-center mt-3 text-xs font-mono text-saffron-400 uppercase tracking-wider animate-blink-critical">
                ⚠ {t('inspection.threshold_warn')}
              </p>
            )}
          </div>
        </div>
      </div>

      <CameraCaptureDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(url) => setPhotoDataUrl(url)}
      />

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="panel p-6 max-w-md w-full space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-saffron-900/50 border-2 border-saffron-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-saffron-400" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-saffron-300">
                  {t('inspection.threshold_warn')}
                </h3>
                <p className="mt-2 text-sm text-ink-300 leading-relaxed">
                  ΔE = <span className="font-mono font-bold text-saffron-400">{deltaE.toFixed(2)}</span>
                  {' '} 超阈阈值 {threshold.toFixed(1)}
                  {suggestedDowngrade && (
                    <>
                      。{t('inspection.auto_degrade')}{' '}
                      <span className="font-bold text-gold-400">
                        {colorCards.find((c) => c.grade === suggestedDowngrade)
                          ?.gradeLabel ?? suggestedDowngrade}
                      </span>
                    </>
                  )}
                  。是否继续录入？
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-hard-ghost flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={performSubmit}
                className="btn-hard-danger flex-1 gap-2"
              >
                <Check className="w-4 h-4" />
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
