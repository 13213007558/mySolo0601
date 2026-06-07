import { useState } from 'react';
import { X, Copy, Download, CheckCircle2 } from 'lucide-react';
import type { TrackRecord } from '@/types';
import { buildSummaryText, copySummaryToClipboard, downloadSummaryAsText } from '@/utils/exportSummary';

interface Props {
  record: TrackRecord;
  onClose: () => void;
}

export default function ExportModal({ record, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const text = buildSummaryText(record);

  const handleCopy = async () => {
    const ok = await copySummaryToClipboard(record);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/40 backdrop-blur-sm p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-warm-100 bg-white shadow-card"
      >
        <div className="flex items-center justify-between border-b border-warm-100 px-5 py-3.5">
          <div>
            <h3 className="font-serif text-lg font-semibold text-warm-900">
              导出核查摘要
            </h3>
            <p className="mt-0.5 text-xs text-warm-500">
              同事可直接阅读，敏感字段已自动脱敏
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto bg-warm-50 px-5 py-4">
          <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-warm-700">
            {text}
          </pre>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-warm-100 bg-white px-5 py-3">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              copied
                ? 'bg-sage-100 text-sage-600'
                : 'bg-sage-400 text-white hover:bg-sage-500 shadow-soft hover:shadow-card'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                一键复制
              </>
            )}
          </button>
          <button
            onClick={() => downloadSummaryAsText(record)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-medium text-warm-700 transition-all duration-200 hover:border-sage-300 hover:text-sage-500"
          >
            <Download className="h-4 w-4" />
            下载 .txt
          </button>
        </div>
      </div>
    </div>
  );
}
