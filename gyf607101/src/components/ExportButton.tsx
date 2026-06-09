import { useState } from 'react';
import { Download, Copy, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyToClipboard, downloadTextFile } from '../utils';
import type { ExportSummary } from '../types';
import { generateExportText } from '../utils';

interface ExportButtonProps {
  summary: ExportSummary;
  className?: string;
}

export function ExportButton({ summary, className }: ExportButtonProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = async () => {
    const text = generateExportText(summary);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const text = generateExportText(summary);
    const date = new Date().toISOString().split('T')[0];
    const filename = `光伏逆变器复核摘要_${date}.txt`;
    downloadTextFile(text, filename);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className={cn('flex gap-3', className)}>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          'flex items-center gap-2 px-4 py-2 border-2 rounded font-medium transition-all duration-200',
          copied
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
            : 'border-slate-600 hover:border-blue-500 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400'
        )}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            已复制
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            复制文本
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className={cn(
          'flex items-center gap-2 px-4 py-2 border-2 rounded font-medium transition-all duration-200',
          downloaded
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
            : 'border-blue-500 bg-blue-500 hover:bg-blue-600 text-white'
        )}
      >
        {downloaded ? (
          <>
            <Check className="w-4 h-4" />
            已下载
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            下载文件
          </>
        )}
      </button>
    </div>
  );
}

export function ExportPreview({ summary }: { summary: ExportSummary }) {
  const text = generateExportText(summary);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4 text-slate-400">
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">导出预览</span>
      </div>
      <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded border border-slate-800">
        {text}
      </pre>
    </div>
  );
}
