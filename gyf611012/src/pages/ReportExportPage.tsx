import { useEffect, useMemo, useRef, useState } from 'react';
import { Listbox, Radio, RadioGroup, Transition } from '@headlessui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ChevronLeft,
  FileBarChart,
  FileCheck2,
  ChevronsUpDown,
  Check,
  Download,
  Languages,
  Building2,
  CalendarDays,
  Hash,
  Layers,
  AlertTriangle,
  User,
  Signature,
  StickyNote,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { dayjs, formatDate, formatDateTime, percentOf } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { BatchInfo, Language, SaffronGrade } from '@/types';
import { SaffronGrade as Grade } from '@/types';

type ReportType = 'inspection' | 'return';

const GRADE_ORDER: SaffronGrade[] = [
  Grade.GRADE_S,
  Grade.GRADE_A,
  Grade.GRADE_B,
  Grade.GRADE_C,
  Grade.GRADE_D,
  Grade.GRADE_E,
  Grade.GRADE_F,
];

const GRADE_LABELS: Record<string, string> = {
  S: '特级 S',
  A: '一级 A',
  B: '二级 B',
  C: '三级 C',
  D: '四级 D',
  E: '五级 E',
  F: '退货 F',
};

const GRADE_LABELS_EN: Record<string, string> = {
  S: 'Super Grade S',
  A: 'Grade A',
  B: 'Grade B',
  C: 'Grade C',
  D: 'Grade D',
  E: 'Grade E',
  F: 'Return F',
};

const GRADE_LABELS_HI: Record<string, string> = {
  S: 'सुपर S',
  A: 'ग्रेड A',
  B: 'ग्रेड B',
  C: 'ग्रेड C',
  D: 'ग्रेड D',
  E: 'ग्रेड E',
  F: 'वापसी F',
};

function gradeLabel(g: SaffronGrade, lang: Language): string {
  if (lang === 'en') return GRADE_LABELS_EN[g] || g;
  if (lang === 'hi') return GRADE_LABELS_HI[g] || g;
  return GRADE_LABELS[g] || g;
}

const TITLE_TEXT: Record<Language, Record<ReportType, string>> = {
  zh: { inspection: '质检报告', return: '降级退货单' },
  en: { inspection: 'Inspection Report', return: 'Downgrade Return Order' },
  hi: { inspection: 'गुणवत्ता रिपोर्ट', return: 'डाउनग्रेड रिटर्न' },
};

export default function ReportExportPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { batchId } = useParams();
  const {
    batches,
    currentUser,
    getBatchById,
    getBatchRecords,
    getReturnOrdersForBatch,
    settings,
  } = useAppStore();

  const [reportType, setReportType] = useState<ReportType>('inspection');
  const [previewLang, setPreviewLang] = useState<Language>(settings.language);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batchId || batches[0]?.id || '');
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (batchId) setSelectedBatchId(batchId);
  }, [batchId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const batch: BatchInfo | undefined = useMemo(
    () => (selectedBatchId ? getBatchById(selectedBatchId) : undefined),
    [selectedBatchId, getBatchById]
  );

  const batchRecords = useMemo(
    () => (batch ? getBatchRecords(batch.id) : []),
    [batch, getBatchRecords]
  );

  const outlierRecords = useMemo(
    () => batchRecords.filter((r) => !r.isWithinThreshold).slice(0, 15),
    [batchRecords]
  );

  const returnOrders = useMemo(
    () => (batch ? getReturnOrdersForBatch(batch.id) : []),
    [batch, getReturnOrdersForBatch]
  );

  const activeReturn = returnOrders[returnOrders.length - 1];

  const langLabel: Record<Language, string> = {
    zh: '中文',
    en: 'English',
    hi: 'हिन्दी',
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current || !batch) return;
    setExporting(true);
    const prevLang = i18n.language as Language;
    try {
      await i18n.changeLanguage(previewLang);
      await new Promise((r) => setTimeout(r, 120));

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * pageW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
      const typeName =
        previewLang === 'en'
          ? reportType === 'inspection'
            ? 'Inspection'
            : 'Return'
          : previewLang === 'hi'
            ? reportType === 'inspection'
              ? 'Riport'
              : 'Vapasi'
            : reportType === 'inspection'
              ? '质检报告'
              : '退货单';
      const fileName = `${batch.batchNo}-${typeName}-${previewLang.toUpperCase()}.pdf`;
      pdf.save(fileName);
      setToast(`已导出 ${fileName}`);
    } catch (err) {
      console.error(err);
      setToast('导出失败，请重试');
    } finally {
      await i18n.changeLanguage(prevLang);
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 p-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 panel px-5 py-3 border-gold-500/50 font-mono text-sm text-gold-400 shadow-gold-glow">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="btn-hard-ghost !px-3 !py-2"
            title={t('common.back')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-gold-500" />
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink-100 tracking-wide">
                {t('report.title')}
              </h1>
              <p className="text-sm text-ink-400 mt-0.5">
                选择报告参数，实时预览后导出 PDF
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <div className="panel p-5 space-y-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-1.5">
                <FileBarChart className="w-3.5 h-3.5" />
                {t('report.report_type')}
              </div>
              <RadioGroup
                value={reportType}
                onChange={(v) => setReportType(v)}
                className="space-y-2"
              >
                {([
                  { value: 'inspection' as const, label: t('report.inspection_report'), icon: FileBarChart },
                  { value: 'return' as const, label: t('report.return_order'), icon: FileCheck2 },
                ]).map((opt) => {
                  const isChecked = reportType === opt.value;
                  return (
                    <Radio
                      key={opt.value}
                      value={opt.value}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-3 cursor-pointer border transition-all',
                        isChecked
                          ? 'bg-gold-500/10 border-gold-500/50 text-gold-400'
                          : 'bg-ink-900/40 border-ink-700 text-ink-300 hover:border-ink-600'
                      )}
                    >
                      <opt.icon className="w-4 h-4" />
                      <span className="font-mono text-sm flex-1 text-left">{opt.label}</span>
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                          isChecked ? 'border-gold-500 bg-gold-500' : 'border-ink-500'
                        )}
                      >
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-ink-900" />}
                      </span>
                    </Radio>
                  );
                })}
              </RadioGroup>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                {t('report.language')}
              </div>
              <RadioGroup
                value={previewLang}
                onChange={(v) => setPreviewLang(v)}
                className="space-y-2"
              >
                {(['zh', 'en', 'hi'] as const).map((lang) => {
                  const isChecked = previewLang === lang;
                  return (
                    <Radio
                      key={lang}
                      value={lang}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-3 cursor-pointer border transition-all',
                        isChecked
                          ? 'bg-saffron-700/10 border-saffron-500/50 text-saffron-300'
                          : 'bg-ink-900/40 border-ink-700 text-ink-300 hover:border-ink-600'
                      )}
                    >
                      <Languages className="w-4 h-4" />
                      <span className="font-mono text-sm flex-1 text-left">{langLabel[lang]}</span>
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                          isChecked ? 'border-saffron-500 bg-saffron-500' : 'border-ink-500'
                        )}
                      >
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-ink-900" />}
                      </span>
                    </Radio>
                  );
                })}
              </RadioGroup>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {t('batch.batch_no')}
              </div>
              <Listbox value={selectedBatchId} onChange={setSelectedBatchId}>
                <div className="relative">
                  <Listbox.Button className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-ink-900 border border-ink-700 hover:border-ink-600 transition-colors text-left">
                    <span className="font-mono text-sm text-ink-200 truncate">
                      {batch ? `${batch.batchNo} · ${batch.supplierName}` : '—'}
                    </span>
                    <ChevronsUpDown className="w-4 h-4 text-ink-500 shrink-0" />
                  </Listbox.Button>
                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-20 mt-2 w-full max-h-72 overflow-auto border border-ink-700 bg-ink-900 shadow-gold-glow/10 scrollbar-thin">
                      {batches.map((b) => (
                        <Listbox.Option
                          key={b.id}
                          value={b.id}
                          className={({ active, selected }) =>
                            cn(
                              'px-4 py-3 cursor-pointer border-b border-ink-800 last:border-b-0 transition-colors',
                              active || selected ? 'bg-gold-500/10' : 'bg-ink-900',
                              selected ? 'text-gold-400' : 'text-ink-200'
                            )
                          }
                        >
                          {({ selected }) => (
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-ink-400 shrink-0">
                                {b.batchNo}
                              </span>
                              <span className="text-sm flex-1 truncate">{b.supplierName}</span>
                              {selected && <Check className="w-4 h-4 text-gold-500" />}
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={!batch || exporting}
              className={cn(
                'btn-hard-primary w-full !py-3',
                (!batch || exporting) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Download className="w-4 h-4" />
              {exporting ? '导出中...' : t('report.download_pdf')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="panel p-4">
            <div className="panel-header -mx-4 -mt-4 mb-4">
              <div className="panel-title flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-gold-500" />
                A4 实时预览 ({langLabel[previewLang]})
              </div>
            </div>
            <div className="overflow-auto scrollbar-thin max-h-[calc(100vh-260px)] bg-ink-950 p-6 border border-ink-700">
              <div
                ref={previewRef}
                className="bg-white mx-auto w-[210mm] min-h-[297mm] text-ink-900 shadow-2xl p-10 font-serif text-sm"
                style={{ fontFamily: '"Noto Serif SC", Georgia, "Times New Roman", serif' }}
              >
                {batch ? (
                  <>
                    <div className="flex items-start justify-between border-b-2 border-gold-500 pb-5 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-saffron-600 flex items-center justify-center text-white">
                          <span className="font-black text-xl tracking-wider">S</span>
                        </div>
                        <div>
                          <div className="font-black text-xl tracking-widest text-saffron-700">
                            SAFFRON QC
                          </div>
                          <div className="text-xs text-ink-500 mt-0.5 tracking-wide">
                            {previewLang === 'zh'
                              ? '藏红丝线比色质检系统'
                              : previewLang === 'en'
                                ? 'Saffron Silk Color Matching System'
                                : 'केसर रेशा रंग मिलान प्रणाली'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-2xl text-ink-800 tracking-wide">
                          {TITLE_TEXT[previewLang][reportType]}
                        </div>
                        <div className="text-xs text-ink-500 mt-1 font-mono">
                          NO. {batch.batchNo}-{reportType === 'inspection' ? 'QC' : 'RT'}-
                          {dayjs().format('YYYYMMDD')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6 bg-ink-50 p-5 border border-ink-200">
                      <div className="flex items-start gap-2">
                        <Hash className="w-4 h-4 text-saffron-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs text-ink-500">
                            {previewLang === 'zh' ? '批次号' : previewLang === 'en' ? 'Batch No.' : 'बैच सं.'}
                          </div>
                          <div className="font-mono font-semibold">{batch.batchNo}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-saffron-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs text-ink-500">
                            {previewLang === 'zh' ? '供应商' : previewLang === 'en' ? 'Supplier' : 'आपूर्तक'}
                          </div>
                          <div className="font-semibold">{batch.supplierName}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CalendarDays className="w-4 h-4 text-saffron-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs text-ink-500">
                            {previewLang === 'zh' ? '到货日期' : previewLang === 'en' ? 'Arrival Date' : 'आगमन'}
                          </div>
                          <div className="font-mono">{formatDate(batch.arrivalDate)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Layers className="w-4 h-4 text-saffron-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs text-ink-500">
                            {previewLang === 'zh' ? '合同等级' : previewLang === 'en' ? 'Contract Grade' : 'अपेक्षित ग्रेड'}
                          </div>
                          <div className="font-bold">{gradeLabel(batch.expectedGrade, previewLang)}</div>
                        </div>
                      </div>
                    </div>

                    {reportType === 'return' && activeReturn && (
                      <div className="mb-6 bg-saffron-50 border-2 border-saffron-300 p-4">
                        <div className="font-bold text-saffron-700 mb-2 flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4" />
                          {previewLang === 'zh'
                            ? `降级决定：${activeReturn.originalGrade} → ${activeReturn.degradedToGrade}`
                            : previewLang === 'en'
                              ? `Downgrade: ${activeReturn.originalGrade} → ${activeReturn.degradedToGrade}`
                              : `डाउनग्रेड: ${activeReturn.originalGrade} → ${activeReturn.degradedToGrade}`}
                        </div>
                        <div className="text-sm text-ink-700 leading-relaxed">
                          {activeReturn.degradationReason}
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="font-bold text-ink-800 text-base mb-3 border-l-4 border-gold-500 pl-3">
                        {previewLang === 'zh'
                          ? '等级分布统计'
                          : previewLang === 'en'
                            ? 'Grade Distribution'
                            : 'ग्रेड वितरण'}
                      </div>
                      <table className="w-full text-sm border border-ink-300">
                        <thead className="bg-ink-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-bold border-r border-ink-300">
                              {previewLang === 'zh' ? '等级' : previewLang === 'en' ? 'Grade' : 'ग्रेड'}
                            </th>
                            {GRADE_ORDER.map((g) => (
                              <th key={g} className="px-2 py-2 text-center font-mono border-r border-ink-300 last:border-r-0">
                                {g}
                              </th>
                            ))}
                            <th className="px-3 py-2 text-center font-bold border-l-2 border-ink-400 bg-gold-100">
                              {previewLang === 'zh' ? '合计' : previewLang === 'en' ? 'Total' : 'कुल'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-ink-300">
                            <td className="px-3 py-2 font-semibold border-r border-ink-300 bg-ink-50">
                              {previewLang === 'zh' ? '数量' : previewLang === 'en' ? 'Count' : 'संख्या'}
                            </td>
                            {GRADE_ORDER.map((g) => (
                              <td
                                key={g}
                                className={cn(
                                  'px-2 py-2 text-center font-mono border-r border-ink-300 last:border-r-0',
                                  batch.gradeDistribution[g] > 0 && g === batch.expectedGrade
                                    ? 'bg-emerald-50 font-semibold'
                                    : batch.gradeDistribution[g] > 0 && g > batch.expectedGrade
                                      ? 'bg-saffron-50 font-semibold text-saffron-700'
                                      : ''
                                )}
                              >
                                {batch.gradeDistribution[g]}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-mono font-bold border-l-2 border-ink-400 bg-gold-50">
                              {batch.totalQuantity}
                            </td>
                          </tr>
                          <tr className="border-t border-ink-300">
                            <td className="px-3 py-2 font-semibold border-r border-ink-300 bg-ink-50">
                              {previewLang === 'zh' ? '占比' : previewLang === 'en' ? 'Ratio' : 'प्रतिशत'}
                            </td>
                            {GRADE_ORDER.map((g) => (
                              <td
                                key={g}
                                className="px-2 py-2 text-center font-mono text-xs border-r border-ink-300 last:border-r-0 text-ink-600"
                              >
                                {percentOf(batch.gradeDistribution[g], batch.totalQuantity, 0)}%
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-bold border-l-2 border-ink-400 bg-gold-50 text-xs">
                              100%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                        <div className="bg-ink-50 border border-ink-200 p-3 text-center">
                          <div className="text-xs text-ink-500">
                            {previewLang === 'zh' ? '平均ΔE' : previewLang === 'en' ? 'Avg ΔE' : 'औसत ΔE'}
                          </div>
                          <div className={cn(
                            'font-mono font-bold text-lg mt-1',
                            batch.avgDeltaE > 4 ? 'text-saffron-600' : 'text-emerald-600'
                          )}>
                            {batch.inspectedCount > 0 ? batch.avgDeltaE.toFixed(2) : '—'}
                          </div>
                        </div>
                        <div className="bg-ink-50 border border-ink-200 p-3 text-center">
                          <div className="text-xs text-ink-500">
                            {previewLang === 'zh' ? '最大ΔE' : previewLang === 'en' ? 'Max ΔE' : 'अधिकतम ΔE'}
                          </div>
                          <div className="font-mono font-bold text-lg mt-1 text-amber-600">
                            {batch.inspectedCount > 0 ? batch.maxDeltaE.toFixed(2) : '—'}
                          </div>
                        </div>
                        <div className="bg-ink-50 border border-ink-200 p-3 text-center">
                          <div className="text-xs text-ink-500 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {previewLang === 'zh' ? '超阈数' : previewLang === 'en' ? 'Outliers' : 'बहिर्गमन'}
                          </div>
                          <div className="font-mono font-bold text-lg mt-1 text-saffron-600">
                            {batch.outOfThresholdCount}
                            <span className="text-xs text-ink-400 ml-1">
                              ({percentOf(batch.outOfThresholdCount, batch.totalQuantity, 0)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {outlierRecords.length > 0 && (
                      <div className="mb-6">
                        <div className="font-bold text-ink-800 text-base mb-3 border-l-4 border-saffron-500 pl-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-saffron-600" />
                          {previewLang === 'zh'
                            ? '超阈明细表'
                            : previewLang === 'en'
                              ? 'Outlier Details'
                              : 'बहिर्गमन विवरण'}
                        </div>
                        <div className="overflow-x-auto border border-ink-300">
                          <table className="w-full text-xs">
                            <thead className="bg-saffron-100 text-saffron-800">
                              <tr>
                                <th className="px-3 py-2 text-left font-bold border-r border-ink-200">#</th>
                                <th className="px-3 py-2 text-left font-bold border-r border-ink-200">
                                  {previewLang === 'zh' ? '批号' : previewLang === 'en' ? 'Lot No.' : 'लॉट'}
                                </th>
                                <th className="px-3 py-2 text-center font-bold border-r border-ink-200">
                                  {previewLang === 'zh' ? '等级' : previewLang === 'en' ? 'Grade' : 'ग्रेड'}
                                </th>
                                <th className="px-3 py-2 text-right font-bold border-r border-ink-200">ΔE</th>
                                <th className="px-3 py-2 text-left font-bold">
                                  {previewLang === 'zh' ? '质检员' : previewLang === 'en' ? 'Inspector' : 'निरीक्षक'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {outlierRecords.map((r, idx) => (
                                <tr key={r.id} className="border-t border-ink-200 even:bg-ink-50">
                                  <td className="px-3 py-1.5 font-mono text-ink-500 border-r border-ink-200">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-1.5 font-mono border-r border-ink-200">{r.supplierLotNo}</td>
                                  <td className="px-3 py-1.5 text-center border-r border-ink-200 font-semibold text-saffron-700">
                                    {r.actualGrade}
                                  </td>
                                  <td className="px-3 py-1.5 text-right font-mono font-bold text-saffron-600 border-r border-ink-200">
                                    {r.deltaE.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-1.5">{r.inspectorName}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="font-bold text-ink-800 text-base mb-3 border-l-4 border-ink-400 pl-3 flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-ink-600" />
                        {previewLang === 'zh' ? '备注' : previewLang === 'en' ? 'Remarks' : 'टिप्पणियाँ'}
                      </div>
                      <div className="border border-ink-200 border-dashed bg-ink-50 min-h-[60px] p-3 text-ink-500 text-sm">
                        —
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-ink-200">
                      <div className="text-center">
                        <div className="text-xs text-ink-500 mb-8">
                          {previewLang === 'zh' ? '质检员签名' : previewLang === 'en' ? 'Inspector' : 'निरीक्षक'}
                        </div>
                        <div className="border-t border-ink-400 pt-2">
                          <Signature className="w-5 h-5 mx-auto text-ink-300 mb-1" />
                          <div className="font-mono text-xs text-ink-500">
                            Date: {formatDate(batch.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-ink-500 mb-8">
                          {previewLang === 'zh' ? '主管审核' : previewLang === 'en' ? 'Supervisor' : 'पर्यवेक्षक'}
                        </div>
                        <div className="border-t border-ink-400 pt-2">
                          <Signature className="w-5 h-5 mx-auto text-ink-300 mb-1" />
                          <div className="font-mono text-xs text-ink-500">Date: ______________</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-ink-500 mb-8">
                          {previewLang === 'zh' ? '经理批准' : previewLang === 'en' ? 'Manager' : 'प्रबंधक'}
                        </div>
                        <div className="border-t border-ink-400 pt-2">
                          <Signature className="w-5 h-5 mx-auto text-ink-300 mb-1" />
                          <div className="font-mono text-xs text-ink-500">Date: ______________</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-ink-200 flex items-center justify-between text-[10px] text-ink-400 font-mono">
                      <span>
                        {previewLang === 'zh'
                          ? `本报告由 SAFFRON QC 系统自动生成 · 打印时间 ${formatDateTime(dayjs().toISOString())}`
                          : previewLang === 'en'
                            ? `Generated by SAFFRON QC · ${formatDateTime(dayjs().toISOString())}`
                            : `SAFFRON QC द्वारा उत्पन्न · ${formatDateTime(dayjs().toISOString())}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {currentUser.name} ({currentUser.employeeNo})
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-ink-400">
                    {previewLang === 'zh' ? '请先选择批次' : 'Please select a batch'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
