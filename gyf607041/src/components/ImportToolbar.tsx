import { Upload, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import type { ImportResult } from '@shared/types';
import { api } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

export default function ImportToolbar() {
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const setImportResult = useAppStore(s => s.setImportResult);
  const refreshBabies = useAppStore(s => s.refreshBabies);
  const loadAuditData = useAppStore(s => s.loadAuditData);

  const handle = async (file: File) => {
    setLoading(true);
    try {
      const result: ImportResult = await api.importExcel(file);
      setImportResult(result);
      await Promise.all([refreshBabies(), loadAuditData()]);
    } catch (e: any) {
      setImportResult({
        auditId: '',
        success: false,
        partialSuccess: false,
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        message: e.message || '导入失败',
        failedRecords: [],
        hasDiscrepancy: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); if (fileRef.current) fileRef.current.value = ''; }}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-medical-500 to-medical-700 text-white text-sm font-medium shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {loading ? '导入中...' : '导入体温表'}
      </button>
    </div>
  );
}

export function ImportResultBanner() {
  const result = useAppStore(s => s.importResult);
  const setImportResult = useAppStore(s => s.setImportResult);
  if (!result) return null;

  const variant =
    result.success ? { icon: <CheckCircle2 className="w-5 h-5" />, bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', text: 'text-emerald-700' }
    : result.partialSuccess ? { icon: <AlertCircle className="w-5 h-5" />, bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700' }
    : { icon: <XCircle className="w-5 h-5" />, bg: 'from-rose-50 to-pink-50', border: 'border-rose-200', text: 'text-rose-700' };

  return (
    <div className={`rounded-2xl border ${variant.border} bg-gradient-to-r ${variant.bg} p-4 flex items-start gap-3 animate-fadeInUp`}>
      <div className={`${variant.text} mt-0.5`}>{variant.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${variant.text}`}>{result.message}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <span>总数：<b>{result.totalCount}</b></span>
          <span className="text-emerald-600">成功：<b>{result.successCount}</b></span>
          {result.failedCount > 0 && <span className="text-rose-600">失败：<b>{result.failedCount}</b></span>}
          {result.hasDiscrepancy && <span className="text-amber-600">⚠ 记录数与页面不一致，已留存审计</span>}
        </div>
        {result.failedRecords.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1 max-h-32 overflow-y-auto">
            {result.failedRecords.slice(0, 5).map((f, i) => (
              <p key={i} className="text-[11px] text-slate-500">第{f.row}行：{f.reason}</p>
            ))}
            {result.failedRecords.length > 5 && <p className="text-[11px] text-slate-400">...另有 {result.failedRecords.length - 5} 条失败记录，详情见审计日志</p>}
          </div>
        )}
      </div>
      <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
