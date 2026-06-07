import { useState } from "react";
import Modal from "./Modal";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/utils/export";

interface Props {
  open: boolean;
  onClose: () => void;
  summary: string;
}

export default function ExportModal({ open, onClose, summary }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(summary);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="导出随访摘要" width="max-w-2xl">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          下方为可直接转发同事的人可读摘要，不含内部字段名或错误码：
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
            {summary}
          </pre>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">
            提示：复制后可直接粘贴至微信/飞书发送给同事
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>
              关闭
            </button>
            <button className="btn-primary" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check size={16} />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={16} />
                  复制到剪贴板
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
