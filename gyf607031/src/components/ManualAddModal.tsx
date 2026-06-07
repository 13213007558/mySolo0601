import { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import type { Baby } from '../../shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; room: string; className: string }) => Promise<Baby | null>;
}

export default function ManualAddModal({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [room, setRoom] = useState('三楼婴儿房A');
  const [className, setClassName] = useState('向日葵班');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Baby | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    const baby = await onSubmit({ name: name.trim(), phone, room, className });
    setSubmitting(false);
    if (baby) {
      setCreated(baby);
    }
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setRoom('三楼婴儿房A');
    setClassName('向日葵班');
    setCreated(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="paper-card w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-clay-500" />
          <h2 className="h-display text-lg flex-1">手工补录</h2>
          <button className="btn-ghost !p-2" onClick={handleClose}><X className="w-4 h-4" /></button>
        </div>

        {created ? (
          <div className="p-6">
            <div className="paper-card p-5 bg-sage-50 border-sage-200">
              <div className="text-sm font-semibold text-sage-700 mb-2">补录成功</div>
              <div className="text-sm text-ink-700 space-y-1">
                <div>姓名：{created.name}</div>
                <div>编号：{created.id}</div>
                <div>房间：{created.room} / {created.className}</div>
                <div>联系电话：{created.phone || '—'}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-sage-200 text-xs text-ink-500 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
                该记录已标记为「手工补录」，所有操作将进入审计日志，可在详情页继续追加备注
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn-primary" onClick={handleClose}>完成</button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <div className="label">姓名 <span className="text-clay-500">*</span></div>
              <input className="input" placeholder="请输入宝宝姓名" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <div className="label">联系电话</div>
              <input className="input" placeholder="例如：13812345678" value={phone} onChange={e => setPhone(e.target.value)} />
              <div className="text-xs text-ink-400 mt-1">格式不规范也允许保存，将在列表显示异常标记</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="label">所在房间</div>
                <select className="input" value={room} onChange={e => setRoom(e.target.value)}>
                  <option>三楼婴儿房A</option>
                  <option>三楼婴儿房B</option>
                  <option>三楼婴儿房C</option>
                </select>
              </div>
              <div>
                <div className="label">班级</div>
                <select className="input" value={className} onChange={e => setClassName(e.target.value)}>
                  <option>向日葵班</option>
                  <option>小海豚班</option>
                  <option>小蜜蜂班</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={handleClose}>取消</button>
              <button className="btn-primary" disabled={submitting || !name.trim()} onClick={handleSubmit}>
                {submitting ? '提交中…' : '确认补录'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
