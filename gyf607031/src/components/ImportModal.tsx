import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import type { ImportResult } from '../../shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (rows: { name: string; phone: string; room: string; className: string }[]) => Promise<ImportResult | null>;
  result: ImportResult | null;
}

const SAMPLE_ROWS = [
  { name: '张小华', phone: '136-0000-1234', room: '三楼婴儿房A', className: '向日葵班' },
  { name: '李朵朵', phone: '', room: '三楼婴儿房B', className: '小海豚班' },
  { name: '赵乐乐', phone: '13812345678', room: '三楼婴儿房A', className: '向日葵班' },
];

export default function ImportModal({ open, onClose, onImport, result }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const parseText = () => {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];
    return lines.map(line => {
      const parts = line.split(/[,\t，]/).map(p => p.trim());
      return {
        name: parts[0] || '',
        phone: parts[1] || '',
        room: parts[2] || '三楼婴儿房A',
        className: parts[3] || '向日葵班',
      };
    });
  };

  const handleImport = async () => {
    const rows = parseText();
    if (rows.length === 0) return;
    setSubmitting(true);
    await onImport(rows);
    setSubmitting(false);
  };

  const loadSample = () => {
    setText(SAMPLE_ROWS.map(r => r.name + ',' + r.phone + ',' + r.room + ',' + r.className).join('\n'));
  };

  const rowClass = (success: boolean) =>
    'flex items-center gap-3 text-sm ' + (success ? 'text-ink-600' : 'text-clay-600');

  return (
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="paper-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center gap-3">
          <Upload className="w-5 h-5 text-sage-600" />
          <h2 className="h-display text-lg flex-1">导入导出表数据</h2>
          <button className="btn-ghost !p-2" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto scrollbar-thin">
          <div>
            <div className="label">粘贴导出表内容</div>
            <textarea
              className="input resize-none h-48 font-mono text-sm"
              placeholder="每行一条，格式：姓名,手机号,房间,班级（逗号或Tab分隔）"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="flex items-center justify-between mt-2 text-xs text-ink-500">
              <button className="text-sage-600 hover:underline" onClick={loadSample}>使用演示数据试试</button>
              <span>支持从 Excel / CSV 直接复制粘贴</span>
            </div>
          </div>

          {result && (
            <div className="paper-card p-4 border-l-4 border-sage-400">
              <div className="flex items-center gap-4">
                <div className="text-sm font-semibold text-ink-700">导入结果</div>
                <span className="chip bg-paper-100 text-ink-600 border border-ink-200">
                  共 {result.total} 条
                </span>
                <span className="chip bg-sage-50 text-sage-700 border border-sage-200">
                  <CheckCircle2 className="w-3 h-3" />
                  成功 {result.success}
                </span>
                {result.failed > 0 && (
                  <span className="chip bg-clay-50 text-clay-700 border border-clay-200">
                    <AlertCircle className="w-3 h-3" />
                    异常 {result.failed}
                  </span>
                )}
              </div>
              <div className="mt-3 max-h-40 overflow-y-auto scrollbar-thin space-y-1.5">
                {result.items.map(item => (
                  <div key={item.row} className={rowClass(item.success)}>
                    {item.success
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-sage-500 shrink-0" />
                      : <AlertCircle className="w-3.5 h-3.5 text-clay-500 shrink-0" />
                    }
                    <span className="w-8 text-xs text-ink-400 shrink-0">行{item.row}</span>
                    <span className="font-medium shrink-0 w-20 truncate">{item.name}</span>
                    <span className="font-mono text-xs shrink-0 w-32 truncate">{item.phone || '(空)'}</span>
                    {item.reason && <span className="text-xs text-ink-500 truncate">{item.reason}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-ink-100 text-xs text-ink-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                手机号格式异常者已允许部分成功导入，可在详情页补正
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            {result ? '完成' : '取消'}
          </button>
          {!result && (
            <button
              className="btn-primary"
              disabled={submitting || !text.trim()}
              onClick={handleImport}
            >
              {submitting ? '导入中…' : '开始导入'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
