import { AlertTriangle, Paperclip, X } from 'lucide-react';
import type { OilTempRecord } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';

interface AttachmentCellProps {
  record: OilTempRecord;
}

export function AttachmentCell({ record }: AttachmentCellProps) {
  const { updateRecord } = useOilTempStore();

  const handleClearAttachment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (record.attachmentUrl) {
      updateRecord(record.id, {
        attachmentUrl: '',
        attachmentMissing: true,
      });
    }
  };

  const handleSubmitWithMissing = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateRecord(record.id, {
      attachmentMissing: true,
      remark: record.remark
        ? `${record.remark} | 附件丢失，保留原值提交`
        : '附件丢失，保留原值提交',
    });
  };

  if (record.attachmentMissing) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-xs"
        title="附件已丢失，保留原值"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>附件丢失</span>
      </div>
    );
  }

  if (record.attachmentUrl) {
    return (
      <div className="flex items-center gap-1.5 group">
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-xs">
          <Paperclip className="w-3.5 h-3.5" />
          <span>已上传</span>
        </div>
        <button
          onClick={handleClearAttachment}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
          title="清除附件（模拟丢失）"
        >
          <X className="w-3 h-3 text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSubmitWithMissing}
      className="flex items-center gap-1.5 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-400 text-xs hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
      title="点击提交：附件丢失但保留原值"
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>无附件</span>
    </button>
  );
}
