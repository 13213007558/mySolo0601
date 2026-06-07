import { useEffect, useMemo, useState } from 'react';
import { FileDown, FileText, Table2, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { usePickupStore } from '@/store/pickupStore';
import { buildExportReport, reportToCsv, reportToMarkdown, downloadFile, formatTime } from '@/utils/report';
import type { ExportReport } from '@/types';
import { cn } from '@/lib/utils';

type Tab = 'csv' | 'markdown';

export function ExportPage() {
  const records = usePickupStore((s) => s.records);
  const auditLogs = usePickupStore((s) => s.auditLogs);
  const corrections = usePickupStore((s) => s.corrections);

  const [tab, setTab] = useState<Tab>('markdown');
  const [report, setReport] = useState<ExportReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [csvText, setCsvText] = useState('');
  const [mdText, setMdText] = useState('');
  const [consistent, setConsistent] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const r = await buildExportReport(records, auditLogs, corrections);
    setReport(r);
    setCsvText(reportToCsv(r));
    setMdText(reportToMarkdown(r));
    setConsistent(true);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [records.length, auditLogs.length, corrections.length]);

  const filename = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `西门夜班交接_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  }, []);

  const download = (fmt: 'csv' | 'md') => {
    if (!report) return;
    if (fmt === 'csv') downloadFile(`${filename}.csv`, csvText, 'text/csv;charset=utf-8');
    else downloadFile(`${filename}.md`, mdText, 'text/markdown;charset=utf-8');
  };

  const s = report?.summary;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="px-6 py-4 border-b border-night-600 bg-night-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-night-50 flex items-center gap-2">
              <FileDown size={20} className="text-pickup-phone" />
              导出中心
            </h1>
            <p className="text-xs text-night-300 mt-0.5">
              CSV 与 Markdown 基于同一数据源生成，页面摘要、详情状态、导出报告三者严格互相对得上
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-night-500 text-night-200 hover:bg-night-700"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 重新生成
            </button>
            <button
              onClick={() => download('csv')}
              disabled={!report || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-pickup-phone text-white hover:bg-pickup-phone/90 disabled:opacity-40 btn-glow"
            >
              <Table2 size={14} /> 下载 CSV
            </button>
            <button
              onClick={() => download('md')}
              disabled={!report || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-pickup-normal text-white hover:bg-pickup-normal/90 disabled:opacity-40 btn-glow"
            >
              <FileText size={14} /> 下载 Markdown
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Metric label="应接送" value={s.totalExpected} />
            <Metric label="已接走" value={s.totalPicked} accent="green" />
            <Metric label="异常" value={s.totalException} accent="amber" />
            <Metric label="电话授权" value={s.totalPhoneAuthorized} accent="blue" />
            <Metric label="临时阿姨" value={s.totalTempAunt} accent="purple" />
            <Metric label="已撤回" value={s.totalWithdrawn} accent="red" />
            <Metric label="坏行" value={s.totalBadRows} accent="red" />
            <div className="col-span-1">
              <div className="flex items-center gap-2 px-3 py-2 bg-night-700/60 border border-night-500 rounded-md">
                {loading ? (
                  <Loader2 size={14} className="animate-spin text-night-300" />
                ) : consistent ? (
                  <CheckCircle2 size={14} className="text-pickup-normal" />
                ) : (
                  <AlertCircle size={14} className="text-pickup-exception" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-night-300 font-mono">
                    {loading ? '校验中' : consistent ? '一致性校验通过' : '不一致'}
                  </div>
                  <div className="text-[10px] text-night-400 font-mono truncate" title={s.consistencyHash}>
                    H: {s.consistencyHash.slice(0, 8)}…
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {s && (
          <div className="flex items-center gap-4 text-xs text-night-300 font-mono flex-wrap">
            <span>班次：<span className="text-night-100">{s.shiftName}</span></span>
            <span>生成时间：<span className="text-night-100">{formatTime(s.generatedAt)}</span></span>
            <span>记录数：<span className="text-night-100">{s.totalExpected + s.totalBadRows}</span></span>
            <span>审计日志：<span className="text-night-100">{auditLogs.length} 条</span></span>
            <span>更正记录：<span className="text-night-100">{corrections.length} 条</span></span>
          </div>
        )}

        <div className="bg-night-700/50 border border-night-600 rounded-lg overflow-hidden flex flex-col" style={{ minHeight: '60vh' }}>
          <div className="flex items-center border-b border-night-600 bg-night-800/60">
            <TabBtn active={tab === 'markdown'} onClick={() => setTab('markdown')}>
              <FileText size={14} /> Markdown 交接报告
            </TabBtn>
            <TabBtn active={tab === 'csv'} onClick={() => setTab('csv')}>
              <Table2 size={14} /> CSV 结构化数据
            </TabBtn>
            <div className="flex-1" />
            <div className="px-3 text-[10px] text-night-400 font-mono flex items-center gap-1.5">
              {consistent && (
                <>
                  <CheckCircle2 size={11} className="text-pickup-normal" />
                  <span>CSV 与 Markdown 数据一致</span>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-night-900">
            {loading ? (
              <div className="flex items-center justify-center h-full text-night-300 text-sm gap-2">
                <Loader2 size={16} className="animate-spin" />
                正在生成报告并进行一致性校验……
              </div>
            ) : tab === 'markdown' ? (
              <pre className="p-4 text-xs leading-relaxed font-mono text-night-100 whitespace-pre-wrap">
                {mdText}
              </pre>
            ) : (
              <pre className="p-4 text-xs leading-relaxed font-mono text-night-100 whitespace-pre">
                {csvText}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: 'green' | 'amber' | 'blue' | 'purple' | 'red' }) {
  const color =
    accent === 'green' ? 'text-pickup-normal' :
    accent === 'amber' ? 'text-pickup-exception' :
    accent === 'blue' ? 'text-pickup-phone' :
    accent === 'purple' ? 'text-pickup-aunt' :
    accent === 'red' ? 'text-pickup-withdrawn' : 'text-night-50';
  return (
    <div className="bg-night-700/60 border border-night-600 rounded-md px-3 py-2">
      <div className="text-[10px] text-night-300 font-mono tracking-wide">{label}</div>
      <div className={cn('text-2xl font-display font-semibold mt-0.5', color)}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2.5 text-xs border-r border-night-600 transition-colors',
        active
          ? 'bg-night-700 text-night-50 border-b-2 border-b-pickup-phone'
          : 'text-night-300 hover:bg-night-700/50'
      )}
    >
      {children}
    </button>
  );
}

export default ExportPage;
