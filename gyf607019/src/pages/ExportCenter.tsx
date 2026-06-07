import { useState, useMemo } from 'react';
import { FileDown, FileText, Table, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import { EXPORTABLE_FIELDS, STATUS_LABEL, type ExportFormat } from '@/types';
import { desensitizeField } from '@/utils';

export default function ExportCenter() {
  const records = useAppStore((s) => s.records);
  const selectedIds = useAppStore((s) => s.selectedRecordIds);
  const performExport = useAppStore((s) => s.performExport);

  const [format, setFormat] = useState<ExportFormat>('csv');
  const [fields, setFields] = useState<string[]>(
    EXPORTABLE_FIELDS.filter((f) => !f.isPrivate).map((f) => f.key),
  );
  const [desensitizePrivate, setDesensitizePrivate] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [exported, setExported] = useState(false);

  const targetRecords = useMemo(
    () => (selectedIds.length > 0 ? records.filter((r) => selectedIds.includes(r.id)) : records),
    [records, selectedIds],
  );

  const privateFieldsSelected = useMemo(
    () => fields.some((f) => EXPORTABLE_FIELDS.find((ef) => ef.key === f)?.isPrivate),
    [fields],
  );

  const toggleField = (key: string) => {
    setFields((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const handleExport = () => {
    performExport({
      format,
      fields,
      desensitizePrivate,
      includeHistory,
      recordIds: selectedIds.length > 0 ? selectedIds : undefined,
    });
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif-sc text-2xl font-semibold text-slate-800">导出中心</h1>
          <p className="text-sm text-slate-500 mt-1">
            导出内容与页面摘要、详情状态严格对应，所有操作均记录审计日志
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={fields.length === 0 || targetRecords.length === 0}
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-all ${
            exported
              ? 'bg-safety-500 text-white animate-bounce-in'
              : 'bg-medical-600 hover:bg-medical-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed'
          }`}
        >
          {exported ? <CheckCircle2 className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
          {exported ? '已导出并写入审计 ✓' : `导出 ${targetRecords.length} 条记录`}
        </button>
      </div>

      {exported && (
        <div className="mb-5 bg-safety-50 border border-safety-200 rounded-xl p-4 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-safety-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-safety-700 mb-1">导出成功，审计日志已写入！</p>
              <p className="text-sm text-safety-600/80">
                可前往「审计日志」页查看本次导出的操作人、时间、字段范围和脱敏状态，方便主管复查。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-medical-600" />
              导出格式
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  format === 'csv'
                    ? 'border-medical-500 bg-medical-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                  format === 'csv' ? 'bg-medical-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">CSV 表格</p>
                  <p className="text-xs text-slate-500 mt-0.5">Excel 兼容，UTF-8 BOM 编码</p>
                </div>
              </button>
              <button
                onClick={() => setFormat('markdown')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  format === 'markdown'
                    ? 'border-medical-500 bg-medical-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                  format === 'markdown' ? 'bg-medical-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Markdown 报告</p>
                  <p className="text-xs text-slate-500 mt-0.5">带状态标签，适合文档归档</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-medical-600" />
              选择导出字段
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              已选 <span className="font-medium text-medical-600">{fields.length}</span> / {EXPORTABLE_FIELDS.length} 个字段
            </p>
            <div className="grid grid-cols-3 gap-2">
              {EXPORTABLE_FIELDS.map((f) => {
                const checked = fields.includes(f.key);
                return (
                  <label
                    key={f.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                      checked
                        ? f.isPrivate
                          ? 'bg-danger-50 border-danger-300 text-danger-700'
                          : 'bg-medical-50 border-medical-300 text-medical-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleField(f.key)}
                      className="rounded border-slate-300 text-medical-600 focus:ring-medical-500/30"
                    />
                    <span className="flex-1">{f.label}</span>
                    {f.isPrivate && (
                      <span className="text-[10px] px-1 py-px rounded bg-danger-100 text-danger-600">隐私</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-medical-600" />
              隐私与选项
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  {desensitizePrivate ? (
                    <ShieldCheck className="w-5 h-5 text-safety-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-danger-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-700">隐私字段脱敏</p>
                    <p className="text-xs text-slate-500 mt-0.5">身份证保留前6后4，手机号保留前3后4</p>
                  </div>
                </div>
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  desensitizePrivate ? 'bg-safety-500' : 'bg-danger-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={desensitizePrivate}
                    onChange={(e) => setDesensitizePrivate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    desensitizePrivate ? 'left-5' : 'left-0.5'
                  }`} />
                </div>
              </label>

              {privateFieldsSelected && !desensitizePrivate && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 animate-fade-in-up">
                  <p className="text-xs font-medium text-danger-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    审计提醒：未脱敏导出隐私字段
                  </p>
                  <p className="text-xs text-danger-600/80 mt-1">
                    此操作将被永久记录在审计日志中，包含操作人、时间和涉及字段。
                  </p>
                </div>
              )}

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">包含历史变更记录</p>
                  <p className="text-xs text-slate-500 mt-0.5">在报告中附加字段变更时间线</p>
                </div>
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  includeHistory ? 'bg-medical-500' : 'bg-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    includeHistory ? 'left-5' : 'left-0.5'
                  }`} />
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-3">导出预览（前3条）</h2>
            {targetRecords.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">暂无可导出记录</p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-auto">
                {targetRecords.slice(0, 3).map((r) => (
                  <div key={r.id} className="border border-slate-100 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif-sc font-medium text-slate-700">{r.nickname}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="space-y-0.5 text-slate-600">
                      {fields.map((f) => {
                        const label = EXPORTABLE_FIELDS.find((ef) => ef.key === f)?.label || f;
                        let val: string;
                        if (f === 'status') val = STATUS_LABEL[r.status];
                        else if (f === 'isSupplemented') val = r.isSupplemented ? '是' : '否';
                        else {
                          const raw = String(r[f as keyof typeof r] ?? '');
                          val = desensitizePrivate ? desensitizeField(f, raw) : raw;
                        }
                        const isPriv = EXPORTABLE_FIELDS.find((ef) => ef.key === f)?.isPrivate;
                        return (
                          <div key={f} className="flex items-start gap-2">
                            <span className="text-slate-400 shrink-0 w-20">{label}</span>
                            <span className={`break-all ${isPriv ? 'font-mono text-slate-500' : 'text-slate-700'}`}>
                              {val || '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {targetRecords.length > 3 && (
                  <p className="text-xs text-center text-slate-400 py-1">
                    还有 {targetRecords.length - 3} 条记录未显示...
                  </p>
                )}
              </div>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-medical-50 border border-medical-200 rounded-xl p-4">
              <p className="text-sm font-medium text-medical-700 mb-1">已选择 {selectedIds.length} 条记录</p>
              <p className="text-xs text-medical-600/80">
                将仅导出列表中勾选的记录。返回首页可修改选择。
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4">
            <h3 className="font-serif-sc text-sm font-semibold text-slate-700 mb-2">📌 导出一致性说明</h3>
            <ul className="text-xs text-slate-600/80 space-y-1.5">
              <li>• 字段顺序、状态文字与列表摘要严格一致</li>
              <li>• CSV 与 Markdown 输出内容完全对应</li>
              <li>• 隐私字段泄露时审计日志永久留存，供主管复查</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
